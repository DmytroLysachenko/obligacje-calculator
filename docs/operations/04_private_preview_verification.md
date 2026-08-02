# 04. Private Preview Verification

Use this log to record redacted evidence for private-preview operational readiness. Never add credentials, bearer tokens, database URLs, or user data.

## Required checks

1. `pnpm check:release`
2. `pnpm check:prod-config` with a complete OAuth provider
3. `pnpm ops:cloud-run-status`
4. `pnpm ops:verify-prod -- --expected-revision <revision>`
5. Manual Google sign-in and notebook workspace access
6. `pnpm sync:bond-offers` after explicit authorization, followed by official `gov.pl` ROR, DOR, EDO, and issued-series checks
7. Admin status plus calculator/economic-data source, coverage, freshness, and fallback observations

## Evidence entry template

### YYYY-MM-DD — private preview

- Revision and image:
- Release/config checks:
- OAuth and workspace check:
- Bond-offer source and values:
- Admin/status and user-visible freshness:
- Exceptions and owner:

# PostgreSQL migration evidence

Run `TEST_DATABASE_URL=... pnpm test:db` only against an isolated disposable
PostgreSQL fixture. The suite applies the entire Drizzle journal, verifies required
operational tables, owner-scoped portfolio data, aggregate telemetry constraints,
and rollback of a deliberately failed import. It must never point at preview or
production. Attach the redacted CI run URL to the release evidence record; local
success does not satisfy the external CI-evidence gate.

The fixture creates only UUID-prefixed test owners, portfolios, lots, shares, and
aggregate buckets. Test cleanup is transaction rollback or fixture disposal; it
does not issue broad deletes, truncate shared tables, or attempt migration down
against a deployed database. A failed migration is a release blocker. The safe
recovery action is to discard the isolated fixture, repair the reviewed forward
migration, and repeat the journal test from an empty fixture.

Required CI artifact:

- job URL and commit SHA;
- redacted assertion output showing the complete migration journal applied;
- isolated service/container identity (never a preview or production URL);
- success for required readiness tables before traffic is accepted;
- rollback proof for a deliberately failed multi-write import.

The artifact may be linked only after secrets, connection strings, account names,
and row values have been removed. Its absence keeps DATA-02, COR-03, TEST-04,
and REL-04 blocked for deployment evidence even while repository checks pass.

## Fixture checklist

1. Provision a database URL exclusively for the CI job and set it as
   `TEST_DATABASE_URL`.
2. Confirm the target name, host, and role do not match any preview or production
   configuration before executing the command.
3. Run `pnpm test:db`; the suite deliberately skips without the dedicated URL so
   ordinary local test runs cannot accidentally touch a database.
4. Preserve only the job-level result, migration names, and pass/fail totals.
5. Destroy the temporary database service or namespace after the job according to
   the CI provider’s isolation policy.

The test is forward-only. PostgreSQL production migrations are not automatically
reversible in the application because a down migration could delete valid user
data. The test’s controlled rollback proof instead verifies transaction behavior
with unique rows and an intentional application error. That is the supported
rollback evidence for an import: no created portfolio, lot, transaction, or
metadata update survives the failed unit of work.

Readiness evidence is evaluated twice in release practice: once immediately after
the journal applies, and once after the functional ownership/rollback scenarios.
Both checks require the Auth.js, sharing, audit, shared rate-limit, and aggregate
telemetry tables. If an expected table is missing, do not route traffic and do not
apply ad-hoc DDL from a handler; repair the ordered migration or the fixture.

Record the observed table list and journal version with the CI artifact.
