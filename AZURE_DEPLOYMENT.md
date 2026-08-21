# Azure Deployment — NHY-QR Ad Manager

Deploys the backend API to Azure App Service, reusing the Azure setup that
already serves `nauticalsoft/Nautical`: the same subscription, tenant, resource
group, and Linux App Service plan. No new plan, database server, or Key Vault
is provisioned.

## Where the credentials live

**There is no Azure credential file in the Nautical repository, and none is
committed here.** Nautical authenticates to Azure through the GitHub Actions
secret `AZURE_CREDENTIALS`, which is stored in GitHub's secret store, not in
the repo. Everything Nautical checks in is non-secret: the subscription ID,
tenant ID, resource group, and plan name.

This repository follows the same rule. The Azure coordinates are in
`.env.azure.example` and in the workflow's `env:` block; every secret is read
from a GitHub Actions secret at deploy time.

| Item | Value |
|---|---|
| Subscription | `Azure subscription 1` (`73888504-282d-4ee8-acdb-0679df3b51e3`) |
| Entra tenant | `2472daa8-c3ca-4f6c-a482-c331f629cbeb` |
| Resource group | `posnauticals-rg` |
| Region | South India (`southindia`) |
| App Service plan | `posnauticals-plan` (Linux, Premium v3 P1v3) |
| App Service | `nhy-ad-manager` (created on first deploy) |
| Public hostname | `https://nhy-ad-manager.azurewebsites.net` |
| Health endpoint | `/api/health` |
| Runtime | Node 20 LTS, ZIP deploy |

## One-time setup

### 1. Mint a deployment credential

Do **not** copy Nautical's `AZURE_CREDENTIALS` value into this repository. A
service principal scoped to the whole subscription, shared across two products,
means a leak from either repo compromises both, and rotation breaks both at
once. Create a separate principal scoped to just this resource group:

```bash
az ad sp create-for-rbac \
  --name "nhy-ad-manager-deploy" \
  --role contributor \
  --scopes "/subscriptions/73888504-282d-4ee8-acdb-0679df3b51e3/resourceGroups/posnauticals-rg" \
  --sdk-auth
```

The command prints a JSON object. That JSON is the whole secret value — it is
shown once and cannot be retrieved again.

### 2. Add the repository secrets

In `nautical8589882116/facefreereels` → Settings → Secrets and variables →
Actions, add:

| Secret | Required | Notes |
|---|---|---|
| `AZURE_CREDENTIALS` | yes | The JSON from step 1 |
| `DATABASE_URL` | yes | PostgreSQL connection string, `?sslmode=require` on Azure |
| `JWT_SECRET` | yes | `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | yes | A different `openssl rand -base64 64` |
| `RAZORPAY_KEY_ID` | payments | Payment endpoints return 503 until set |
| `RAZORPAY_KEY_SECRET` | payments | |
| `RAZORPAY_WEBHOOK_SECRET` | payments | |
| `CLOUDINARY_CLOUD_NAME` | uploads | |
| `CLOUDINARY_API_KEY` | uploads | |
| `CLOUDINARY_API_SECRET` | uploads | |
| `TWILIO_SID` | OTP | Or use Fast2SMS |
| `TWILIO_AUTH_TOKEN` | OTP | |
| `TWILIO_PHONE_NUMBER` | OTP | |
| `FAST2SMS_API_KEY` | OTP (India) | Tried first for `+91` numbers |
| `INSTAGRAM_CLIENT_ID` / `_SECRET` | social | |
| `FACEBOOK_CLIENT_ID` / `_SECRET` | social | |
| `GOOGLE_CLIENT_ID` / `_SECRET` | social | |
| `YOUTUBE_CLIENT_ID` / `_SECRET` | social | |

Optionally add a repository **variable** `FRONTEND_URL` for CORS; it defaults
to the App Service hostname.

Unset optional secrets are skipped rather than written as empty settings, so
the app deploys and stays healthy with only the required four.

### 3. Provide a database

The app needs its own PostgreSQL database — use a dedicated database on the
existing POS PostgreSQL server rather than sharing the POS schema, since
Prisma owns its tables. Allow Azure services (and, for the schema step, GitHub
Actions runners) to reach the server, or the deploy fails at
`Apply database schema`.

## Deploying

Push to `main` with changes under `backend/`, or run the workflow manually from
the Actions tab. The workflow:

1. Builds and type-checks the API, then packages `dist`, production
   `node_modules`, `package.json`, and `prisma` into a ZIP.
2. Signs in with `AZURE_CREDENTIALS` and selects the subscription.
3. Creates `nhy-ad-manager` on `posnauticals-plan` if it does not exist, then
   sets HTTPS-only, the health check path, the startup command, and FTPS off.
4. Writes application settings from the secrets, via a file so no secret is
   echoed into the log.
5. Applies the database schema.
6. ZIP-deploys and restarts, then polls `/api/health` until it returns 200.

For a manual deploy, copy `.env.azure.example` to `.env.azure`, fill it in, and
run `./deploy/azure/deploy-azure.sh`. `.env.azure` is git-ignored.

## Known gaps

- **No migration history.** `backend/prisma/` has `schema.prisma` but no
  `migrations/` directory, so the deploy falls back to `prisma db push`. Run
  `npx prisma migrate dev --name init` and commit the result before this
  database holds data you cannot afford to lose; the workflow switches to
  `prisma migrate deploy` automatically once `prisma/migrations/` exists.
- **The frontend is not deployed.** `webapp/` has no `package.json`,
  `index.html`, or Vite config — only `src/`. It cannot be built, so this
  deployment covers the API only. Once the frontend build is committed, serve
  it from Azure Static Web Apps or add a static-serving step to the API.
- **No custom hostname.** The app answers on
  `nhy-ad-manager.azurewebsites.net`. Add a DNS record and run
  `az webapp config hostname add` when a custom domain is chosen.
- **Shared plan capacity.** `posnauticals-plan` is a one-worker P1v3 already
  running the POS services. This adds one more app to it; watch Application
  Insights before scaling.
