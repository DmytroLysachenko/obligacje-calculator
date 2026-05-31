# UI Refactor Audit

This audit tracks the remaining visual debt after the initial token and shell refactor. Scope is presentation only: no functionality, calculation logic, API contracts, persistence, or data structures change.

## Global Findings

- The product still overuses bordered cards for hierarchy. Several screens use Card > Card or bordered panel > bordered panel patterns where spacing, headings, and dividers would communicate structure better.
- Remaining old styling is concentrated in secondary modules: charts, comparison details, retirement, regular advanced inputs, landing/recovery/admin pages, and feedback widgets.
- Spacing is inconsistent. Older files mix arbitrary rounded radii, large padding, custom shadows, and slate/blue/amber/emerald utility colors instead of the finance token system.
- Typography still carries “dashboard template” weight in places: oversized card titles, heavy uppercase labels, and colored badges where neutral metadata would work.
- Premium direction: preserve density, reduce borders, use section rhythm, and make tables/ledgers feel quieter.

## Single Calculator Secondary Areas

- Unnecessary cards: chart tooltip shell, saved scenario rows, scenario starter tiles, calculation audit shell, stale-result notices.
- Hierarchy issues: chart context competes with result summary; audit trace reads like a detached card instead of a ledger.
- Spacing inconsistencies: `rounded-[1.7rem]`, `rounded-[2rem]`, `rounded-3xl`, and large panel padding remain.
- Typography issues: several helper labels use heavy black uppercase; positive/tax/context colors use raw emerald/orange/blue utilities.
- Target: flatten saved scenarios into a list, make audit trace a ledger, and keep chart metadata inline.

## Comparison And Multi-Asset Details

- Unnecessary cards: verdict blocks, row comparison tiles, mobile table cards, multi-asset reference blocks, override selector wrappers.
- Hierarchy issues: secondary tables visually compete with the main verdict and chart.
- Spacing inconsistencies: `rounded-[1.4rem]`, `rounded-[1.5rem]`, `rounded-[1.9rem]`, `rounded-2xl`, and dense border stacks remain.
- Typography issues: verdict and comparison table use strong blue/emerald/orange/purple badges for non-status meaning.
- Target: make verdict typographic, make comparison table premium and calmer, and use dividers instead of nested panels.

## Regular Investment Remaining Areas

- Unnecessary cards: advanced settings trigger, chart tooltip, dirty-state warning, chart shell.
- Hierarchy issues: advanced controls still feel heavier than primary contribution setup.
- Spacing inconsistencies: skeletons and chart shell use large radii and custom padding.
- Typography issues: bond selection status colors use old amber/slate/emerald classes.
- Target: make advanced controls read like a secondary form section and keep chart context quiet.

## Retirement Planner

- Unnecessary cards: input shell, result overview stats, model limits, support list, warning blocks.
- Hierarchy issues: inputs and model-limit notes compete with key result state.
- Spacing inconsistencies: `rounded-[1.5rem]`, `rounded-[1.9rem]`, `rounded-2xl`, `border-2`, and slate utilities remain.
- Typography issues: status colors and metric weights are inconsistent with the finance token system.
- Target: one clear scenario status, dense input sections, and quieter supporting assumptions.

## Side And Recovery Surfaces

- Unnecessary cards: landing dashboard hub cards, recovery lab panels, optimize result cards, multi-asset page helper cards.
- Hierarchy issues: landing page still feels marketing-like, with gradients and large hero styling.
- Spacing inconsistencies: decorative gradients, large radii, blur/backdrop/shadow effects, and white translucent surfaces remain.
- Typography issues: hero-scale labels are used for route hub content instead of financial-app navigation.
- Target: route hub and side tools should feel like product surfaces, not marketing pages.

## Admin And Operational Screens

- Unnecessary cards: gradient header, heavy status cards, bordered sync table shell.
- Hierarchy issues: operational controls are hidden behind decorative dashboard styling.
- Spacing inconsistencies: `rounded-3xl`, `border-2`, gradients, and strong blue/emerald/amber colors remain.
- Typography issues: uppercase badges and bright colors dominate operational metadata.
- Target: make admin/status an operational console: simple header, compact status strip, premium table.

## Shared Feedback And Insights

- Unnecessary cards: toasts, confirm dialog, feature status notices, recalculate control, ready panels, insight widgets.
- Hierarchy issues: feedback surfaces use heavy shadows and large rounded cards, interrupting page rhythm.
- Spacing inconsistencies: large radii, custom shadows, slate overlays, and arbitrary text sizing remain.
- Typography issues: status tones use raw blue/emerald/amber/orange classes; some labels are too heavy for metadata.
- Target: compact feedback with token colors, minimal borders, and no decorative depth.
