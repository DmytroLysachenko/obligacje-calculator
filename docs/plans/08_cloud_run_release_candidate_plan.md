# 08. Cloud Run Release Candidate Plan

This plan covers the first production-style deployment target: **Google Cloud
Run**. The release scope is intentionally narrow and applies only to trusted
core surfaces.

## Release Scope

Default release-admission routes:

- education
- single calculator
- economic data

Comparison, regular investment, ladder, and notebook remain private-preview
candidates. They require independent evidence before admission and do not block
the default trusted-core release. Recovery-lab and secondary routes may remain
visible only if they are clearly demoted and do not create stronger production
promises than their validation supports.

## Calculation Trust Gates

Before release candidate signoff:

- official bond baseline tests pass for all supported bond families
- single and comparison agree for equivalent scenarios
- portfolio single-lot simulation agrees with matching single-bond output
- real-value output moves correctly when CPI changes
- ROR/DOR monthly payout, rollover, rebuy discount, and tax paths have coverage
- ROR/DOR retained-interest displays distinguish per-cycle retained interest from
  cumulative total wealth
- chart and table aggregation remains display-only, starts at the purchase date,
  and preserves terminal values

## Data And Sync Gates

Before release candidate signoff:

- `pnpm run sync:full` completes without provider-blocking failures
- admin status shows recent `sync_runs`
- admin status exposes per-series `lastDataPointDate`, `lastSyncAttemptAt`, and
  `lastSyncAttemptStatus`
- sidebar and calculation metadata distinguish latest data point from latest sync attempt
- economic data charts show source, coverage, fallback, and freshness state
- no trusted calculator depends on hidden fallback data

## Cloud Run Gates

Before promotion:

```bash
pnpm check:release
pnpm check:prod-config
```

Expanded, this runs typecheck, lint, the trusted-core release Vitest suite, and
production build. The broader `pnpm test:ci` inventory still contains legacy UI
contract tests that should be reconciled before treating the entire repository as
fully production-certified.

`pnpm check:prod-config` is the operator-side secret and environment check. Run
it from the shell or deployment context that has production values for
`DATABASE_URL`, `AUTH_SECRET` or `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`,
`SYNC_SECRET`, and at least one complete OAuth provider pair.

The release suite also locks Cloud Run artifacts and API/controller boundaries:
browser surfaces route API calls through shared clients, and migrated API routes
return through shared response helpers. Calculation endpoints parse request
bodies through `readJsonBody` and return calculation envelopes through `okJson`.

Deployment checks:

- Docker image builds from `Dockerfile`
- Cloud Build deploys using `cloudbuild.yaml`
- `/api/health` returns `ok: true`
- `/api/readiness` returns `ok: true`
- `/login` shows configured OAuth providers
- signed-in `/api/portfolio/access` reports `canManageWorkspace: true`
- `/admin/status` is protected by `SYNC_SECRET`
- `/admin/status` separates latest data-point coverage from latest sync attempt
- Auth.js provider selection comes from `lib/server/auth/provider-config.ts`
  rather than route/page-local environment branches
- readiness and production config checks use `lib/server/runtime/env.ts`
- single and comparison monthly/quarterly/yearly chart and table views are
  anchored to purchase date and preserve final withdrawal values

## Current Refactor Boundaries

The latest production-hardening tranche split several large UI and config
areas into clearer layers:

- optimizer page: `BondOptimizerClient` owns shell composition,
  `useOptimizerCalculator` owns state and calculation requests,
  `OptimizerInputPanel` owns form controls, and
  `OptimizerResultsPanel` owns ready/result/audit rendering
- economic-data page: the client owns data hooks and tab composition;
  `economic-page-model.ts` owns labels/metrics/guide models, and
  `EconomicDashboardSections` owns reference/status/guide sections
- comparison results: UI rendering uses `comparison-results-panel-model.ts` and
  `comparison-results-chart-model.ts` for metrics, chart rows, domains, and
  context-series decisions
- server runtime: readiness, admin auth, Auth.js, and production config checks
  read environment through centralized runtime helpers
- release contracts: retained-route scope, calculation route parsing, chart
  terminal-value preservation, and economic reference status mapping are covered
  by focused Vitest contracts inside `pnpm test:release`

## Manual QA Smoke

Run on desktop and mobile widths:

- single calculator: EDO 10y, ROR 10y, OTS short horizon, early withdrawal
- comparison: EDO vs ROR, monthly/quarterly/yearly chart and table views
- regular investment: DOR recurring plan and ladder-style long horizon
- ladder: maturity rows and chart cadence
- notebook: guest lock state, sign-in, save to active portfolio
- economic data: CPI/NBP charts, source health, fallback labels
- exports: CSV and PDF/report buttons on trusted calculator routes

## Non-Blocking Follow-Ups

- Playwright screenshots for retained route smoke checks
- scheduled Cloud Run sync job or Cloud Scheduler/Inngest production wiring
- stricter unused translation-key checks
- deeper manual copy review for secondary routes

## Verification Evidence

June 23, 2026 release-candidate tranche:

- `pnpm test:release`: passed, 41 files and 272 tests
- `pnpm check:types`: passed
- `pnpm lint`: passed
- `pnpm build`: passed

Local Windows build note: Next standalone tracing still printed the known
invalid filename copy warning for a Node external chunk, but the command exited
successfully. Treat the Linux Cloud Build image and Cloud Run health/readiness
checks as the production deployment signal.
