# HTTP Boundary Contract

## Purpose

Every API route has one public responsibility: decode an untrusted request,
apply its named policy, delegate to a server service, and return a stable,
correlated response. Routes must not expose provider exceptions, database error
messages, authorization configuration, or raw request bodies.

## Correlation and failures

`apiHandler` attaches a validated caller request id or generates a new one. The
same id is sent in the response header and included in problem details so an
operator can find the server-side log without asking a user for a secret,
payload, cookie, or full URL.

An authorization failure is deliberately handled at the route boundary and
returns only its public status. Unexpected failures are mapped to the shared
problem-details format. Server logs retain the original exception through the
redacted logger; browser responses do not.

## Rate-limit identity

Client identity is not inferred from arbitrary forwarded headers. A deployment
must explicitly declare `TRUSTED_PROXY=1` before `x-forwarded-for` is accepted.
Without that contract the limiter uses only a valid direct `x-real-ip` value or
the anonymous bucket. This prevents a caller from choosing a new quota merely
by inventing a forwarded address.

Named policies reflect capability cost:

- ordinary reads use `api-read`;
- public share creation uses a low hourly write budget;
- telemetry uses a separate bounded ingestion budget;
- session-backed administration uses the smallest write budget.

Configured production runtime uses the PostgreSQL atomic counter adapter. Local
development and unit tests use the bounded in-memory adapter intentionally; it
is not a distributed correctness mechanism.

## Administrative routes

Browser administration is authenticated by the server session/allowlist. A
successful status read and sync request create a redacted audit event containing
only action, correlation id, normalized actor when available, and safe mode
detail. Credentials, headers, input bodies, and provider payloads are never
stored in audit events.

Administrative sync requests enqueue durable Inngest work and return `202`.
They never keep an HTTP request open while contacting external providers.

## Telemetry routes

Web-vital reporting is sampled before network work and honors DNT/GPC. The
endpoint accepts only metric name, bounded numeric value, rating, pathname, and
navigation type. Query parameters, account identifiers, scenario inputs, and
raw user-agent strings are not accepted. A content-length guard rejects an
oversized body before JSON decoding.

## Verification

- Unit-test policy values and shared-store adapter decisions.
- Test spoofed forwarded headers with and without trusted proxy mode.
- Test authorization failures and successful audit events.
- Test telemetry rejection for malformed, query-bearing, and oversized input.
- Verify production readiness after migrations so rate-limit and audit tables
  exist before traffic is served.
