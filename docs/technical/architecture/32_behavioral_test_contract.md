# Behavioral Test Contract

## Purpose

- Tests protect user-observable and domain-observable behavior.
- Tests do not freeze CSS utility spelling or file placement.
- Tests name the boundary they protect.
- Tests fail for a meaningful regression.

## Unit tests

- Cover financial math and rounding decisions.
- Cover calendar and tax boundaries.
- Cover decoder limits and unknown keys.
- Cover cache revision, expiry, and invalidation.
- Cover authorization and ownership decisions.
- Use injected clocks and adapters instead of sleeps.

## Component tests

- Cover input, validation, calculation, commit, and recalculate flows.
- Cover cancellation and stale completion behavior.
- Cover visible/accessible name parity.
- Cover error association and focus movement.
- Cover dialog/popover focus return.
- Cover result status announcements.

## Integration tests

- Run against an isolated migrated PostgreSQL database.
- Cover migration from representative old snapshots.
- Cover transaction rollback and owner isolation.
- Cover route body-size/content-type boundaries.
- Cover share quota and expiry.
- Cover rate policy decisions.
- Cover safe problem/error redaction.

## Browser tests

- Cover critical public route archetypes.
- Cover authenticated and guest workspace flows.
- Cover desktop and mobile layouts.
- Cover Polish and English.
- Cover keyboard-only interaction.
- Cover reduced motion, forced colors, and zoom.
- Cover LCP measurement as a required result.

## Contract migration

- Classify legacy source contracts as security/build or presentation-only.
- Keep security/build contracts only where no runtime seam exists.
- Replace presentation-only contracts with behavioral tests.
- Delete a stale contract in the same change as its replacement.
- Do not exclude a failing contract without recording its replacement.
- Keep release-specific contracts explicitly named while migration proceeds.

## Coverage

- Measure decision code, not line-count vanity.
- Focus branch coverage on calculation, permission, and mapping code.
- Add targeted fault injection for high-risk math/authorization paths.
- Avoid one global percentage target.
- Review uncovered critical branches during release review.

## CI ownership

- Vitest owns unit/component/service/integration tests.
- Playwright owns browser tests.
- Lighthouse owns lab budget checks.
- Full Vitest is the default correctness gate.
- Release suite is a fast additional signal, not a replacement.
- Browser diagnostics and traces are retained on failure.

## Triage

- Product regression: fix code and add behavior test.
- Intended behavior change: update contract and user documentation.
- Stale test: replace/delete only after a new seam protects the invariant.
- Environment failure: record dependency/evidence; do not hide it.

## Exit evidence

- Command and artifact links are recorded in the release evidence.
- Each critical boundary has focused tests.
- Runner boundaries prevent cross-collection.
- The ledger names remaining test work explicitly.

## Review questions

- What user or operator decision would fail without this test?
- Does the test observe a public outcome rather than an implementation detail?
- Can a service adapter express the dependency more directly?
- Does the test use a deterministic clock, random seed, and fixture?
- Is private data absent from fixtures, snapshots, and diagnostic output?
- Does a database test begin from reviewed migrations?
- Does a browser test await an actual user-visible readiness condition?
- Does a performance test fail when its metric is missing?
- Is the failure message actionable for the module owner?
- Can an obsolete test be deleted after this test is added?

Answers are captured in the pull-request review when a critical seam changes.
