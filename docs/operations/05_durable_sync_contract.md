# Durable Synchronization Contract

## Purpose

Financial reference data is refreshed only through the durable Inngest
integration. A public browser request must never start a detached full sync.

## Trigger ownership

- Scheduled refreshes originate from the registered Inngest cron function.
- An administrator may request a sync through an authenticated POST boundary.
- The POST boundary enqueues work; it does not execute provider calls inline.
- Public pages only display freshness and never initiate a refresh.
- Local development uses the Inngest development endpoint.

## Event contract

- Event name identifies the synchronization capability.
- Event payload includes a generated idempotency key.
- Payload includes requested mode, actor class, and correlation ID.
- Payload never includes secrets, OAuth tokens, or raw user input.
- Every event has a schema version.
- Unknown event fields are rejected at the receiving boundary.

## Execution contract

- One active lock owner may run a scope at a time.
- The lock has a lease expiry and an owner identifier.
- A retried event can recover an expired lease.
- A live owner renews only while work is progressing.
- Repeated idempotency keys return the existing run outcome.
- Each provider result is recorded independently.
- One provider failure does not erase last-known-good data.
- The overall outcome records success, partial, or failed.

## Retry contract

- Inngest owns retry scheduling and exponential backoff.
- The function declares a bounded retry count.
- Provider failures are retryable only when transient.
- Validation and unsupported-mode failures are terminal.
- Terminal failures create an operator-visible dead-letter record.
- Operators can replay a failed idempotency key after remediation.
- Replay does not bypass authorization or lock ownership.

## Observability

- Record provider name and source class.
- Record records scanned, inserted, updated, skipped, and rejected.
- Record started, finished, and freshness-transition timestamps.
- Record latency without raw provider payloads.
- Record lock owner and retry attempt.
- Record correlation ID for support diagnostics.
- Preserve last known successful data date separately from last attempt.
- Emit an alert when critical freshness exceeds its documented threshold.

## Security

- Inngest signing configuration is a runtime secret.
- The browser never receives a signing key.
- Operator endpoints use server-side admin authorization.
- Sync routes use the dedicated cost-aware rate policy.
- Logs redact provider credentials and authorization headers.
- Provider error text is server-only unless mapped to a safe code.

## Failure modes

- If Inngest is unavailable, the admin route returns a retryable safe problem.
- If a lock is held, the event exits idempotently with the active run ID.
- If an event is duplicated, only one run mutates the data scope.
- If process lifetime ends, Inngest resumes from durable steps.
- If a provider returns malformed data, reject the record and preserve history.
- If all providers fail, retain prior data and surface stale freshness.

## Required tests

- Public users cannot enqueue work.
- Admin request enqueues exactly one event.
- Duplicate event keys do not duplicate a run.
- Expired lock recovery succeeds.
- Live lock contention is safe.
- Retryable provider failure is retried.
- Terminal decoder failure is not retried.
- Partial provider result keeps last-known-good data.
- Dead-letter/replay metadata is redacted.
- Freshness display does not trigger work.

## External evidence

- Redacted deployed function identifier and cron schedule.
- Redacted signed delivery observation.
- Redacted retry/dead-letter observation.
- Redacted operator replay observation.
- Redacted freshness alert observation.

Until those artifacts exist, SEC-07, REL-02, and SCALE-03 remain blocked.

Repository tests are not deployment evidence.

Production observation closes the gate.
