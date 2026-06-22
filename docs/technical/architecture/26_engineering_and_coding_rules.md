# 26. Engineering and Coding Rules

This document defines the repository-wide coding rules for application code, shared utilities, and user-facing product surfaces.

These rules are intentionally strict. They exist to stop legacy shortcuts from re-entering the codebase and to ensure that every touched area moves toward a cleaner, more trustworthy system.

## 1. Core Principles

All new code and all touched old code must follow:

- `SOLID`
- `DRY`
- `KISS`
- correctness before polish
- explicit semantics over convenient shortcuts

If an implementation is fast but leaves misleading behavior, duplicated branches, stale copy, or mixed responsibilities behind, it is not complete.

## 2. i18n Is Mandatory

### 2.0 Standard Library

The repository standard for internationalization is `next-intl`.

Do not build or reintroduce custom translation runtimes, custom translation-node resolvers, or ad hoc locale-resource walkers when `next-intl` already provides the needed capability.

Required defaults:

- `next-intl` for translated messages
- `next-intl` formatting helpers or standards-aligned locale helpers for numbers, dates, lists, and display names
- locale resources as the single source of truth for translated content

Approved runtime entrypoints:

- client React components: `useAppI18n()` from `@/i18n/client`
- client locale state/control: `AppLocaleProvider` and `useAppLocale()` from `@/i18n/client`
- server components, metadata, route handlers, and SSR translation work: native `next-intl/server` APIs such as `getTranslations`, `getLocale`, and `getMessages`
- non-React shared utilities that need translated strings: `translateMessage(locale, key, vars)` from `@/i18n/translate`

Do not invent parallel translation access patterns when one of the approved entrypoints fits the job.

### 2.1 Hard Rule

User-facing translated content must come from locale resources through the translation layer.

There must be no hardcoded translated values in application code.

The following pattern is not acceptable for UI text:

```ts
language === 'pl' ? '...' : '...'
```

This is not a preferred shortcut. It is a repo violation for normal UI copy.

The following pattern is also not acceptable for translated content:

```ts
pickLanguageValue(language, {
  pl: '...',
  en: '...',
})
```

Inline bilingual objects, arrays, labels, and content fragments in code are also repo violations when they represent translated product/UI content.

### 2.2 Required Pattern

Use locale-backed translation keys and locale-backed structured content only:

```ts
t('some.key')
t('some.key', { value })
```

If a feature needs structured internationalized content, keep that structure in locale resources, not in code. This includes:

- arrays
- nested objects
- cards/sections metadata
- ordered content blocks
- multi-part helper content
- label/value descriptor groups

Examples of acceptable patterns:

```ts
t('some.key')
t('some.key', { value })
const items = t('landing.cards')
const steps = t('comparison.steps')
const hero = t('education.hero')
```

The exact translation API may resolve strings, objects, or arrays. The architectural rule is that translated content lives in locale files and is consumed from there.

When using `next-intl`, prefer its native patterns first:

- `useTranslations`
- `getTranslations`
- `useFormatter`
- `createTranslator`

Repository guidance on top of `next-intl`:

- client app code should use `useAppI18n()` as the project-facing hook
- server code should use `next-intl/server` directly
- pure helpers should accept `locale` explicitly and use `translateMessage(...)`
- do not reintroduce generic compatibility wrappers for translated content access in new code
- do not route new app code through ambiguous catch-all imports when the client/server/utility boundary is already known

If a feature truly needs structured locale-backed content, prefer a locale-resource design that still fits `next-intl` usage before adding custom plumbing.

### 2.3 Exceptions

Allowed only when the branch changes behavior, formatting strategy, or locale-specific library configuration rather than raw copy. Examples:

- `Intl.NumberFormat` locale codes
- `date-fns` locale objects
- metadata structure that must map locale to standards-compliant machine values

These exceptions do not permit inline translated sentences, labels, headings, helper text, button copy, badges, tooltips, legends, table headers, empty states, validation text, or inline bilingual objects used as translation stores.

### 2.4 Touched-Code Rule

When editing an existing file:

- remove inline translated value branches in the area you touch
- remove inline bilingual objects that store translated content in code
- move that content into locale resources
- do not add new exceptions unless the value is not product/UI copy and truly belongs to locale-selection infrastructure

## 3. No Commented-Out Code

Commented-out code is not allowed in the repository.

Do not keep:

- commented JSX blocks
- commented imports
- commented functions
- commented legacy business rules
- commented debugging leftovers

If code is no longer used, delete it. If context is important, preserve it in commit history, tests, or docs.

Short explanatory comments are allowed only when they clarify non-obvious intent or a financial/product rule that would otherwise be hard to infer from the code.

Do not commit TODO, FIXME, `debugger`, or `@ts-ignore` markers. If a known defect must remain, capture it in docs or a tracked issue with enough context to reproduce it.

## 4. No Dead Legacy Paths

Do not preserve old code “just in case.”

When a path is replaced:

- remove unreachable branches
- remove duplicate helper logic
- remove stale adapters and unused props
- remove obsolete local state and fallback branches that are no longer part of the chosen design
- delete pass-through facade files after their responsibilities move into commands, queries, clients, models, or services

Leaving old code beside new code is treated as unfinished work unless there is an explicit migration boundary documented in the architecture docs.

## 5. Components Must Stay Small and Focused

### 5.1 Responsibility

Components must have a narrow responsibility.

Prefer composition of small view primitives over large route-level containers that mix:

- data fetching
- domain mapping
- export logic
- layout
- copy composition
- formatting
- event orchestration

### 5.2 Practical Standard

There is no single line-count cap that fits every case, but the default expectation is:

- presentational components should stay short
- route/page components should orchestrate, not implement business logic
- if a component becomes hard to scan in one screen, split it

Signals that a component is too large:

- repeated UI patterns inside one file
- multiple unrelated sections with separate mental models
- heavy conditional forests
- inline domain calculations
- many local helper functions that should be shared or extracted

When touching a large component, extract in this order:

- pure model logic first
- presentational sections second
- controls, toolbars, and local event orchestration third

This keeps behavior testable before markup is moved.

For calculator-adjacent forms, setup and display decisions must be pure where possible. Example pattern:

- `shared/lib/*-model.ts` owns mode transitions, derived labels, summaries, and other deterministic decisions
- `shared/components/<subdomain>/**` owns presentational primitives
- route or feature components own state wiring and user events only

Do not leave deterministic mode-transition logic inside JSX-heavy components when it can be tested without React.

For chart components, keep public chart props stable when possible. Move tooltip models, legend decisions, and toolbar rendering into narrow chart model or chart parts files before changing chart behavior.

## 6. Shared Logic Belongs in Shared Helpers

If formatting, copy composition, event labeling, or display semantics are reused across multiple pages, move them into a shared helper or narrow shared primitive.

Do not duplicate:

- table column wording
- chart legend wording
- rate-context descriptions
- export-row semantics
- scenario facts formatting
- notebook/meta summary phrasing

Shared code must stay narrow and behavior-focused. Do not replace duplication with giant configurable abstractions that hide intent.

Formatting rules belong here too:

- repeated number/date/currency/percent formatting must use shared formatter helpers
- do not create page-local `Intl.*Format` instances repeatedly inside large route components when the same behavior already exists in shared formatters/hooks
- if formatting semantics are user-visible across multiple surfaces, centralize them
- comparison, single, regular, ladder, and other retained calculators should prefer one normalized display adapter over page-local chart/table/export transformations
- browser API calls belong behind narrow shared clients; feature components and
  hooks should not parse API envelopes, compose auth headers, or hardcode
  endpoint request details when a client gateway exists
- API route controllers should use shared response helpers for standard JSON
  envelopes and should keep ownership/auth checks, validation, and service calls
  visibly separate
- sync providers and server API clients should use the sync HTTP gateway for
  timeout, headers, status handling, and response parsing instead of raw
  provider-local `fetch` calls

## 6.1 Calculator Shell Hierarchy

Flagship calculator pages should follow one readable order:

- primary inputs
- primary result / verdict
- chart
- table or detailed timeline
- assumptions, warnings, and secondary meta

Do not improvise a new page hierarchy for each calculator unless the product model truly differs.

## 6.2 Simple vs Advanced Assumptions

Projected market assumptions must keep a stable interaction contract:

- simple assumptions first
- advanced yearly/custom paths behind explicit expansion
- simple mode must describe the actual modeled behavior
- display copy must not imply that CPI or NBP affects bond families in ways the engine does not support

## 6.3 Workspace Feedback

Browser-native product prompts are not acceptable in normal UI flows.

Do not use:

- `alert(...)`
- `window.confirm(...)`
- ad hoc browser-native prompt flows for notebook/workspace interactions

Use app-native feedback, confirmation, and status components instead.

## 6.4 Reference Dashboard Direction

Reference-heavy pages such as economic-data should read like structured dashboards, not nested generic cards.

Preferred approach:

- clear hero/summary context
- charts as the primary surface
- supporting scope/status guidance in secondary rails or accordions
- less repeated "box inside box" chrome when the content is already dense

For dense informational surfaces, prefer:

- section shells with separators
- compact split grids
- bordered rows for short facts
- flatter sidebar and workspace utility rails instead of stacked floating panels

Do not stack multiple rounded bordered cards inside one another when the same content can be presented as one structured section.
Do not solve short utility content with repeated decorative mini-cards when one grouped rail is enough.

## 6.5 Secondary Tool Direction

Secondary tools such as multi-asset and recovery-lab must be framed as supporting or reference surfaces.

Required approach:

- use a clearly secondary intro/surface treatment
- point users back toward flagship flows such as single-calculator and comparison where appropriate
- avoid feature chrome that makes these pages compete visually with the flagship calculators
- keep copy locale-driven and explicit about narrower scope

## 7. UI and Domain Responsibilities Must Stay Separate

Route and component code must not reimplement domain rules that belong in handlers, adapters, or engine utilities.

Specifically:

- calculation truth belongs in engine/handler layers
- display semantics belong in display/export adapters
- UI components render prepared data and trigger actions
- public barrels may preserve import stability, but implementation files should remain grouped by responsibility

If product behavior differs by bond family, payout model, tax mode, or current-offer rule, that distinction must be represented in domain/display models, not improvised with page-local conditionals.

## 8. Hydration and Persistence Safety

Client persistence and browser-only state must not alter the first render in a way that breaks SSR/CSR consistency.

Required approach:

- deterministic server render
- deterministic first client render
- post-mount restoration for browser-only state

Do not branch in render using browser-only state for major layout truth such as “has results,” “up to date,” or other state that changes rendered structure before hydration completes.

## 9. Touched Code Must Leave the Area Better

When a file is touched, do not limit work to the smallest possible patch if the touched area still contains obvious violations of these rules.

Expected cleanup within the touched scope:

- remove inline locale text branches
- remove inline translated value objects and arrays from code
- remove commented-out code
- remove dead or duplicate local helpers
- extract repeated UI into narrow primitives when repetition is obvious
- align naming with real semantics

This does not mean unrelated full-file rewrites. It does mean leaving the touched area cleaner than it was.

## 10. Review Standard

A change is not production-ready if it:

- introduces new inline translated copy branches
- introduces new hardcoded translated values in code
- keeps translated content in page-local `pl/en` objects instead of locale resources
- leaves commented-out code behind
- adds large mixed-responsibility components without justification
- duplicates semantics already handled elsewhere
- hides domain truth inside page-local UI conditionals

The default review posture for this repository is to reject these patterns rather than tolerate them.

## 10.1 Release Clean-Code Gates

`docs/technical/architecture/clean-code-contract.test.ts` enforces the current clean-code boundaries:

- no stale TODO/FIXME/debug markers in production paths
- direct browser fetch only through approved client modules
- API JSON responses through shared response helpers except documented platform endpoints
- app API JSON body parsing through shared body-reader helpers
- sync/provider HTTP calls through `lib/sync/http-gateway.ts`
- lint-disable comments only in documented exceptions

Update that contract when the architecture intentionally changes. Do not weaken it to land unrelated work.

New release-blocking boundaries should be added to a contract test first, then documented in the project map or architecture rules.

## 11. Folder and Layer Boundaries

Directory structure is part of the architecture, not a cosmetic preference.

Required boundaries:

- `app/`: routes, layouts, metadata, and thin HTTP/page orchestration only
- `app/api/**/route.ts`: request parsing, auth/ownership resolution, validation, and HTTP response shaping only
- `features/`: domain-specific UI, handlers, adapters, and calculation orchestration by product area
- `shared/components/`: reusable UI primitives grouped by subdomain such as `page/`, `feedback/`, `results/`, `chrome/`, `insights/`, and `charts/`
- `shared/hooks/`: isomorphic or UI-facing hooks only
- `shared/lib/`: reusable display/export/presentation helpers and shared client-workspace state that are not server infrastructure
- `lib/data/`: shared data retrieval and cached read models
- `lib/server/`: server-only services, repositories, HTTP helpers, admin/sync orchestration, and ownership/auth support
- `db/schemas/`: grouped schema entrypoints by connected model domains
- `db/seed/`: seed modules split by concern with explicit top-level orchestrators

Do not flatten new files into old catch-all directories when a bounded subdomain already exists.

### 11.0 HTTP Route Helpers

Route helpers must be reused when a route family already has a shared contract.

- calculation endpoints should use the shared calculation-route helper instead of hand-rolling request parsing and response envelopes per calculator
- structured JSON endpoints should use shared validated-body helpers instead of ad hoc `await req.json()` parsing repeated in each route
- route families with repeated auth, owner, or domain-error behavior should expose a narrow family HTTP helper instead of duplicating controller boilerplate
- route-level validation belongs at the edge; business rules stay in `features/**` or `lib/server/**`

### 11.0.1 Client and Server Gateway Boundaries

Browser-facing code should depend on shared client gateways, not endpoint strings scattered through feature files.

Required defaults:

- calculation UI calls `getCalculationEndpoint(...)`
- notebook and migrated portfolio UI calls `portfolioClient`
- generic JSON calls use `api-client.ts`
- display-only calculator state uses `calculator-state.ts`

Server-facing route files should depend on application services, command/query facades, or repositories. Do not import low-level database modules into route controllers when a service boundary exists.

Portfolio route controllers must not import from `lib/server/portfolio/service.ts`. Use command/query facades for behavior and `lib/server/portfolio/errors.ts` for `PortfolioServiceError`.

Operational endpoints follow the same rule:

- `/api/health` builds payloads through `lib/server/health/**`
- `/api/readiness` builds checks through `lib/server/readiness/**`
- `/api/admin/status` reads typed snapshots through `lib/server/admin/**`
- `/api/admin/sync` gets supported modes, default mode handling, and response payloads from `lib/server/admin/**`
- chart API routes get fallback envelopes from `lib/data/**`, not route-local object literals

### 11.1 Workspace Boundaries

Notebook and portfolio workspace state must follow these rules:

- guest users may browse calculators and preview workspace surfaces, but workspace mutations must be explicitly gated behind signed-in access
- shared workspace selection state, such as the active portfolio id, belongs in `shared/lib/workspace/**`, not in one feature-local folder that other features import ad hoc
- notebook workspace API access belongs behind `shared/lib/portfolio-client.ts`
- portfolio and notebook API routes must stay thin and delegate ownership and mutation rules to `lib/server/portfolio/**`
- notebook pages should read as a records workspace, not a pseudo-advisory dashboard
### 11.2 Naming

Use full, meaningful names for:

- pages and route folders
- services and repositories
- exported functions
- shared components
- schema entrypoints
- seed modules

Single-letter or cryptic names are not acceptable for durable application structure.

### 11.3 Calculator Display and Assumption Contracts

Retained calculator surfaces must preserve these contracts:

- `features/bond-core/utils/calculations.ts` is a stable public entrypoint, not the engine implementation. New engine logic belongs in `features/bond-core/utils/engine/**` with focused regression tests.
- display settings such as chart granularity may change aggregation only; they must never change engine truth
- chart, table, quick-audit, CSV, and PDF output for one calculator flow must derive from the same normalized display model
- CPI and NBP chart overlays must be rendered from truthful reference-series display data; do not fabricate smooth transitions by interpolating reference values through bond checkpoints
- single and comparison flows must reuse the same rollover inference rules where the product behavior is the same
- current bond offer terms and NBP reference-rate assumptions must remain separate concepts in code, UI wording, and exported artifacts
- simple-mode projected NBP defaults should be presented as a flat path from the latest synced rate until the user overrides it
- CPI/NBP assumption setup modes should use the shared market-assumptions model and controls; do not reimplement fixed/simple/advanced semantics in feature-local forms.

### 11.4 Compatibility Wrappers

Compatibility wrappers may exist only as short-lived migration aids.

Once internal imports have been moved to the canonical boundary, delete the wrapper files. Do not preserve old import facades indefinitely.
