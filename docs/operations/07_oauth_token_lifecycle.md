# OAuth token lifecycle runbook

## Inventory

Auth.js stores provider-issued tokens only in the `account` table. The fields
are `access_token`, `refresh_token`, `id_token`, `expires_at`, `token_type`,
`scope`, and `session_state`. They are never included in browser storage, API
responses, analytics, or application logs. The application currently requests
only each configured provider's default scopes.

## Retention

An account token exists only for the lifetime of its Auth.js account row.
Account deletion must delete the user and its cascading account/session rows.
Managed backups can retain deleted data only for the deployed PITR interval;
the interval and restore-access review belong in the redacted evidence record.

## Revocation procedure

1. Disable the affected provider credentials and rotate the client secret.
2. Revoke affected grants in the provider console where the provider supports
   revocation.
3. Delete affected Auth.js `account` rows and sessions, or delete the user for
   an account compromise, so the subject must authenticate again.
4. Review only redacted correlation IDs and operator-access records. Do not
   copy tokens, authorization headers, or OAuth callback payloads into logs or
   tickets.
5. Record the date, operator, provider, affected-account count, revocation
   result, and follow-up in `docs/operations/evidence-template.md`.

## Evidence and cadence

Review this inventory when a provider or scope changes and at least quarterly.
The deployment-specific retention interval, provider-console revocation result,
and reviewer sign-off remain external evidence; a repository runbook is not a
claim that those production actions occurred.
