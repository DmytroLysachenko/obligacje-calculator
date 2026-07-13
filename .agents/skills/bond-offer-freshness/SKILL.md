---
name: bond-offer-freshness
description: Verify and document current Polish treasury-bond offer freshness for the private preview. Use when running the monthly offer sync, investigating stale bond terms, checking the official source versus fallback data, or collecting data-provenance evidence.
---

# Bond Offer Freshness

Read `CONTEXT.md` and `docs/operations/01_monthly_bond_offer_sync.md` before acting. The normal evidence path uses the official `gov.pl` current-offer source; fallback data is a separately documented degraded mode.

## Workflow

1. Inspect the active offer month and the prior sync/status evidence before running anything.
2. Run `pnpm sync:bond-offers` only when the user authorizes the data refresh. Preserve the relevant non-secret log output.
3. Confirm the active `ROR` and `DOR` first-period rates, `EDO` first-year rate, and active issued-series metadata against the official current-offer source.
4. Verify that the private preview exposes source, coverage, freshness, and fallback state clearly on the economic-data and calculator contexts that use the data.
5. Record the offer month, source used, sync time, observed values, UI evidence, failures, and required follow-up in the release-evidence artifact.

## Guardrails

- A fallback-only run does not establish normal sync evidence; label it as degraded mode.
- Never silently replace official-source evidence with curated runtime values.
- Treat a discrepancy in current terms or freshness metadata as a release blocker until explained.
