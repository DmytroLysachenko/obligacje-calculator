# UI Refactor Audit

This audit tracks visual debt after the premium financial UI refactor. Scope is presentation only: no functionality, calculation logic, API contracts, persistence, or data structures change.

## Completed Areas

- Feedback, ready states, toasts, confirmation dialogs, and recalculation controls use compact tokenized surfaces.
- Single calculator secondary areas are flattened into chart, ledger, saved scenario, and starter sections.
- Comparison core, bond-comparison dashboard, charts, shared base controls, result panels, and asset breakdowns avoid heavy Card shells and raw palette colors.
- Regular investment input and result surfaces use section rhythm, quieter tables, and divider-led summaries.
- Ladder strategy surfaces use timeline sections, metric rows, and subtle dividers instead of nested cards.
- Notebook workspace and detail surfaces avoid nested card structures in portfolio lists, detail headers, lots, liquidity, and analytics projection.
- Shared market assumption controls, macro defaults, projected paths, history popovers, and macro painter use tokenized form sections.
- Shared insight and explainer components use ledgers, dividers, and semantic tokens instead of colored educational cards.
- Guardrails in `docs/ui/design-refactor-contract.test.ts` now cover the refactored comparison, regular, ladder, notebook, market assumption, and insight files.

## Current Rules

- Use sections, whitespace, `border-t`, `border-b`, and `divide-y` before reaching for cards.
- Keep product surfaces on shared typography helpers: `ui-primary-metric`, `ui-large-metric`, `ui-section-title`, `ui-card-title`, `ui-body`, and `ui-metadata`.
- Keep product colors semantic: `text-success`, `text-warning`, `text-destructive`, `text-primary`, `text-muted-foreground`, `border-border`, `bg-muted`, and `bg-card`.
- Do not reintroduce `rounded-2xl`, `rounded-3xl`, arbitrary large radii, `border-2`, decorative shadows, gradients, or translucent shells in refactored files.
- Do not import `components/ui/card` into flattened product surfaces unless the design contract explicitly allows it.

## Remaining Global Findings

- Remaining visual debt is concentrated in older education/reference surfaces, low-level chart wrappers, and shared result primitives that intentionally still use `Card`.
- Some low-level primitives still carry implementation-specific utility colors or radii. Keep those exceptions narrow and documented in the design contract.
- Route and education copy can still drift toward marketing language even after layout cleanup.
- Chart data-series colors need a separate policy if future work distinguishes chart palette semantics from UI status colors.

## Single Calculator Secondary Areas

- Status: completed in earlier tranche.
- Covered areas: chart tooltip, saved scenarios, starter panel, timeline, audit trace, stale notices, and config secondary surfaces.
- Guardrail: current single calculator refined files are covered by the contract.
- Remaining risk: form inputs still use some shared result primitives; refactor only when a broader form system pass is planned.

## Comparison And Multi-Asset Details

- Status: completed in this and prior tranches.
- Covered areas: comparison controls, shared base config, chart tabs, result panel, asset breakdown, verdict, table, multi-asset reference blocks, and bond-comparison dashboard.
- Guardrail: comparison files must not import shadcn `Card`, use raw slate/amber/blue/green/orange/purple/red classes, or use oversized card radii.
- Remaining risk: chart series colors are still intentional data colors and should not be confused with UI status colors.

## Regular Investment

- Status: completed.
- Covered areas: calculator container, chart, input form, advanced settings, bond selection, section headings, and results summary.
- Guardrail: yearly and recent lot tables should stay row-based and divider-based.
- Remaining risk: any new recurring contribution section should reuse the existing form sections rather than adding a framed card.

## Retirement Planner

- Status: completed in earlier tranche.
- Covered areas: inputs, result overview, support list, model limits, dirty warnings, and summary metrics.
- Guardrail: supporting assumptions should remain secondary to the primary retirement result.
- Remaining risk: future planner outputs may need table-specific polish if more scenario detail is added.

## Ladder Strategy

- Status: completed.
- Covered areas: empty state, stale notice, timeline chart, mobile maturity list, desktop maturity table, peak month, clustering, and interpretation notes.
- Guardrail: ladder should read as a timeline and cash-flow analysis, not as repeated cards.
- Remaining risk: clustering messages should keep semantic warning/success colors only.

## Notebook Workspace

- Status: completed.
- Covered areas: workspace status, portfolio cards, mini stats, empty state, stored portfolio note, scope note, portfolio overview header, lots table, liquidity window, usage note, and analytics projection.
- Guardrail: guest/signed-in workflow state must remain clear without using boxed dashboard panels.
- Remaining risk: future notebook pages should preserve the hierarchy: portfolio identity, controls, key facts, lots, analytics.

## Market Assumptions

- Status: completed.
- Covered areas: macro defaults summary, semantic notes, history popover, projected path editor, macro painter, and market assumptions form.
- Guardrail: CPI/NBP controls must remain compact form sections with clear live/fallback context.
- Remaining risk: chart path editing should stay dense and readable if more rates are added.

## Shared Insights

- Status: completed.
- Covered areas: calculation explainer, math deep dive, calculation trace, advisor tips, reading checklist, community insights, and tax leak chart tooltip.
- Guardrail: educational math explanations should be ledgers, not colored cards.
- Remaining risk: formula blocks can still become noisy if new copy uses too many badges or status colors.

## Admin And Operational Screens

- Status: completed in previous tranche.
- Covered areas: admin header, status metrics, sync notices, access gate, and inventory table.
- Guardrail: operational tables should stay quiet, with row height and subtle separators carrying the hierarchy.
- Remaining risk: new admin widgets should avoid dashboard-style bright cards.

## Product Direction

- This is a premium financial analysis application, not a marketing dashboard.
- Increase density by making data visible, not by shrinking everything.
- Reduce border usage by default; use borders only when they communicate structure.
- Typography is the primary hierarchy tool.
- Tables should feel operational and premium.
- Sidebar remains anchored navigation infrastructure, not page content.
