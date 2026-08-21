#!/usr/bin/env bash
#
# Manual deployment of the NHY-QR Ad Manager API to Azure App Service.
#
# This is the same sequence the GitHub Actions workflow runs
# (.github/workflows/azure-deploy.yml); use it for a one-off deploy or to
# reproduce a CI failure locally.
#
#   cp .env.azure.example .env.azure   # then fill it in
#   ./deploy/azure/deploy-azure.sh
#
# Requires: az CLI (logged in via `az login`), node, npm, zip.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env.azure"

if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found. Copy .env.azure.example and fill it in." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

: "${AZURE_SUBSCRIPTION_ID:?set in .env.azure}"
: "${AZURE_RESOURCE_GROUP:?set in .env.azure}"
: "${AZURE_APP_SERVICE_PLAN:?set in .env.azure}"
: "${AZURE_APP_NAME:?set in .env.azure}"
: "${DATABASE_URL:?set in .env.azure}"
: "${JWT_SECRET:?set in .env.azure}"
: "${JWT_REFRESH_SECRET:?set in .env.azure}"

NODE_VERSION="${NODE_VERSION:-20}"
HEALTH_PATH="/api/health"
BACKEND_URL="https://${AZURE_APP_NAME}.azurewebsites.net"
ZIP_PATH="${REPO_ROOT}/api.zip"

echo "==> Using subscription ${AZURE_SUBSCRIPTION_ID}"
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

echo "==> Building the API"
cd "${REPO_ROOT}/backend"
npm ci
npx prisma generate
npm run build

echo "==> Applying database schema"
if [ -d prisma/migrations ]; then
  npx prisma migrate deploy
else
  echo "    no prisma/migrations directory — using 'prisma db push'"
  npx prisma db push --skip-generate
fi

echo "==> Packaging"
npm prune --omit=dev
# The generated client must survive the prune; the prisma CLI is a
# devDependency and is no longer installed at this point.
test -d node_modules/.prisma/client
rm -f "$ZIP_PATH"
zip -qr "$ZIP_PATH" dist node_modules package.json prisma

echo "==> Ensuring the App Service exists"
if ! az webapp show \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --name "$AZURE_APP_NAME" >/dev/null 2>&1; then
  az webapp create \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --plan "$AZURE_APP_SERVICE_PLAN" \
    --name "$AZURE_APP_NAME" \
    --runtime "NODE:${NODE_VERSION}-lts"
fi

az webapp config set \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$AZURE_APP_NAME" \
  --linux-fx-version "NODE|${NODE_VERSION}-lts" \
  --startup-file "node dist/index.js" \
  --health-check-path "$HEALTH_PATH" \
  --ftps-state Disabled \
  --http20-enabled true \
  --always-on true

az webapp update \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$AZURE_APP_NAME" \
  --https-only true

echo "==> Applying application settings"
SETTINGS_FILE="$(mktemp)"
trap 'rm -f "$SETTINGS_FILE"' EXIT

# Marshalled through a file so no secret reaches the process list or shell
# history via a command line argument.
{
  printf '['
  first=1
  emit() {
    local value="${2:-}"
    [ -z "$value" ] && return 0
    [ $first -eq 0 ] && printf ','
    first=0
    printf '%s' "$(jq -nc --arg n "$1" --arg v "$value" \
      '{name: $n, value: $v, slotSetting: false}')"
  }

  emit NODE_ENV "${NODE_ENV:-production}"
  emit SCM_DO_BUILD_DURING_DEPLOYMENT "false"
  emit BACKEND_URL "$BACKEND_URL"
  emit FRONTEND_URL "${FRONTEND_URL:-$BACKEND_URL}"
  emit DATABASE_URL "$DATABASE_URL"
  emit JWT_SECRET "$JWT_SECRET"
  emit JWT_REFRESH_SECRET "$JWT_REFRESH_SECRET"
  emit RAZORPAY_KEY_ID "${RAZORPAY_KEY_ID:-}"
  emit RAZORPAY_KEY_SECRET "${RAZORPAY_KEY_SECRET:-}"
  emit RAZORPAY_WEBHOOK_SECRET "${RAZORPAY_WEBHOOK_SECRET:-}"
  emit CLOUDINARY_CLOUD_NAME "${CLOUDINARY_CLOUD_NAME:-}"
  emit CLOUDINARY_API_KEY "${CLOUDINARY_API_KEY:-}"
  emit CLOUDINARY_API_SECRET "${CLOUDINARY_API_SECRET:-}"
  emit TWILIO_SID "${TWILIO_SID:-}"
  emit TWILIO_AUTH_TOKEN "${TWILIO_AUTH_TOKEN:-}"
  emit TWILIO_PHONE_NUMBER "${TWILIO_PHONE_NUMBER:-}"
  emit FAST2SMS_API_KEY "${FAST2SMS_API_KEY:-}"
  emit INSTAGRAM_CLIENT_ID "${INSTAGRAM_CLIENT_ID:-}"
  emit INSTAGRAM_CLIENT_SECRET "${INSTAGRAM_CLIENT_SECRET:-}"
  emit FACEBOOK_CLIENT_ID "${FACEBOOK_CLIENT_ID:-}"
  emit FACEBOOK_CLIENT_SECRET "${FACEBOOK_CLIENT_SECRET:-}"
  emit GOOGLE_CLIENT_ID "${GOOGLE_CLIENT_ID:-}"
  emit GOOGLE_CLIENT_SECRET "${GOOGLE_CLIENT_SECRET:-}"
  emit YOUTUBE_CLIENT_ID "${YOUTUBE_CLIENT_ID:-}"
  emit YOUTUBE_CLIENT_SECRET "${YOUTUBE_CLIENT_SECRET:-}"
  printf ']'
} > "$SETTINGS_FILE"

az webapp config appsettings set \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$AZURE_APP_NAME" \
  --settings @"$SETTINGS_FILE" \
  --output none

echo "==> Deploying"
az webapp deploy \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$AZURE_APP_NAME" \
  --src-path "$ZIP_PATH" \
  --type zip \
  --clean true \
  --restart true

echo "==> Verifying ${BACKEND_URL}${HEALTH_PATH}"
for attempt in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 \
    "${BACKEND_URL}${HEALTH_PATH}" || echo 000)
  if [ "$code" = "200" ]; then
    echo "Deployed and healthy: ${BACKEND_URL}"
    exit 0
  fi
  echo "    attempt ${attempt}: HTTP ${code} — retrying in 15s"
  sleep 15
done

echo "error: the health endpoint never returned 200." >&2
echo "Inspect logs with:" >&2
echo "  az webapp log tail --resource-group $AZURE_RESOURCE_GROUP --name $AZURE_APP_NAME" >&2
exit 1
