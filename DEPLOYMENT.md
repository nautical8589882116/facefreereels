# Deploying to Azure App Service

The GitHub Actions workflow `.github/workflows/main_facefreereels.yml` builds and
deploys this repo to the **facefreereels** App Service on every push to `main`.

## What gets deployed

This is a monorepo, and a **single App Service hosts both halves**:

| Path | Contents |
|------|----------|
| `backend/dist/` | Compiled Express + Prisma API |
| `backend/public/` | The built React SPA (copied from `webapp/dist` during CI) |
| `backend/prisma/` | Schema + migrations, applied at startup |

Express serves `/api/*` and falls back to the SPA's `index.html` for every other
path, so client-side routes like `/dashboard` and `/scheduler` work on refresh.
The frontend calls the API at the relative path `/api`, so no CORS hop and no
hardcoded backend hostname.

## Required Azure configuration

### 1. Startup Command

The workflow sets this automatically via `startup-command`, but if you configure
it by hand (**Configuration → General settings → Startup Command**):

```
npm run start:azure
```

This runs `prisma migrate deploy` before starting the server, so the database
schema is created/updated on every deploy.

### 2. Application Settings

Set these under **Configuration → Application settings**. Everything the app
needs at runtime comes from here — nothing is baked into the image.

**Required — the app will not work without these:**

| Setting | Notes |
|---------|-------|
| `DATABASE_URL` | Azure Database for PostgreSQL connection string. Must include `?sslmode=require`. |
| `JWT_SECRET` | 32+ random chars — `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | Different 32+ random chars |
| `FRONTEND_URL` | `https://facefreereels.azurewebsites.net` (used for the CORS allowlist) |
| `BACKEND_URL` | `https://facefreereels.azurewebsites.net` (used to build OAuth callback URLs) |

**Recommended platform settings:**

| Setting | Value | Why |
|---------|-------|-----|
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` | CI already built and pruned; stops Oryx rebuilding on the server |
| `WEBSITE_RUN_FROM_PACKAGE` | `1` | Faster, atomic deploys |
| `NODE_ENV` | `production` | |

Do **not** set `PORT` — App Service injects it, and the server already reads it.

**Feature-gated — each is optional, and its feature degrades cleanly if absent:**

| Setting | Enables | Behaviour when missing |
|---------|---------|------------------------|
| `ANTHROPIC_API_KEY` | AI caption writing in the Scheduler | endpoint returns `503`, app runs fine |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Subscriptions/payments | payment endpoints return `503` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Asset uploads | uploads fail, rest of app runs |
| `TWILIO_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | OTP over SMS (global) | see note below |
| `FAST2SMS_API_KEY` | OTP over SMS (India, tried first for `+91`) | see note below |
| `INSTAGRAM_*`, `FACEBOOK_*`, `GOOGLE_*` / `YOUTUBE_*` client IDs + secrets | Connecting social accounts | OAuth connect fails |

> **Login needs at least one SMS provider.** With neither Twilio nor Fast2SMS
> configured, `POST /api/auth/otp/send` still returns `200` and writes the OTP
> row, but no SMS is delivered — so nobody can actually log in. Configure
> Fast2SMS (India) or Twilio before going live.

### 3. Database

Create an **Azure Database for PostgreSQL – Flexible Server**, then:

- Add a firewall rule allowing **"Allow public access from Azure services"**, or
  wire up VNet integration.
- Use a connection string of the form:
  ```
  postgresql://USER:PASSWORD@HOST.postgres.database.azure.com:5432/nhyqr_ad_manager?sslmode=require
  ```
- Migrations run automatically on deploy; no manual schema step is needed.

### 4. GitHub secrets

The workflow authenticates to Azure with OIDC using three secrets that Azure's
Deployment Center created in this repo:

- `AZUREAPPSERVICE_CLIENTID_F40C66F76BDE44F7B10FC894C2B09FEF`
- `AZUREAPPSERVICE_TENANTID_905EFC271A6B4DDD8115B0990A8B71D4`
- `AZUREAPPSERVICE_SUBSCRIPTIONID_42F3C0A12EF9463CA7CC875494FC628C`

If you recreate the App Service, Azure will add a **new** set of secrets — update
the names in the workflow's `Login to Azure` step to match, and update
`env.AZURE_WEBAPP_NAME` if the app name changed.

## Local development

```bash
# Terminal 1 — API on :4000
cd backend
cp ../.env.example .env      # fill in DATABASE_URL and the JWT secrets
npm install
npx prisma migrate dev
npm run dev

# Terminal 2 — SPA on :5173, proxying /api to :4000
cd webapp
npm install
npm run dev
```

## Known gaps

These are unrelated to deployment but worth knowing before you demo the app:

- **Publishing to social platforms is simulated.** `scheduler.service.ts`
  generates fake engagement numbers instead of calling the Instagram/Facebook/
  YouTube APIs.
- **Nothing publishes scheduled posts automatically.** `node-cron` is a
  dependency but is never wired up, so posts only publish when the publish
  endpoint is called by hand.
- **Reel generation is a stub** — it sets status to `PROCESSING` and never
  renders a video.
- **Most frontend pages still render mock data** rather than calling the API.
  Auth, payments, platform connect, and the Scheduler's AI caption button are
  wired to the real backend; the dashboards are not yet.
- **Platform OAuth tokens are stored unencrypted** in `platform_accounts`.
  Consider encrypting them at rest or moving them to Key Vault before handling
  real user accounts.
