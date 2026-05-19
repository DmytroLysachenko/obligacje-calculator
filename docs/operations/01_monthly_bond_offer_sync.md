# Monthly Bond Offer Sync

## Canonical command

Run:

```bash
pnpm sync:bond-offers
```

`pnpm sync:full` remains valid and runs the same workflow. `sync:bond-offers` exists as the operator-facing alias for monthly retail-offer freshness.

## What it updates

The sync path is implemented by:

- `lib/sync/run-full-sync.ts`
- `lib/sync/sync-engine.ts`

It refreshes:

- current bond-offer terms used by retained calculators
- persisted `polish_bonds` rows
- persisted `bond_series` rows for active monthly issued offers
- macro data used by the calculators and economic-data surfaces

## Source priority

The bond-offer refresh should resolve terms in this order:

1. official `gov.pl` current-offer pages
2. `obligacjeskarbowe.pl` fallback scraping
3. curated runtime constants as the final safety net

This keeps the calculators anchored to the authoritative monthly offer when available, while still allowing the app to degrade safely if upstream markup changes.

## Expected cadence

Run the sync at least once per month, ideally on the first day of the new sales window in `Europe/Warsaw`.

Recommended scheduler shape:

- cron: `0 8 1 * *`
- timezone: `Europe/Warsaw`

## Freshness expectations

Fresh current-offer data should reflect the active sales month for:

- first-period `ROR`/`DOR` rates
- first-year fixed rates for indexed and fixed-term bonds
- margins used after the opening fixed period
- active series metadata used for issued-offer resolution

If no active issued series is available, the app may fall back to curated current-offer definitions. It should not silently prefer stale `polish_bonds` values over fresher curated/runtime offer terms.

## Operational checks

After a sync run:

1. verify `ROR` first period matches the official monthly offer
2. verify `DOR` first period matches the official monthly offer
3. verify `EDO` first year matches the official monthly offer
4. verify current `bond_series` entries exist for the active month
5. verify retained calculators show the refreshed first-period context

## Failure mode

If upstream markup changes and official parsing fails:

- inspect `lib/sync/bond-scraper.ts`
- confirm whether `gov.pl` parsing still matches the current page structure
- verify fallback parsing from `obligacjeskarbowe.pl`
- rerun `pnpm sync:bond-offers` after adjusting the scraper

The app should continue to function with curated fallback data, but the goal is to restore authoritative monthly terms quickly.
