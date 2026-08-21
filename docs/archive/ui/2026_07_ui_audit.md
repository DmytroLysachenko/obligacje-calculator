# UI Audit — July 2026

## Scope

Reviewed the application shell, landing dashboard, calculators, comparison, ladder, regular investment, retirement, optimizer, economic-data, notebook, education, login, shared primitives, form controls, feedback components, charts, desktop tables, and their mobile alternatives. Route references are included where they make a finding easier to verify.

## Critical

No critical visual or accessibility defects found. The application has a skip link, responsive table sheets, semantic shared controls, and live regions for its existing toast and recalculation feedback.

## High impact

- `app/globals.css`, `features/home/components/LandingDashboardClient.tsx`: the established type scale is not used consistently. The landing title grows to 64px while product page titles use the shared 34/42px scale, making the dashboard feel like a separate product.
- `app/error.tsx`: the “Engine Stall Detected”, all-caps action labels, rounded icon tile, and `transition-all` do not match the documented calm, professional financial-tool voice.
- `shared/components/chrome/Sidebar.tsx`, `SidebarNavigation.tsx`: desktop navigation is dependable but visually quiet; mobile uses a small isolated menu affordance without an anchored header context. Active state, utility grouping, and interaction feedback can better establish place.
- `components/ui/*`, `shared/components/forms/*`: primitives are sound but control heights, metadata treatments, and field feedback vary between shared and feature-local forms. This makes calculator setup screens denser than the result surfaces.
- Calculator routes (`/single-calculator`, `/compare`, `/ladder`, `/regular-investment`, `/retirement`, `/optimize`): the broad desktop control/result split is consistent, but narrow desktop and tablet layouts have large static gaps before the control panel becomes a single column. A shared breakpoint and compact mobile action treatment are needed.

## Medium impact

- `shared/components/page/PageHeader.tsx`, `ToolCard.tsx`: page-header and card rhythm are strong but icons, labels, dividers, and action controls each use slightly different visual weight; tool cards do not expose a clear focus treatment on the article itself.
- `components/ui/table.tsx` and timeline table implementations: desktop tables are readable but header casing and padding differ across shared and local tables. Numeric cells do not universally use tabular figures.
- `shared/components/feedback/Notice.tsx`, `ScenarioReadyPanel.tsx`, `PageSuspenseFallback.tsx`: feedback states have good coverage but do not yet share one recognisable visual hierarchy for status, action, and next step.
- `/economic-data`, `/education`, `/notebook`: reference and workspace pages use useful page-specific layouts, but their section openings and empty/loading states are more card-forward than calculator pages.
- `shared/components/charts/*`: chart frames and tooltips are informative but several tooltip labels use tight uppercase styling and shadows that compete with the data.
- Feature-local form labels in comparison, optimizer, and retirement rely heavily on uppercase micro-labels, reducing scan comfort and deviating from the product typography rules.

## Minor polish

- `components/ui/accordion.tsx`, `app/error.tsx`: `transition-all` should be narrowed to composited or color properties and respect reduced-motion preferences.
- `shared/components/feedback/AppToast.tsx`: dismiss icon is accessible through a button but has no visible label for assistive technology.
- `app/layout.tsx`: the content and footer use different horizontal padding arrangements at some viewport widths.
- `app/login/page.tsx`: the provider glyphs are typography placeholders rather than a quiet, consistent identity mark.
- A few legacy labels use unusually heavy uppercase tracking. Retain terse data labels where helpful, but use sentence case for ordinary UI labels.

## Design constraints retained

- Keep the existing neutral finance palette, no gradients, no decorative motion, and the current sidebar-led product identity.
- Keep the calculation, persistence, API, and localisation flows unchanged.
- Preserve the existing progressive-disclosure pattern: answer, summary, then detailed table/chart evidence.
