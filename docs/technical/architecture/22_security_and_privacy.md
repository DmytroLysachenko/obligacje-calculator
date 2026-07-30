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
cross-site `Sec-Fetch-Site` requests and foreign or malformed `Origin` headers.
The API does not expose permissive CORS. A future trusted cross-origin client
requires a dedicated CSRF-token design and a documented allowlist rather than a
relaxation of the default policy.

## Data classification and operator handling

| Data class | Examples | Handling |
| --- | --- | --- |
| Public financial reference data | bond offers, macro series, calculator assumptions | May be cached with a declared source revision and freshness timestamp. |
| Account data | Auth.js user, session, and OAuth account records | Available only to the authenticated subject and database operators with an audited need. |
| Portfolio data | lots, notes, exported holdings, shared-workspace state | Enforced by owner-scoped repository queries; never included in public telemetry. |
| Credentials | OAuth tokens, database URLs, signing/admin secrets | Supplied through runtime secret configuration; never rendered, persisted in browser storage, or logged. |

Server logs use structured, redacted fields. Error responses expose stable machine
codes and correlation identifiers, not provider, SQL, OAuth, or token material.
Performance telemetry is aggregated by route template and application version;
it excludes query strings, scenario inputs, account identifiers, and full URLs.

## Sessions, authorization, and deletion

Auth.js sessions establish the application identity. Administrative status and
synchronization require a server-side allowlist decision; the browser receives
only capability/status information. Guest portfolio ownership is represented by
an HttpOnly cookie, marked `Secure` in production, and is not an administrator
credential. Logout removes the session according to the Auth.js provider flow.

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

Abuse reports identify the share reference and correlation ID. The report path
does not reveal whether an identifier exists to an unauthenticated caller.
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

## 1. Data Minimization

- **No Data Collection:** The platform should be fully functional without an account.
- **Local-First:** User investment data (Notebook) is stored in the browser's `IndexedDB` by default.
- **No PII:** We do not ask for names, bank account numbers, or real identities.

## 2. Security Best Practices

- **HTTPS Only:** All traffic encrypted via TLS.
- **Content Security Policy (CSP):** Strict policy to prevent XSS (Cross-Site Scripting).
- **Input Sanitization:** All user-provided numbers and strings are validated before being used in calculations or stored.
- **Dependency Auditing:** Monthly `npm audit` to check for vulnerabilities in libraries like `Decimal.js` or `Next.js`.

## 3. Calculation Integrity

- **Tamper-proof Engine:** The calculation core is versioned. Results include a "Version ID" so users can verify which logic was used.
- **No Client-Side Overrides:** While the engine runs on the client, the "Rules" (Margins, Tax rates) are fetched from the secure server-side database.

## 4. Privacy Policy (Summary)

- We do not sell user data.
- Analytics are anonymized (e.g., using Plausible instead of Google Analytics) to respect user privacy.
- If a user creates an account for syncing, their data is encrypted before storage.

## 5. Security for Account Features (Future)

- **Auth:** Use a trusted provider like Supabase Auth or Clerk.
- **Encryption:** Use Web Crypto API to encrypt the "Notebook" using a user-derived key before it ever leaves the browser.
- **MFA:** Support for Multi-Factor Authentication for any account-based features.
