# 37. Next 10 Commits: Experience Activation, Everyday Utility & Retention (COMPLETED)

This plan assumes core engine, data reliability, portfolio tracking, optimization, authentication, and baseline performance work are already in place. Main gap now is not raw capability. Main gap is product activation, continuity, clarity, and retention.

Status: completed and ready for archive. Core outcomes now covered by onboarding presets, saved scenario continuity, guardrails, action-focused results, richer notebook follow-through, in-app notifications, richer export/import flows, and personalized dashboard return surfaces.

Platform already calculates well. Next 10 commits should make users:

- reach first good outcome faster
- understand result with less effort
- save and revisit work without friction
- act on portfolio events in real life
- return even when not running fresh simulation

## Why This Plan Exists

Earlier plans strengthened:

- calculation trust
- DB-backed market and macro data
- portfolio and notebook logic
- optimization and advisory hints
- performance and worker-driven execution

That base is strong. User-facing product loop still needs work in 5 places:

1. first session too blank for non-experts
2. repeat session still too dependent on rebuilding state
3. many outputs are correct but not immediately actionable
4. mobile reading path likely worse than desktop creation path
5. notebook lacks enough "come back later" utility

This roadmap fixes those gaps before larger community or multi-asset expansion.

## Product Outcomes

By end of this 10-commit sequence, product should feel less like isolated calculators, more like personal financial workspace.

Expected outcome improvements:

- faster time-to-first-successful-simulation
- higher saved-scenario reuse
- lower validation-driven user confusion
- better mobile result completion
- stronger notebook revisit frequency
- stronger trust via visible formulas, deltas, freshness, and assumptions

## Design Principles For This Sequence

Every commit in this plan should honor these constraints:

- progressive disclosure first
- actionability over decorative UI
- mobile parity, not mobile fallback
- financial warnings must be explicit and non-ambiguous
- persistence should feel reliable and recoverable
- educational content should appear at decision points, not only in separate docs
- new UX must reuse existing audit, sync, and calculation primitives where possible

## Dependencies and Assumptions

This plan assumes existing availability of:

- authenticated user context or durable local persistence
- current scenario serialization format
- notebook entities for holdings and lots
- data freshness metadata from sync layer
- audit trace or explainability metadata from engine
- export pipeline at least for PDF baseline
- responsive layout primitives and shared calculator shells

If any of these are incomplete, those gaps should be handled inside relevant commit scope rather than opening separate infra-only commits.

## Cross-Cutting Requirements

Each commit below should include:

- i18n parity for `pl` and `en`
- accessibility pass for keyboard and screen reader basics
- analytics/event naming for new major interactions
- empty/loading/error states
- tests at correct level:
  - unit for mappers/formatters/guards
  - component tests for interactive UI logic where feasible
  - e2e smoke for critical new path if user journey changes materially

## Commit Sequence

### Commit 1. Guided First-Run Experience and Demo Scenarios
**Goal**: Reduce blank-screen friction for first-time users and teach core paths without forcing doc reading.

**Scope**:
- Add lightweight onboarding entry on dashboard and main calculator.
- Offer one-click starter scenarios:
  - protect savings from inflation
  - save for child in 12 years
  - short-term cash parking
  - use IKE/IKZE efficiently
- Pre-fill inputs, macro assumptions, and short explanatory copy.
- Add "why this scenario exists" note for each preset.
- Persist onboarding completion, dismissed steps, and last starter path.
- Allow replay from help menu.

**Implementation Notes**:
- Prefer small guided overlays, not long tour chains.
- Reuse current routing and calculator shell rather than building separate onboarding pages.
- Scenario presets should map to real calculator contracts, not ad hoc UI-only state.

**Acceptance Criteria**:
- New user can reach populated calculator in one click.
- Preset loads valid inputs and produces result without manual repair.
- Returning user is not repeatedly interrupted after dismissal/completion.
- Help entry can reopen onboarding on demand.

**Risks**:
- Over-long tours hurt completion.
- Hardcoded preset assumptions can go stale against updated bond offers.

**Mitigation**:
- Keep tour optional and short.
- Pull preset bond candidates from current available series when possible.

### Commit 2. Saved Scenarios Hub with Resume, Duplicate, Versioning, and Compare
**Goal**: Make repeat usage natural; users should build on previous thinking, not restart from zero.

**Scope**:
- Add dedicated saved scenarios hub.
- Support actions:
  - resume
  - duplicate
  - rename
  - archive
  - soft delete
  - compare with current run
- Save metadata:
  - goal label
  - calculator type
  - wrapper mode
  - inflation scenario
  - chosen bond or portfolio shape
  - last recalculated date
  - current freshness status
- Add lightweight version history or "last 3 snapshots" per scenario.
- Show stale assumption badge when market/macro inputs changed since last calc.

**Implementation Notes**:
- Separate scenario identity from result snapshot.
- Preserve backward compatibility with existing saved-state shape if already stored locally.
- Archive should hide clutter without destructive loss.

**Acceptance Criteria**:
- User can resume exact prior scenario state.
- Duplicate creates independent editable branch.
- Compare highlights key deltas between two saved snapshots.
- Archived scenarios remain recoverable.

**Risks**:
- Serialization drift between calculators.
- Old saved objects may fail after schema changes.

**Mitigation**:
- Introduce explicit scenario schema version.
- Add migration layer for older saved scenarios.

### Commit 3. Smart Input Guardrails and Bond-Specific Validation
**Goal**: Stop bad setups early, explain why, offer safe repair when possible.

**Scope**:
- Real-time validation for:
  - minimum amount
  - amount lot multiples
  - invalid purchase/redemption combinations
  - duration shorter than supported product horizon
  - wrapper contributions above yearly limits
  - unsupported macro assumptions
  - impossible backtest dates
- Show bond-specific guidance inline.
- Add one-click auto-fix actions:
  - round to valid amount
  - snap date to valid issue window
  - split overflow into taxable account when wrapper cap exceeded
- Classify messages:
  - info
  - caution
  - blocking

**Implementation Notes**:
- Validation rules should live in shared domain-aware layer, not spread across forms.
- UI should distinguish "invalid" from "allowed but risky".

**Acceptance Criteria**:
- Invalid configuration cannot silently submit.
- User sees exact offending field and exact reason.
- Auto-fix preserves user intent where possible.
- Bond-specific rules render consistently across all calculators using same inputs.

**Risks**:
- Too much validation noise can feel hostile.
- Cross-field validation can become inconsistent.

**Mitigation**:
- Debounce warning density.
- Centralize rules and severity mapping.

### Commit 4. Calculation Summary Cards with Clear Next Actions
**Goal**: Turn result screen into decision surface, not raw output dump.

**Scope**:
- Refactor result header into summary cards for:
  - final net value
  - real return
  - total interest
  - total tax paid
  - early exit sensitivity
  - best alternative candidate or benchmark delta
- Add immediate next actions:
  - save scenario
  - add to notebook
  - compare another bond
  - export PDF
  - export CSV
  - open explainability panel
- Add "what changed vs previous run" delta strip.
- Add assumption summary chip row near top.

**Implementation Notes**:
- Card order should match user priority: answer first, breakdown second, action third.
- Reuse canonical result object; avoid calculator-specific summary drift.

**Acceptance Criteria**:
- Key outcome readable without scrolling on standard desktop.
- Major action buttons visible without hunting.
- Delta state appears only when meaningful comparison exists.

**Risks**:
- Too many cards can become dashboard clutter.

**Mitigation**:
- Keep top row compact.
- Move lower-priority metrics behind expand/tabs if needed.

### Commit 5. Explainability Layer 2: Inline Formula Walkthroughs, Glossary Links, and Reason Narratives
**Goal**: Let normal users inspect math confidence path without opening full audit tables.

**Scope**:
- Add expandable formula panels next to major outputs.
- Show substituted values for:
  - gross interest
  - tax deduction
  - fee deduction
  - real-return adjustment
  - wrapper benefit where applicable
- Add "why this result wins" narrative from advisor rules plus audit metadata.
- Link each metric and term to glossary/education deep-link.
- Add "view full trace" bridge to existing deeper audit surface.

**Implementation Notes**:
- Narrative must be deterministic and based on explicit rule outcomes, not freeform generation.
- Keep formulas human-readable; do not expose raw internal engine structure unless useful.

**Acceptance Criteria**:
- User can inspect any major figure and see formula path in <2 clicks.
- Explanations match actual engine values.
- Links land in correct glossary or education sections.

**Risks**:
- Formula surfaces can contradict rounding shown elsewhere.

**Mitigation**:
- Standardize display rounding and source-of-truth formatting helpers.

### Commit 6. Mobile Result Consumption Pass: Cards, Sticky Actions, Expandable Charts, and Table Alternatives
**Goal**: Make advanced result pages truly usable on phones, not merely responsive.

**Scope**:
- Convert dense tables to card/list variants on small screens.
- Add sticky bottom action bar for:
  - recalculate
  - save
  - export
  - add to notebook
- Add tap-to-expand chart mode with stronger tooltip ergonomics.
- Keep primary summary metrics visible during deep scroll.
- Improve chart legends, hit targets, and horizontal overflow behavior.
- Reduce layout shift during recalculation with stable skeletons/placeholders.

**Implementation Notes**:
- Mobile layout should optimize reading and acting, not mimic desktop structure.
- Charts may need simplified series defaults on small screens.

**Acceptance Criteria**:
- No critical result or action becomes inaccessible on phone widths.
- Tables remain understandable without pinch-zoom.
- Sticky action bar never obscures important content.

**Risks**:
- Duplicate desktop/mobile render paths can drift.

**Mitigation**:
- Share data adapters, vary presentation only.

### Commit 7. Notebook Maturity Center and Upcoming Cashflow Timeline
**Goal**: Upgrade notebook from passive registry into active planning workspace.

**Scope**:
- Add notebook subview centered on upcoming events:
  - maturities in 30/90/180 days
  - coupon or interest events
  - early redemption windows
  - tax-relevant liquidity moments
- Show expected incoming cashflow timeline.
- Add quick actions from each lot:
  - simulate rollover
  - compare replacement bond
  - add reminder
  - mark sold/redeemed
- Add portfolio-level "cash available soon" strip.

**Implementation Notes**:
- Event generation should come from current lot metadata and calculation helpers, not manual tagging.
- Timeline should separate guaranteed events from estimated events.

**Acceptance Criteria**:
- User can identify next portfolio event without drilling into each lot.
- Quick action from event row lands in prefilled next workflow.
- Redeemed/sold state updates timeline correctly.

**Risks**:
- Event dates for some bond types may need careful interpretation.

**Mitigation**:
- Reuse engine/date logic already trusted in calculators.
- Mark estimated items clearly where exact event timing differs by scenario.

### Commit 8. Alerts, Notification Preferences, and In-App Notification Center
**Goal**: Create useful re-entry triggers based on financial timing, not vanity engagement.

**Scope**:
- Add notification preferences for:
  - maturity in 7/30 days
  - new bond series release
  - inflation data update
  - tax limit nearing exhaustion
  - saved scenario becoming stale
- Ship in-app notification center first.
- Support optional future channels:
  - email
  - browser push
- Store per-user settings, last-sent markers, and dismissal state.
- Add notification grouping and read/unread behavior.

**Implementation Notes**:
- Notification generation should be idempotent.
- Distinguish system events from advisory events.

**Acceptance Criteria**:
- User can opt in/out by category.
- Duplicate notifications do not spam same event repeatedly.
- Notification links open correct destination context.

**Risks**:
- Low-signal alerts become noise fast.

**Mitigation**:
- Start with few high-value event types only.
- Add digesting/grouping before expanding channel surface.

### Commit 9. Wealth Export Pack: CSV, JSON, Advisor Summary, and Import Reliability
**Goal**: Make user data portable, auditable, and easy to reuse outside app.

**Scope**:
- Expand exports:
  - monthly timeline CSV
  - scenario JSON
  - notebook JSON package
  - advisor-ready summary
- Improve import path:
  - schema validation
  - duplicate detection
  - partial failure reporting
- Include metadata in every export:
  - data freshness date
  - inflation scenario
  - tax assumptions
  - wrapper mode
  - app version
  - export timestamp
- Allow export of:
  - current result
  - saved scenario
  - selected portfolio
  - full notebook package

**Implementation Notes**:
- JSON should be stable, documented, versioned.
- CSV column naming must favor spreadsheet usability over internal field names.

**Acceptance Criteria**:
- Export files open cleanly and contain enough metadata for later interpretation.
- Import rejects malformed payloads clearly.
- Round-trip export/import preserves core notebook data.

**Risks**:
- Export format drift breaks future imports.

**Mitigation**:
- Add version field and import migrations.
- Add fixture-based tests for sample files.

### Commit 10. Personalization and Habit Loop Dashboard
**Goal**: Make dashboard worth revisiting even when user is not starting from scratch.

**Scope**:
- Build personalized modules:
  - last viewed scenario
  - favorite bonds watchlist
  - latest inflation/rate snapshot
  - upcoming maturities and reminders
  - recently changed assumptions
  - suggested next action
  - saved scenario freshness warnings
- Add preference controls for:
  - default calculator
  - chart mode
  - theme
  - language
  - inflation display preference
  - dashboard module ordering
- Add concise "since your last visit" summary.
- Surface watchlist movements and new issue relevance.

**Implementation Notes**:
- Dashboard should be modular, not monolithic.
- Personalization should degrade gracefully for anonymous or first-time users.

**Acceptance Criteria**:
- Returning user sees at least one actionable personalized item.
- Empty dashboard states still guide next useful action.
- Preferences persist across sessions/devices where supported.

**Risks**:
- Too many modules reduce clarity.

**Mitigation**:
- Start with focused default layout and allow expansion later.

## Milestones

### Milestone A: Activation and Re-entry
Commits `1-3`

Outcome:
- users start faster
- users preserve work
- users avoid broken setups

### Milestone B: Decision Clarity
Commits `4-6`

Outcome:
- answer visible faster
- reasoning visible when needed
- mobile reading path no longer second-class

### Milestone C: Retention and Portfolio Follow-Through
Commits `7-8`

Outcome:
- notebook becomes living planner
- reminders create legitimate return triggers

### Milestone D: Portability and Personal Product Loop
Commits `9-10`

Outcome:
- data ownership improves
- dashboard becomes return surface

## Recommended Execution Order Within Each Commit

For each commit, preferred internal sequence:

1. domain/state contracts
2. storage/schema changes
3. data adapters/selectors
4. UI surface
5. analytics hooks
6. tests
7. content/i18n polish

This reduces late-stage UI rewrites caused by unstable contracts.

## Metrics To Track

Use lightweight analytics to validate plan value. Suggested metrics:

- onboarding preset start rate
- preset -> successful calculation conversion
- saved scenario creation rate
- saved scenario reopen rate
- validation error frequency by field
- summary action click-through:
  - save
  - notebook
  - compare
  - export
- explainability open rate
- mobile result completion rate
- notebook revisit rate
- notification opt-in and notification open rate
- export usage by format
- dashboard action click-through

## Testing Strategy

Minimum testing expectations for this roadmap:

- unit tests for validation rules, scenario migrations, export/import schemas
- component tests for onboarding, summary cards, mobile action bar, notification center
- integration tests for scenario save/resume/duplicate flows
- e2e smoke for:
  - onboarding preset -> result -> save scenario
  - saved scenario -> resume -> compare
  - notebook event -> rollover simulation
  - export -> import notebook round-trip

## Main Risks Across Whole Plan

### Risk 1. UX Layer Fragmentation
If every calculator gets bespoke handling, product consistency drops.

**Response**:
- prefer shared shells, summary adapters, validation contracts, and action bars

### Risk 2. Persistence Schema Drift
Saved scenarios and exports can become fragile as calculators evolve.

**Response**:
- add versioned schemas and migrations early in commit 2 and commit 9

### Risk 3. Notification Noise
Users disengage if reminders feel spammy.

**Response**:
- ship high-signal event types first
- add cooldowns and grouping

### Risk 4. Mobile Complexity Explosion
Too many mobile-specific branches can slow maintenance.

**Response**:
- vary presentation only, keep data and action contracts shared

### Risk 5. Explainability/Rounding Mismatch
If formulas do not visually match outputs, trust drops.

**Response**:
- centralize formatting and displayed rounding rules

## What This Plan Optimizes For

- more users reaching first successful calculation
- fewer invalid or confusing scenario setups
- more saved work and resumed work
- better understanding of why one bond or strategy wins
- stronger mobile completion and action rates
- more notebook-driven return visits
- better data portability and user ownership
- stronger product stickiness after initial adoption

## What This Plan Intentionally Defers

This plan does not prioritize first:

- social/community features
- broad multi-asset expansion
- heavy new infrastructure without direct UX impact
- AI-generated advisory systems
- full external wealth-management integrations

Those should follow after activation, continuity, explanation, and retention loop become excellent.

## Definition of Success

This plan succeeds if, after these 10 commits:

- first-time users reach meaningful result in fewer steps
- returning users can resume previous work in seconds
- invalid scenarios are corrected before costly confusion
- result screens clearly show answer, reason, and next action
- mobile users can read, save, compare, and export without friction
- notebook users see upcoming events and have direct follow-up tools
- notifications bring users back for genuinely relevant reasons
- exports and imports feel stable, trustworthy, and reusable
- dashboard gives each returning user clear personalized value
