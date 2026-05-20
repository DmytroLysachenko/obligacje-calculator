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

### 2.1 Hard Rule

User-facing copy must come from locale files through the translation layer.

The following pattern is not acceptable for UI text:

```ts
language === 'pl' ? '...' : '...'
```

This is not a preferred shortcut. It is a repo violation for normal UI copy.

### 2.2 Required Pattern

Use translation keys only:

```ts
t('some.key')
t('some.key', { value })
```

### 2.3 Exceptions

Allowed only when the branch changes behavior, formatting strategy, or locale-specific library configuration rather than raw copy. Examples:

- `Intl.NumberFormat` locale codes
- `date-fns` locale objects
- metadata structure that must map locale to standards-compliant machine values

These exceptions do not permit inline translated sentences, labels, headings, helper text, button copy, badges, tooltips, legends, table headers, empty states, or validation text.

### 2.4 Touched-Code Rule

When editing an existing file, remove inline language text branches in the area you touch. Do not add new ones.

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

## 4. No Dead Legacy Paths

Do not preserve old code “just in case.”

When a path is replaced:

- remove unreachable branches
- remove duplicate helper logic
- remove stale adapters and unused props
- remove obsolete local state and fallback branches that are no longer part of the chosen design

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

## 7. UI and Domain Responsibilities Must Stay Separate

Route and component code must not reimplement domain rules that belong in handlers, adapters, or engine utilities.

Specifically:

- calculation truth belongs in engine/handler layers
- display semantics belong in display/export adapters
- UI components render prepared data and trigger actions

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
- remove commented-out code
- remove dead or duplicate local helpers
- extract repeated UI into narrow primitives when repetition is obvious
- align naming with real semantics

This does not mean unrelated full-file rewrites. It does mean leaving the touched area cleaner than it was.

## 10. Review Standard

A change is not production-ready if it:

- introduces new inline translated copy branches
- leaves commented-out code behind
- adds large mixed-responsibility components without justification
- duplicates semantics already handled elsewhere
- hides domain truth inside page-local UI conditionals

The default review posture for this repository is to reject these patterns rather than tolerate them.
