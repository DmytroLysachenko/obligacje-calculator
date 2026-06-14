# 24. Deployment & DevOps

Our infrastructure is designed for high performance, low cost, and zero-downtime updates.

## 1. Hosting Environment
- **Platform:** Vercel (for Next.js).
- **Benefits:** Global Edge Network, Instant Rollbacks, and Built-in Image Optimization.
- **Region:** `fra1` (Frankfurt) to minimize latency for Polish users.

## 2. CI/CD Pipeline (GitHub Actions)
1.  **Lint & Format:** Run Prettier and ESLint.
2.  **Test:** Run Vitest unit tests and Playwright E2E tests.
3.  **Audit:** Run the financial correctness audit.
4.  **Build:** Compile Next.js and the `finance-core` package.
5.  **Preview:** Deploy to a unique "Preview URL" for every Pull Request.
6.  **Deploy:** Push to Production on Merge to `main`.

## 3. Database Management
- **Provider:** Neon (Serverless Postgres) or Supabase.
- **Migration:** Apply checked-in SQL migrations before deploying application code.
- **Backups:** Daily automated snapshots.

### Required Production Migrations

The production database must include the additive migrations in `drizzle/`:

1. `0000_unified_schema.sql` creates the core calculator, metadata, and portfolio tables.
2. `0001_sync_runs.sql` creates sync history used by freshness reporting.
3. `0002_auth_tables.sql` creates the Auth.js adapter tables for OAuth sessions.

Do not deploy portfolio-auth changes until `0002_auth_tables.sql` is applied.
Without those tables, Auth.js cannot persist OAuth users, accounts, sessions, or
verification tokens. The application has defensive read paths for missing sync
history, but auth-backed portfolio management should be treated as unavailable
until the auth migration exists.

### Required Environment Variables

Core runtime:

- `DATABASE_URL`: Neon/Supabase Postgres connection string.
- `AUTH_SECRET`: Auth.js secret for session signing. `NEXTAUTH_SECRET` remains
  accepted as a compatibility fallback, but production should use `AUTH_SECRET`.

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
- Any provider-specific sync credentials required by future data providers.

### Deployment Guardrails

- Run migrations against the target database before warming the app.
- Run `pnpm exec tsc --noEmit` and `pnpm test:core` before promoting a build.
- Verify `/login` shows the configured OAuth providers.
- Verify `/api/portfolio/access` reports `canManageWorkspace: true` after sign-in.
- Verify `/admin/status` shows recent `sync_runs` rows after a manual sync.
- Verify calculation meta displays both data coverage and last sync attempt when
  sync history is present.

## 4. Monitoring & Observability
- **Error Tracking:** Sentry (captures both frontend and backend errors).
- **Logging:** Logtail or Vercel Logs.
- **Uptime:** BetterStack or Checkly monitoring the `/api/health` endpoint.
- **Analytics:** Plausible Analytics for privacy-conscious usage tracking.

## 5. Caching Strategy
- **Static Assets:** Cached forever on Vercel Edge.
- **Historical Data API:** Stale-While-Revalidate (SWR) with a 24-hour TTL.
- **GUS/NBP Data:** Cached in the database; revalidated only once a day.

## 6. Infrastructure as Code (IaC)
- Any complex cloud resources (e.g., S3 buckets for exports) are managed via Terraform or Pulumi to ensure reproducibility.
