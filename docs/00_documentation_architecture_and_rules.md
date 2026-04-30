# 00. Documentation Architecture and Rules

This document defines the strict structure, naming rules, and lifecycle rules for the `docs/` directory.

## Purpose

Documentation should be:

- easy to navigate
- easy to maintain
- consistent in naming
- explicit about what is active versus historical
- safe to reorganize without breaking references

## Top-Level Structure

The `docs/` directory uses this structure:

- `00_documentation_architecture_and_rules.md`
  - source of truth for documentation rules
- `index.md`
  - master documentation entry point
- `plans/`
  - active planning documents only
- `archive/plans/`
  - completed or superseded plans
- `product/`
  - strategy, UX, copy, requirements
- `technical/architecture/`
  - system and engineering architecture
- `technical/domain/`
  - financial domain and mathematical reference material
- `technical/features/`
  - feature-specific technical design

## Naming Rules

### Rule 1. Active content docs use numbered filenames inside their folder

Format:

- `NN_short_snake_case_title.md`

Examples:

- `01_product_vision_and_purpose.md`
- `18_ux_improvement_plan.md`
- `00_roadmap.md`

### Rule 2. Root governance docs use reserved filenames

Reserved root docs:

- `00_documentation_architecture_and_rules.md`
- `index.md`

### Rule 3. Archive keeps historical numbering

Archived plans preserve their original numbering so historical references remain understandable.

Examples:

- `26_app_refactoring_plan.md`
- `37_next_10_commits_experience_activation_and_retention.md`

### Rule 4. Filenames use lowercase snake_case

Do:

- `18_ux_improvement_plan.md`
- `10_polish_treasury_bonds_guide.md`

Do not:

- `UX_IMPROVEMENT_PLAN.md`
- `PolishTreasuryBondsGuide.md`

## Heading Rules

### Rule 1. First heading must match document identity

The first heading should follow:

- `# NN. Title`

Examples:

- `# 01. Product Vision & Purpose`
- `# 00. Current Product Roadmap`
- `# 18. UX Improvement Plan`

### Rule 2. Archive docs may append status

Allowed:

- `# 36. ... (COMPLETED)`

### Rule 3. Non-index docs should have one clear canonical title

Avoid multiple competing titles in the opening section.

## Lifecycle Rules

### Active Plans

`docs/plans/` must contain only:

- current roadmap
- current long-horizon active planning material
- plans that still drive implementation

### Archived Plans

Move plan docs to `docs/archive/plans/` when they are:

- completed
- superseded
- historically useful but no longer execution-driving

### Index Maintenance

Whenever a doc is renamed, moved, archived, added, or removed:

1. update `docs/index.md`
2. update any local archive or folder indexes
3. update cross-links inside docs
4. verify no stale filename references remain

## Numbering Policy

Numbering is folder-scoped, not global across all documentation.

That means:

- `product/18_...` and `technical/architecture/18_...` can both exist
- `plans/00_...` and `product/01_...` can both exist

This keeps local order clear without forcing one giant global numbering system.

## Recommended Folder Semantics

### `product/`

Use for:

- vision
- philosophy
- personas
- UX
- copy
- requirements
- product roadmap framing

### `technical/architecture/`

Use for:

- system structure
- APIs
- schemas
- deployment
- testing
- security

### `technical/domain/`

Use for:

- bond rules
- formulas
- financial concepts
- mathematical guides

### `technical/features/`

Use for:

- technical decomposition of major user-facing capabilities

### `plans/`

Use for:

- current execution plans only

## Change Discipline

Before adding a new documentation file:

1. decide correct folder
2. assign folder-scoped number
3. use snake_case filename
4. add matching `# NN. Title`
5. update `docs/index.md`

Before archiving:

1. confirm doc is no longer active
2. move it, do not copy it
3. keep its historical number
4. update archive index and master index

## Current Standard Summary

Strict standard now is:

- active docs: folder-scoped numbered filenames
- archive docs: preserve historical numbering
- root docs: reserved governance/index names
- all links updated when files move
- `docs/plans/` stays small and active only
