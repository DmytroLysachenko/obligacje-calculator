# Dark-theme UI/UX modernization plan

Status: implemented in code; external rollout validation remains. Scope: full app shell, all public routes, calculator flows, data views, authenticated notebook, and shared UI primitives.

## 1. Executive decision

The current interface is coherent but visually underpowered for a financial decision tool. Screens feel like a low-contrast, densely typeset reference manual: many thin dividers, tiny labels, repeated bordered cards, and too much unclaimed black space. The core problem is not lack of components; it is weak hierarchy. The interface often makes a routine choice look as important as a final investment outcome.

Recommended direction: **Treasury Ledger**. Keep dark mode, but evolve it from charcoal documentation into a calm, high-trust decision workspace for Polish retail bond buyers. The visual signature is a _decision strip_: a compact, always-readable row that states selected bond, horizon, cash invested, projected end value, and freshness. It appears at the moment a user can act, not as decorative KPI chrome.

Audience: Polish retail savers comparing government-bond scenarios, often with limited financial confidence. Primary job: let a person understand “what should I compare next?” and complete one credible calculation without navigating a wall of configuration.

Do not adopt generic neon-fintech, glassmorphism, or a broadsheet-ledger imitation. The app already leans black/white/amber; the refactor should make that language useful: navy for trusted information, jade for positive outcomes, amber for attention/freshness, and red only for problems.

## 2. Evidence and audit method

Reviewed:

- Visual captures: education, single calculator, comparison, regular investment, ladder, notebook.
- Route inventory: `/`, `/single-calculator`, `/compare`, `/regular-investment`, `/ladder`, `/education`, `/economic-data`, `/notebook`, `/multi-asset`, `/optimize`, `/recovery-lab`, `/retirement`, `/login`, shared scenario/portfolio views, admin status.
- Shell: `app/layout.tsx`, sidebar/mobile header, navigation, theme/language controls, shared forms, result panels, tables, charts, empty states, page transitions.
- Browser evidence supplied during testing: missing-message errors, chart zero-size warnings, CSP nonce hydration warning, `/compare` render loop (fixed in `18a1bbb`; verify again in a clean browser session).
- Current guidance: [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), local UI/UX Pro Max recommendations, Web Quality Audit criteria, and Vercel React/Next practices.

Important limitation: screenshots are desktop/tall viewport captures. This plan requires a separate 375px, 768px, 1024px, and 1440px verification matrix before visual sign-off.

## 3. Current-state findings

### Critical: task completion and legibility

1. **Primary actions are visually remote from primary inputs.** Regular and ladder screenshots place a large calculation CTA far right while the form occupies a narrow left rail; long blank space separates intention from action. At common laptop widths this raises scan and pointer travel, and at mobile it risks CTA invisibility.
2. **Result-before-input state has weak visual hierarchy.** “Ready to simulate” prose competes with headings and form labels but does not answer what is required, what is optional, or what outcome will be produced.
3. **Long pages do not expose progress or return paths.** Single calculator and comparison results extend through charts and detailed tables. A user loses context, cannot easily return to the decision summary, and sees no compact sticky action/state control.
4. **Compare page asks users to parse too many equal-weight panels.** Shared controls, two scenarios, fairness, recalculate, narrative summary, metrics, chart, and long table arrive without a clear step sequence. The current initial result state makes it unclear whether results reflect edits.

### High: dark theme, typography, and information architecture

5. **Dark surfaces merge.** Screenshot body copy, card borders, dividers, and muted labels are too close in luminance. Thin rules produce a grid-like texture rather than hierarchy. Small white serif text is visually expensive and reduces rapid scanning.
6. **Typography mixes editorial display with dense dashboard data without role boundaries.** Large serif titles work as occasional landmarks; applying the same visual voice to compact labels/data makes financial tables less legible. Numerical values should be a dedicated tabular role.
7. **Too much card repetition.** Education’s offer catalogue and the calculator forms repeat nearly identical outlined containers. Borders become visual noise; grouping needs fewer, stronger surfaces and more whitespace.
8. **The sidebar consumes substantial visual weight while delivering low-priority utilities.** The “continue where you left off” block, settings, language/theme controls, and footer all remain visible even when the working area needs focus.
9. **Terminology and copy are system-oriented.** “Committed run,” “scenario,” “fairness,” “conditional strategy,” and “setup” are useful internally but should be translated into a user outcome plus optional technical detail.

### High: accessibility and interaction

10. **Contrast needs measured verification.** Screenshot secondary text, badges, table labels, and dividers appear below comfortable dark-mode contrast. Audit all semantic tokens—not individual components—against WCAG 2.2 AA.
11. **Dense desktop tables need a first-class mobile strategy.** Data table sheet exists, but the visual hierarchy still treats table detail as a single huge block. Row summaries, filters, and comparison deltas need progressive disclosure.
12. **Forms are lengthy and possibly repeated.** Regular and ladder surface the same large form structure. Advanced controls are visually present before users demonstrate a need, raising cognitive load.
13. **Error and freshness states require a unified location.** The app has warnings/disclosures, but screenshots show status text scattered across panels. Use one explicit status region immediately next to the action and results summary.
14. **Verify all icon-only controls and keyboard flow.** Shared primitives look strong, but audit routes for accessible names, visible focus, 44px targets, logical focus order, modal overscroll containment, and skip target behavior.

### High: performance and browser quality

15. **Console must be clean before release.** Resolve CSP nonce hydration mismatch; prevent Recharts mount at a negative/zero measured size; keep missing-translation contract tests across both locales.
16. **Heavy charts/tables should not ship or render before demand.** Dynamic-import chart/table-heavy result modules, defer secondary accordions, preserve dimensions for chart containers, and apply content visibility/virtualization to long schedule tables.
17. **INP risk on comparison.** The prior render loop produced poor INP. After the fix, profile edits, recalculate, chart-step changes, and table pagination with React Profiler and Web Vitals; no design refactor ships without measurements.

## 4. Target design system

### Tokens

| Role            | Token          |     Value | Use                                      |
| --------------- | -------------- | --------: | ---------------------------------------- |
| Canvas          | `--canvas`     | `#111315` | app background; never pure black         |
| Raised surface  | `--surface-1`  | `#171B1E` | cards, inputs, sticky bars               |
| Quiet surface   | `--surface-2`  | `#1D2327` | selected/hover and data strips           |
| Primary text    | `--ink-strong` | `#F5F2EA` | headings, key figures                    |
| Secondary text  | `--ink-muted`  | `#B8B7B0` | body/supporting copy; validate contrast  |
| Trust blue      | `--trust`      | `#7CA7D8` | links, selected navigation, neutral info |
| Yield jade      | `--positive`   | `#4DBA8A` | positive return, healthy status          |
| Attention amber | `--attention`  | `#D6A85F` | freshness, stale result, caution         |
| Risk coral      | `--danger`     | `#E3776B` | errors and destructive actions only      |

Use semantic aliases (`--status-positive`, `--chart-series-a`) rather than raw hex in feature components. Validate body copy at 4.5:1 and large text/icons at 3:1.

### Typography

- Display: retain the existing editorial serif only for a page’s single `h1` and a decision/result value where it adds meaning.
- UI/body: Geist or Inter, 16px base, 1.5–1.6 line height; no body text below 14px on desktop or 15px on mobile.
- Data: Geist Mono, `font-variant-numeric: tabular-nums`, right-aligned monetary values, fixed decimal/currency rhythm.
- Headings: use `text-wrap: balance`; preserve a strict `h1 → h2 → h3` outline.

### Layout and signature

Desktop calculator frame:

```text
┌ sidebar ───────┬──────────────── page heading / status ──────────────┐
│ routes         │ decision strip: offer | horizon | invested | outcome │
│                ├───────────┬─────────────────────────────────────────┤
│ context only   │ plan      │ live result / ready state                │
│                │ controls  │ key outcome + chart + next action       │
│                └───────────┴─────────────────────────────────────────┘
└────────────────┴──────── sticky action bar: Calculate / Recalculate ─┘
```

Mobile becomes a single column: status/decision strip, required fields, sticky bottom action, then results. Sidebar becomes a concise route drawer; utilities move to a settings sheet.

Signature element: **the decision strip is a ledger-like single row, not KPI cards**. It makes an investment decision legible at a glance and exposes freshness (“Current offer” / “Your draft differs”) in plain language.

## 5. Prioritized implementation plan

### Phase 0 — release blockers and measurement (1–2 days)

1. Fix CSP nonce hydration mismatch in `app/layout.tsx`; ensure server and client script markup share nonce behavior. Add a browser console-error test.
2. Fix Recharts negative dimensions in `shared/components/charts/BondValueChartPlot.tsx`/container: render only after non-zero `ResizeObserver` dimensions or reserve a minimum aspect-ratio box. Add visual regression asserting no console warning.
3. Add locale key compile/contract check for every client `t('…')` call. Existing missing key failure proves parity alone is insufficient when namespace path is wrong.
4. Add an automated contrast audit for token pairs and axe scans of all public routes.
5. Establish baseline per route: LCP, INP, CLS, JS transferred, accessibility score, console errors, and task success time for first calculation.

Acceptance: zero production console errors; no hydration warnings; no chart sizing warnings; all public-route axe scans clean for serious/critical issues.

### Phase 1 — global shell and tokens (3–5 days)

1. Refactor `app/globals.css` into semantic dark tokens and component layers; raise muted text/divider contrast.
2. Simplify sidebar: route groups remain; move language/theme/footer to a collapsible utility area; reduce persistent “continue” card prominence; add active route title and contextual subnavigation only where needed.
3. Add responsive shell rules: sidebar collapses cleanly at tablet, mobile route header preserves current page/action, content max width becomes route-specific.
4. Establish title, body, utility, and data typography tokens; replace ad hoc text sizes.
5. Create shared `PageHeader`, `DecisionStrip`, `CalculatorActionBar`, `ResultStatus`, and `SectionNav` components.
6. Use one focus style token, 44px minimum interactive target, `touch-action: manipulation`, and reduced-motion rules globally.

Acceptance: screenshots at 375/768/1024/1440 show consistent gutters, no overflow, clear active navigation, and visible keyboard focus.

### Phase 2 — calculator flow redesign (5–8 days)

#### Single calculator

1. Make the default screen a guided three-step workspace: “Choose bond”, “Set timeframe & amount”, “Review result”.
2. Collapse rate mechanics and advanced NBP assumptions by default; disclose why they matter before inputs.
3. Place decision strip above results and sticky action bar above viewport bottom. Recalculate bar must state exactly what changed.
4. Turn long result page into anchored sections: Summary, Value over time, Schedule, Assumptions. Add keyboard-accessible in-page navigation.
5. Replace dense schedule first view with 3–5 pivotal rows and “View full schedule”; retain data table/export as exact source.

#### Comparison

1. Reframe top as one explicit flow: shared plan → scenario A/B differences → compare. Use shared fields in a full-width top band; scenarios appear as matched panels beneath.
2. Put delta/result verdict first after calculation: “EDO leads by X PLN after Y years” plus “why” bullets. Never make users find the conclusion below a table.
3. Move fairness/assumption controls into a compact disclosure with explanation of comparison assumptions.
4. Add scenario lock/swap/reset controls with visible before/after state. Persist active chart/table view in URL.
5. Replace the initial huge result/table region with an intentional empty state and one primary “Compare scenarios” action.

#### Regular investment and ladder

1. Share one progressive recurring-plan form, but change task framing: regular = “build contribution plan”; ladder = “plan maturity spacing”.
2. Make ladder’s incremental value visible before calculation with a small maturity cadence preview; otherwise it reads as a duplicate regular calculator.
3. Keep the calculate button adjacent to last required input on desktop and sticky on mobile; not detached in an empty right column.
4. Show stale committed results in a single amber decision strip with exact action: “Recalculate with your edited plan”.

Acceptance: user can complete each first calculation without scrolling more than one viewport before seeing action; advanced fields stay hidden until requested; result freshness is visible at all times.

### Phase 3 — content/data route redesign (4–6 days)

#### Home and education

1. Home becomes a true decision dashboard: current offer freshness, “continue draft”, one recommended next action, and a compact bond-family compare—not a second documentation page.
2. Education becomes an explainer journey. Keep all offers, but show family summaries first; default catalogue to the user-selected comparison pair; load deeper offer cards on demand.
3. Use concise plain-language copy: explain “fixed”, “NBP-linked”, “inflation-linked”, and “family” before rates/fees. Avoid duplicate description/rate rows.

#### Economic data and multi-asset

1. Start with current signal cards and a narrative (“Inflation fell X; NBP reference is Y”), then charts. Clearly separate observed data from assumptions.
2. Give every chart a visible title, timeframe selector, written takeaway, accessible table, and source/freshness block.
3. Use comparison bars/bullet charts for ranked decisions; reserve lines for time paths. Do not introduce radar/pie charts for precise bond comparisons.

#### Notebook, retirement, optimizer, recovery lab, login, shared views, admin

1. Notebook guest view: turn empty area into one concise sign-in choice plus an illustrative read-only preview; avoid two competing empty-state messages.
2. Retirement/optimizer/recovery: present experimental status as a compact label, not a page-level warning that displaces task content. Add clear scope and a safe next action.
3. Login: isolate authentication from app chrome; show privacy/storage explanation and return destination.
4. Shared views: read-only banner, source timestamp, share owner intent, and a safe “copy to my calculator” action.
5. Admin: dense operational dashboard can retain high density but needs status hierarchy, time range, filters in URL, and an explicit destructive-action pattern.

### Phase 4 — tables, charts, and performance (3–5 days)

1. Dynamic-import large chart/table result modules (`next/dynamic`) below initial result summary; maintain skeleton dimensions to avoid CLS.
2. Virtualize schedules over 50 rows or use `content-visibility: auto` for non-interactive lower rows; retain native table semantics.
3. Create a chart accessibility contract: series toggles, non-color differentiation, keyboardable controls, text verdict, accessible data table, visible unit/scale/freshness, and no tooltip-only facts.
4. Move expensive projections/chart models behind memoized selectors with primitive dependencies. Avoid session object dependencies in effects; use stable callbacks/functional state setters.
5. Add performance budgets: no heavy chart code on a ready-state page; calculate interaction INP <200ms p75; initial visual shell/heading stable before data requests resolve.

### Phase 5 — validation and rollout (2–3 days)

1. Test user flows with five people: first single calculation, compare two offers, discover ladder, understand stale result, export/share notebook.
2. Run desktop/mobile browser matrix, keyboard-only pass, VoiceOver/NVDA spot pass, 200% zoom, reduced-motion, and Polish/English copy pass.
3. Deploy behind route-level feature flags for new calculator layouts; compare completion, recalculation, abandon, and error rates.

## 6. Route-by-route change matrix

| Route                                       | Primary issue                             | Change                                         |
| ------------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `/`                                         | dashboard lacks decisive next step        | decision dashboard + continue/compare actions  |
| `/single-calculator`                        | form/result/schedule too vertically dense | guided setup, decision strip, anchored results |
| `/compare`                                  | equal-weight complexity                   | stepped compare flow + top verdict             |
| `/regular-investment`                       | CTA detached from form                    | shared recurring plan + sticky action          |
| `/ladder`                                   | value proposition unclear vs regular      | cadence preview + liquidity-focused result     |
| `/education`                                | catalogue feels like a long document      | family overview + progressive offer catalogue  |
| `/economic-data`                            | data-first, weak meaning                  | signal narrative before charts                 |
| `/multi-asset`                              | reference context can overwhelm           | explicit benchmark framing + lazy data view    |
| `/notebook`                                 | guest empty state wastes space            | single sign-in path + read-only preview        |
| `/retirement`, `/optimize`, `/recovery-lab` | experimental notices dominate             | scope label + focused task workspace           |
| `/login`                                    | auth needs confidence/context             | standalone auth narrative + return state       |
| shared scenario/portfolio                   | read-only context unclear                 | provenance/freshness + duplicate-to-own action |
| `/admin/status`                             | needs operational density                 | filterable status board, URL state, actions    |

## 7. Engineering work breakdown

1. `shared/components/page/*`: add page header, section navigation, sticky action shell.
2. `shared/components/results/*`: decision strip, result freshness/state system, mobile detail disclosure.
3. `shared/components/forms/*`: progressive group primitives, inline validation, form completion summary.
4. `shared/components/charts/*`: measured rendering guard, a11y contract, dynamic loading shell.
5. `shared/components/chrome/*`: compact sidebar/utilities and mobile route action area.
6. `features/*/components`: migrate route content incrementally onto primitives; no one-off raw color/spacing.
7. `app/globals.css`: semantic tokens, type scale, responsive gutters, reduced motion, high contrast checks.
8. `tests/browser/*`: console, accessibility, visual, mobile task-flow, keyboard, and Web Vitals assertions.

## 8. Definition of done

- One visual design system documented and enforced with tokens.
- 0 serious/critical axe findings and 0 console errors on primary public routes.
- WCAG AA token contrast documented and tested.
- All calculator pages provide a visible action, draft/committed distinction, outcome, and next step.
- No page renders a long data table/chart before its summary explains the decision.
- Results pages retain URL/share state for views, filters, chart granularity, and scenario pair.
- Desktop and mobile screenshot baselines approved at 375/768/1024/1440px.
- Lighthouse/field budgets meet LCP <2.5s, INP <200ms p75, CLS <0.1.

## 9. Deliberate non-goals

- No decorative 3D, neon gradients, parallax, or finance-trading visual clichés.
- No new chart type without a user decision it clarifies and an accessible tabular alternative.
- No full visual rewrite before Phase 0 measurements and global token work establish a safe baseline.
