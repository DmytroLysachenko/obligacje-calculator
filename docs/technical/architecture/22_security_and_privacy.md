# 22. Security & Privacy

## Rendering boundary

The application keeps a nonce-bearing CSP for request-specific rendering.
Structured data is serialized with `serializeJsonLd`, which escapes HTML-significant
characters before it enters an inline `application/ld+json` script. New inline
scripts must be avoided where possible; when required, they must use the server
nonce and retain equivalent escaping tests. Performance work may move data and
components to cacheable boundaries, but must not weaken CSP, frame protection,
MIME-sniffing protection, HSTS, or the strict referrer policy.

## Mutation boundary

Cookie-authenticated portfolio mutations are same-origin only. The server rejects
cross-site or opaque `Sec-Fetch-Site` requests and foreign or malformed `Origin`
headers. A sibling subdomain is not accepted merely because it is same-site. An
absent `Origin` is permitted only for a non-browser request or an explicitly
same-origin fetch; service callers remain behind their own server-side
authentication boundary. The API does not expose permissive CORS. A future
trusted cross-origin client requires a dedicated CSRF-token design and a
documented allowlist rather than a relaxation of the default policy.

## Data classification and operator handling

| Data class                      | Examples                                               | Handling                                                                                                |
| ------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Public financial reference data | bond offers, macro series, calculator assumptions      | May be cached with a declared source revision and freshness timestamp.                                  |
| Account data                    | Auth.js user, session, and OAuth account records       | Available only to the authenticated subject and database operators with an audited need.                |
| Portfolio data                  | lots, notes, exported holdings, shared-workspace state | Enforced by owner-scoped repository queries; never included in public telemetry.                        |
| Credentials                     | OAuth tokens, database URLs, signing/admin secrets     | Supplied through runtime secret configuration; never rendered, persisted in browser storage, or logged. |

Server logs use structured, redacted fields. Error responses expose stable machine
codes and correlation identifiers, not provider, SQL, OAuth, or token material.
Performance telemetry is sampled server-side and aggregated only by metric,
validated pathname, rating, and UTC hour bucket. It excludes query strings,
scenario inputs, account identifiers, full URLs, user agents, navigation payloads,
and individual-event records. The aggregate store retains count, sum, min, and
max only for 30 days; its durable Inngest cleanup is idempotent. A deployed
aggregate receipt remains required external evidence before field-RUM performance
claims are made.

## Sessions, authorization, and deletion

Auth.js sessions establish the application identity. Administrative status and
synchronization require a server-side allowlist decision; the browser receives
only capability/status information. Guest portfolio ownership is represented by
an HttpOnly, `SameSite=Lax`, path-scoped cookie with a one-year maximum age. It
is marked `Secure` in production and is not an administrator credential. Guest
portfolio writes are not permitted: signing in is required before every
workspace mutation. Logout removes the Auth.js session according to the provider
flow; it does not transfer guest-owned data into an account or delete the guest
cookie automatically. Users should clear site data to discard a guest notebook.

Account deletion, token revocation, backup retention, and restore access are
operational controls. Their current owner, retention duration, and quarterly
restore result must be recorded in the redacted operations evidence artifact;
until then they are explicitly blocked rather than represented as guaranteed.

## Incident and vulnerability response

Report a suspected vulnerability privately to the maintainers; do not include
credentials or production data in a public issue. Triage secrets, authorization,
financial correctness, and data-integrity reports as release blockers. Rotate
affected credentials, revoke OAuth grants where appropriate, preserve minimal
redacted evidence, and document remediation in the release record. Dependency,
secret, static-analysis, and container scanning are required CI controls once
the operations evidence gate has enabled them.

## OAuth token inventory and lifecycle

The Auth.js database adapter persists provider-issued account fields only in the
`account` table: `access_token`, `refresh_token`, `id_token`, `expires_at`,
`token_type`, `scope`, and `session_state`. The application does not read those
values in browser code, API responses, analytics, or application logs. Google
and Facebook providers are configured with their provider defaults; no
application-specific scope is requested. A provider change must document its
exact scopes before it ships.

Database and managed-backup encryption are the deployment platform's
responsibility. This repository does not implement application-level envelope
encryption for Auth.js account-token columns. Operators must therefore limit
production database and backup access to approved break-glass roles, record
that access, and use the evidence gate before claiming stronger protection.

Tokens are retained only while their Auth.js account row remains. Account
deletion must delete the user and cascading account/session rows, then revoke
the provider grant where that provider supports revocation. Backups may retain
deleted rows until their configured expiry; the deployed retention interval and
restore access are external evidence, not a repository claim.

### Token incident and revocation runbook

1. Disable affected provider credentials and rotate the provider client secret.
2. Revoke affected provider grants/tokens from the provider console.
3. Delete affected `account` rows and sessions, or delete the user for an
   account compromise; force re-authentication.
4. Review redacted correlation IDs and operator-access records. Never paste a
   token, authorization header, or callback payload into a ticket or log.
5. Record date, operator, provider, affected-account count, revocation result,
   and follow-up in the redacted operations evidence record.

## Verification cadence

## Public sharing boundary

Public share identifiers are unguessable references, not authorization
credentials for private workspace data. A share URL is constructed only from
the validated canonical application URL; request host, forwarded host, and
browser origin values never influence a persisted or returned URL.

Creation payloads use strict schemas and bounded text. Creation receives a
cost-aware rate policy and, where an account exists, combines account and IP
quota. Shared scenarios have a documented expiry and cleanup process. A public
share may expose only the serialized scenario selected for publication, never a
portfolio, owner identifier, session state, raw telemetry, or private notes.

Abuse reports use `POST /api/scenarios/share/report` with only an opaque share
reference and a bounded reason code; they identify the share reference and
correlation ID in redacted operator logs. The report path does not resolve or
reveal whether an identifier exists to an unauthenticated caller.
Deletion/expiry takes precedence over cache display. Search engines must not
receive user-generated share pages as public landing content unless a future
product policy explicitly permits it.

### Share lifecycle controls

The share service has four distinct lifecycle decisions:

1. creation validates a small publishable snapshot and assigns an opaque ID;
2. reading resolves only a non-expired, published snapshot;
3. unpublishing removes public visibility immediately; and
4. scheduled retention cleanup deletes expired rows and records aggregate
   counts for operators.

The service does not use a share ID to infer ownership. A signed-in owner uses
the normal portfolio authorization path to publish, unpublish, or delete a
portfolio. A public reader can load only the intentionally serialized scenario
or public workspace projection. This prevents later additions to a private
portfolio from becoming visible through an old URL.

Quota policy is capability-specific. Anonymous creation is limited by trusted
client identity; authenticated creation also has an account limit. Both limits
are deliberately lower than inexpensive calculation reads because each accepted
share consumes retention and moderation capacity. A rate-limit response includes
only retry metadata and a correlation identifier, never an account/quota value.

Retention cleanup is idempotent. It may run more than once, but an expired share
must never be restored by a cache miss, an old browser response, or a retry.
The cleanup job records rows considered/deleted/rejected, duration, and failure
code without recording scenario payloads. Operators investigate reported abuse
using the opaque reference and redacted logs.

### Verification matrix

- Host-header and forwarded-host variants return the same canonical URL.
- A malformed input, unknown key, or overlong description is rejected before a
  row is created.
- Quota limits apply independently to anonymous and signed-in identities.
- An expired or unpublished ID returns the same not-found behavior as an
  unknown ID.
- Cleanup is safe to retry and cannot delete an unexpired item.
- Public response and telemetry payloads omit owner and scenario-private data.

These checks run before a share-policy change is released.

They are required release evidence.

They protect public data boundaries.

They are non-optional.

Every change to an authentication, ownership, import, sharing, synchronization,
or rendering boundary carries focused regression tests. Release verification
runs type checking, linting, the full Vitest suite, the curated financial suite,
the production build, and browser checks. The production dependency audit is a
signal, not proof that deployment configuration is safe.

Operational controls are reviewed after a deployment and quarterly thereafter:

- runtime identities retain only the permissions documented in the release
  evidence;
- migration identities, not Cloud Run runtime identities, hold DDL privileges;
- backup/PITR and restore drills are recorded without credentials or customer
  data;
- OAuth scopes and token storage are reviewed whenever a provider changes;
- CSP reports are sampled, redacted, and never used as a channel for user data.

Financial data is highly sensitive. Even though we are a simulation platform, we adhere to high security standards.
