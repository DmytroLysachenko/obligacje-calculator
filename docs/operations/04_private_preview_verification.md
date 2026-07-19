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
