# 24. Deployment & DevOps

The first production target is **Google Cloud Run**. The release should stay
narrow: trusted core routes only, with recovery-lab tools treated as secondary
unless they pass the same calculation and UX checks.

## 1. Hosting Environment

- **Platform:** Google Cloud Run.
- **Container:** checked-in `Dockerfile` builds the Next.js standalone output.
- **Build:** checked-in `cloudbuild.yaml` builds, pushes, and deploys the image.
- **Default region:** `europe-central2`, close to Polish users and supported by
  Cloud Run and Artifact Registry.
- **Runtime port:** Cloud Run provides `PORT`; the container exposes `8080` and
  runs the standalone `server.js` with `HOSTNAME=0.0.0.0`.

## 2. Required Production Migrations

The production database must include the additive migrations in `drizzle/`:

1. `0000_unified_schema.sql` creates the core calculator, metadata, and portfolio tables.
2. `0001_sync_runs.sql` creates sync history used by freshness reporting.
3. `0002_auth_tables.sql` creates the Auth.js adapter tables for OAuth sessions.

Do not deploy portfolio-auth changes until `0002_auth_tables.sql` is applied.
Without those tables, Auth.js cannot persist OAuth users, accounts, sessions, or
verification tokens. The application has defensive read paths for missing sync
history, but auth-backed portfolio management should be treated as unavailable
until the auth migration exists.

## 3. Required Environment Variables

Core runtime:

- `DATABASE_URL`: Neon/Supabase/Postgres connection string reachable from Cloud Run.
- `AUTH_SECRET`: Auth.js secret for session signing. `NEXTAUTH_SECRET` remains
  accepted as a compatibility fallback, but production should use `AUTH_SECRET`.
- `NEXT_PUBLIC_APP_URL`: canonical deployed app URL used by metadata and shared links.

OAuth providers:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_FACEBOOK_ID`
- `AUTH_FACEBOOK_SECRET`

At least one OAuth provider pair must be configured for users to sign in. The
login surface is intentionally OAuth-only; do not add password credentials
without revisiting storage, reset, throttling, and abuse controls.

Sync/admin:

- `SYNC_SECRET`: protects admin sync/status endpoints.
- Inngest signing/event keys if production Inngest is enabled.
- Any provider-specific sync credentials required by future data providers.

## 4. First Cloud Run Deploy

Prepare Google Cloud resources:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create obligacje-calculator \
  --repository-format=docker \
  --location=europe-central2
```

Run release checks before building:

```bash
pnpm check:release
```

Apply migrations and seed/sync the target database before promoting traffic:

```bash
npx drizzle-kit push
pnpm run db:seed:production
pnpm run sync:full
```

Submit the Cloud Build deployment:

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _REGION=europe-central2,_SERVICE=obligacje-calculator,_AR_REPOSITORY=obligacje-calculator
```

Set secrets and environment variables through Cloud Run service configuration or
Secret Manager. Do not commit `.env` files.

## 5. Deployment Guardrails

- Run migrations against the target database before warming the app.
- Run `pnpm check:release` before promoting a build.
- Verify `/api/health` returns `ok: true`.
- Verify `/api/readiness` returns `ok: true` after production env and database
  setup are complete.
- Verify `/login` shows the configured OAuth providers.
- Verify `/api/portfolio/access` reports `canManageWorkspace: true` after sign-in.
- Verify `/admin/status` shows recent `sync_runs` rows after a manual sync.
- Verify calculation meta displays both data coverage and last sync attempt when
  sync history is present.
- Verify single, comparison, regular investment, ladder, notebook, and economic
  data routes load on desktop and mobile widths.

## 6. Monitoring & Operations

- Cloud Run logs are the first operational log source for the initial deploy.
- Add uptime monitoring against `/api/health`.
- Add readiness monitoring against `/api/readiness` only where protected access
  or private uptime checks are available.
- Trigger `pnpm run sync:full` manually after deploy until scheduled production
  sync is configured.
- Treat failed or stale sync metadata as a release blocker when it affects trusted
  core calculator interpretation.
