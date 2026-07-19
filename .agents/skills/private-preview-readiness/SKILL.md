---
name: private-preview-readiness
description: Produce or update evidence that the private Cloud Run preview is operationally ready. Use when preparing a preview deployment, verifying Cloud Run health/readiness, configuring or checking Google OAuth, or recording the results of release checks.
---

# Private Preview Readiness

Treat this as a pre-public-launch operational milestone. Read `CONTEXT.md`, `docs/plans/08_cloud_run_release_candidate_plan.md`, and `docs/operations/02_cloud_run_private_preview.md` before acting.

## Workflow

1. Inspect the current deployed revision with `pnpm ops:cloud-run-status`. Do not reveal secret values.
2. Run the applicable local checks first: `pnpm check:release` for a release candidate and `pnpm check:prod-config` only in an environment with the intended production variables.
3. Verify the private service with `pnpm ops:verify-prod`. Use `--allow-missing-oauth` only when OAuth is explicitly deferred; authenticated private-preview readiness requires Google OAuth and a signed-in workspace access check.
4. Confirm `/api/health`, `/api/readiness`, `/single-calculator`, and calculation defaults behave as documented. For a new deploy, verify the expected revision receives all traffic.
5. Record commands, revision, timestamps, pass/fail results, known exceptions, and the next owner/action in the existing release-evidence artifact. Do not claim public-launch readiness.

## Guardrails

- Keep the service private unless the user explicitly requests a public launch.
- Treat a readiness exception as unresolved evidence, not a passing result.
- Do not deploy, roll back, alter Cloud Run IAM, or configure secrets without explicit user authorization.
