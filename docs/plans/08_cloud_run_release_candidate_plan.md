# 08. Cloud Run Release Candidate Plan

This plan covers the first production-style deployment target: **Google Cloud
Run**. The release scope is intentionally narrow and applies only to trusted
core surfaces.

## Release Scope

Release-blocking routes:

- education
- single calculator
- comparison
- regular investment
- ladder
- notebook
- economic data

Recovery-lab and secondary routes may remain visible only if they are clearly
demoted and do not create stronger production promises than their validation
supports.

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
- sidebar and calculation metadata distinguish latest data point from latest sync attempt
- economic data charts show source, coverage, fallback, and freshness state
- no trusted calculator depends on hidden fallback data

## Cloud Run Gates

Before promotion:

```bash
pnpm check:release
```

Expanded, this runs typecheck, lint, the trusted-core release Vitest suite, and
production build. The broader `pnpm test:ci` inventory still contains legacy UI
contract tests that should be reconciled before treating the entire repository as
fully production-certified.

The release suite also locks Cloud Run artifacts and API/controller boundaries:
browser surfaces route API calls through shared clients, and migrated API routes
return through shared response helpers.

Deployment checks:

- Docker image builds from `Dockerfile`
- Cloud Build deploys using `cloudbuild.yaml`
- `/api/health` returns `ok: true`
- `/api/readiness` returns `ok: true`
- `/login` shows configured OAuth providers
- signed-in `/api/portfolio/access` reports `canManageWorkspace: true`
- `/admin/status` is protected by `SYNC_SECRET`
- single and comparison monthly/quarterly/yearly chart and table views are
  anchored to purchase date and preserve final withdrawal values

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
