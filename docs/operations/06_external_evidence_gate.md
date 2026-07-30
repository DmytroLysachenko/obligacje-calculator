# External Evidence Gate

## Principle

- Repository code proves intent and local behavior.
- Production evidence proves deployed state.
- A template is not evidence.
- A green unit test is not a restore drill.
- A workflow file is not an IAM review.

## Cloud Run evidence

- Service and revision identifier.
- Immutable image digest.
- Deployment timestamp.
- Authenticated readiness response.
- Authenticated smoke result.
- Private/public ingress configuration.
- Min/max instance and concurrency configuration.
- Redacted runtime secret reference names.

## IAM evidence

- Workload identity provider identifier.
- Deployer service account identifier.
- Runtime service account identifier.
- Least-privilege role review.
- No long-lived cloud-key confirmation.
- Migration identity distinct from runtime identity.
- Runtime DDL-denial query result.

## Database evidence

- Managed backup/PITR retention configuration.
- Isolated restore drill timestamp.
- Restore RPO/RTO measurement.
- Migration version after deployment.
- Representative schema upgrade result.
- Query plan review for critical portfolio reads.
- Connection saturation observation under load.

## Sync evidence

- Deployed Inngest function identifier.
- Cron schedule observation.
- Signed event delivery observation.
- Retry/backoff observation.
- Dead-letter or terminal failure observation.
- Operator replay observation.
- Freshness alert observation.

## Performance evidence

- Load scenario and concurrency.
- Cold-start observation.
- Request p95 and error rate.
- CPU/memory saturation observation.
- Database connection observation.
- Aggregate field LCP/INP/CLS receipt.
- Privacy review of telemetry fields.

## Redaction

- Do not store database URLs.
- Do not store OAuth tokens.
- Do not store cookies or authorization headers.
- Do not store user scenarios or portfolio exports.
- Do store stable artifact links or redacted screenshots.
- Do store date, operator, reviewer, and result.

## Ledger transition

- `Blocked` names the exact missing external artifact.
- `In progress` names outstanding repository work.
- `Completed` requires code, tests, and required evidence.
- `Not applicable` explains why the audit item cannot apply.
- Never promote a status based on an assumption.

## Review cadence

- Review deployment evidence for each release.
- Review IAM and secrets quarterly.
- Run restore drill quarterly.
- Review load budget before access expansion.
- Review RUM aggregates monthly.
- Review token scopes when an OAuth provider changes.
- Retain only redacted records under repository governance.

## Escalation

- A failed restore drill blocks production-ready claims.
- Missing runtime DDL denial blocks schema-authority completion.
- Missing Inngest retry observation blocks durable-sync completion.
- Missing load evidence blocks scale-performance completion.
- Missing field receipt blocks RUM completion.

Evidence is reviewed by engineering and operations.

Reviewers record any exception.

They record its owner.
