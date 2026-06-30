# 00. Current Product Roadmap

This roadmap reflects the real state of the application as of June 27, 2026.

The app is **not production-ready**.

Several calculators exist, and the broad recovery/refactor work has been moved to historical documentation. The current priority is not feature expansion. The current priority is **production-readiness cleanup, final trust validation, documentation truthfulness, and release evidence** for the trusted-core Cloud Run scope.

## Current Production-Readiness Snapshot

The recovery work already completed has materially changed the product:

- home page now behaves like a calmer recovery hub instead of a marketing-style dashboard
- main calculators use a calmer explicit calculate/recalculate model much more broadly
- single calculator, comparison, regular investment, ladder, notebook, and economic reference pages were simplified materially
- retirement, optimizer, and multi-asset now read as narrower recovery-lab surfaces instead of equal flagship tools
- recommendation-style language was reduced across ranking and comparison surfaces
- trusted vs conditional vs experimental page classes are now visible in the UI
- family-bond and retirement support boundaries are more explicit in selectors, route framing, and copy
- shared shell, shared audit panels, loading states, and recalculation affordances now behave more consistently
- data/source/freshness context is surfaced more honestly on reference pages
- flagship calculation paths now have exact-value golden regression tests
- retained-core comparison and ladder paths now also have dedicated baseline regression coverage
- feature folders now consistently use the active vocabulary where useful:
  `components`, `hooks`, `lib`, `types`, `constants`, and `tests`
- large calculator surfaces have been split further: single timeline rows now
  have mobile/desktop render components, comparison chart modeling is separate
  from result metrics, optimizer result rendering is a feature component, and
  notebook workspace/detail state is split between pure model output and a
  focused container hook
- single-bond and regular-investment engines now delegate more orchestration
  setup to focused helpers, including single-bond period rate/accrual setup,
  while keeping calculation truth covered by engine and golden tests
- feature/client error logging goes through `shared/lib/client-logger.ts`;
  server/API logging goes through `lib/server/logging.ts`, sync logging goes
  through `lib/sync/sync-logger.ts`, and the global error boundary remains a
  separate client boundary

This is real progress, but it is **not** the same as production readiness.
The next step is narrower: review the unused-code scan baseline, remove or
document confirmed stale inventory, keep docs aligned with the implemented app,
and collect final release-gate evidence.

## Current Product Position

- core bond calculation logic exists and can be evolved
- the UI surface area is still larger than the trusted release scope
- some secondary features remain intentionally conditional, experimental, or limited
- unused-code inventory is now scanable with `pnpm scan:unused`; the current
  baseline reports export/type candidates that need human review before removal,
  with no confirmed unused files
- some live surfaces should still be treated as experimental until proven stable
- documentation previously overstated maturity and completion

## Product Reset Direction

The app is being reset around a narrower and clearer goal:

- a reliable Polish treasury bond calculator
- a small set of understandable calculator variants
- educational context that supports the calculations
- transparent data freshness and source quality
- simple, fast, readable screens

The app should **not** behave like a recommendation engine, robo-advisor, or wealth management suite.

## Active Delivery Phases

### Phase 1. Recovery Refactor

Status: `Archived as historical execution work`

Goals:

- stop render/update loops
- reduce unnecessary recalculation
- simplify calculator flows
- remove misleading recommendation language
- improve contrast, controls, and readability
- make data source state explicit
- fix stale sync metadata shown in UI
- repair or narrow weak data-backed pages

Primary outputs:

- stable calculator mount behavior on retained routes
- explicit calculate/recalculate model where needed
- smaller and more predictable input surfaces
- calmer shared shell, loading, and status framing
- corrected docs and real acceptance criteria
- support matrix of trusted vs experimental pages
- neutral copy in choose-bond and compare-style flows
- stronger demotion of misleading ranking or advisory-adjacent surfaces
- stricter recovery-lab treatment for optimizer, multi-asset, and limited retirement flows
- golden regression baselines for flagship calculator scenarios

Remaining work from this phase now belongs to production-readiness cleanup rather than a broad recovery plan.

### Phase 2. Calculation Trust

Status: `Current`

Goals:

- validate each bond type against official rules
- reduce hidden assumptions
- align timing, fee, and tax logic across calculators
- remove or quarantine weak scenarios until verified

Primary outputs:

- audited calculation matrix by bond type
- regression coverage for every supported scenario family
- consistent result contracts across calculators
- explicit promotion/demotion decisions for any scenario family that still fails review

### Phase 3. Data Reliability

Status: `Current release-readiness work`

Goals:

- fix stale sync status
- expand historical coverage where the feature promises history
- remove pages that rely on weak or mock-like datasets unless clearly labeled
- show actual source, coverage, and freshness for each data series
- make economic-data page usable or intentionally unavailable

Primary outputs:

- trustworthy data status surfaces
- usable economic data page
- market-vs-bonds data coverage extended or feature scope reduced
- sync metadata that remains current enough to support visible trust labels

### Phase 4. Production Narrowing

Status: `Current release-candidate preparation`

Goals:

- decide which calculators remain in production scope
- archive or hide unstable features
- polish only the set that passes trust and UX thresholds
- prepare the first Google Cloud Run deployment for the trusted-core scope

Primary outputs:

- reduced feature set
- stronger quality bar
- believable release candidate path
- Cloud Run release checklist and deployment runbook

### Phase 5. Backend Platform Migration

Status: `Deferred future`

Goals:

- keep Next.js as frontend-only application shell
- migrate long-term backend responsibilities into a dedicated `.NET` backend
- use native `.NET` authentication, authorization, policy handling, RBAC, and background execution where appropriate
- separate frontend delivery from backend operational concerns

Primary outputs:

- dedicated `.NET` backend architecture
- explicit API boundary between frontend and backend
- backend-owned auth/authz, sync jobs, portfolio/share APIs, and calculation orchestration
- staged retirement of Next.js route handlers once parity is proven

Important rule:

- this phase should not begin until the first trusted-core production release has shipped and parity requirements are explicit

## In-Scope Product Surfaces

The likely retained core:

- education
- single bond calculator
- comparison calculator
- regular investment / ladder if calculation rules are verified
- notebook as a descriptive workspace, not an advisory cockpit
- economic data only if source/freshness are real and visible

The current navigation stance is:

- `primary emphasis`: education, single calculator, comparison, regular investment, ladder, notebook, economic data
- `recovery lab`: optimizer, multi-asset, retirement
- `entry point`: `/recovery-lab` instead of treating those pages as equal first-level calculator choices

The current weaker-but-kept surfaces are:

- `conditional`: comparison, regular investment, ladder, notebook
- `experimental or limited`: optimizer, multi-asset, retirement
- `trusted reference framing`: economic data

## Out-of-Scope Until Stabilized

- recommendation-style winner language
- broad "smart" advisory UX
- social/community features
- novelty UI layers that add state churn
- extra feature growth before trust/performance recovery

## Roadmap Rule

No feature should be marked done only because UI exists.

A feature is done only when:

- calculations are verified
- behavior is stable
- performance is acceptable
- copy is accurate
- source/freshness state is clear
- docs describe reality

## Immediate Production-Readiness Exit Criteria

Before the first trusted-core production release, all should be true:

- retained routes can be opened and used without obvious UI mismatch or stale-shell behavior
- loading, recalculation, and warning states follow the shared calmer recovery framing
- experimental and limited pages do not visually overclaim their role
- sidebar/navigation trust labels match the actual current product stance
- active docs describe the current retained core and recovery-lab split truthfully
- stale docs, unused code, and obsolete local scripts are removed or archived
- `pnpm scan:unused` findings are triaged: confirmed dead code is removed,
  intentional dynamic/framework/operator entrypoints are documented or ignored
- remaining open work is validation and release-gate evidence, not structural rescue

## What Should Not Happen Next

- do not add new calculator families before finishing trust validation
- do not promote recovery-lab pages back into equal-first-class navigation without evidence
- do not restore recommendation-style copy, winner framing, or pseudo-advisory language
- do not widen retirement, optimizer, or multi-asset promises before their underlying support gets stronger
