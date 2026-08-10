# 04. Financial Workflow Accessibility Contract

## Names and labels

- Visible trigger text is contained in its accessible name.
- Icon-only controls have localized accessible names.
- Decorative icons are hidden from assistive technology.
- Form labels are programmatically associated with controls.
- Help and errors use described-by relationships.
- Placeholders never replace labels.

## Touch and keyboard

- Interactive icon targets are at least 44 by 44 CSS pixels.
- Every action is reachable by keyboard.
- Focus order follows the financial decision flow.
- Dialog and popover focus returns to its trigger.
- Scrollable tables have focusable labelled regions.
- Keyboard users can reach chart details when charts add information.

## Financial result semantics

- State whether a result is draft, committed, stale, or recalculating.
- Present verdict before detailed tables.
- Keep previous valid results visible during recalculation.
- Announce completion and failure with restrained live feedback.
- Move focus to validation summary or first invalid field after failure.
- Present assumptions, tax, fees, and freshness in readable text.

## Chart parity

- Every chart has a concise title and summary.
- Color is never the sole series distinction.
- Every observation is available in a table or raw export.
- Tooltip-only facts have keyboard/touch alternatives.
- Screen readers do not traverse decorative SVG point noise.
- Axis and legend contrast pass in both themes.

## Responsive behavior

- True financial tables remain tables when relationships matter.
- Horizontal overflow has visible and announced affordance.
- Sticky headers/first columns are used only when useful.
- 320px width remains usable without hidden essential controls.
- 200% and 400% zoom retain reading order.
- Polish long-copy variants are reviewed with English variants.

## Motion and focus

- Routine animation uses transform or opacity only.
- Do not use transition-all for interactive feedback.
- Reduced-motion preference removes non-essential motion.
- Focus indicators remain visible in both themes.
- Looping decorative animation is paused or avoided.

## URL and persistence

- Non-sensitive filters and selected views may be URL state.
- Personal calculator inputs remain versioned local/session/authenticated state.
- Back and forward navigation restores a coherent view.
- URLs never expose private notes, owner identifiers, or scenario inputs.

## Required automation

- Axe runs on every trusted route class at desktop and mobile.
- Explicit assertions cover visible/accessible name parity.
- Keyboard-only smoke covers calculate, error, modal, and export flows.
- Browser tests cover Polish and English.
- Browser tests cover reduced motion and forced colors.
- Browser tests cover zoom/reflow on key financial tables.

## Manual review

- Screen-reader review validates chart summaries and result announcements.
- Touch review validates target size and no hover-only decision.
- Financial-comprehension review validates verdict/assumption order.
- Review artifacts name route, locale, viewport, and assistive setup.

## Exit criteria

- New controls comply before a route is declared trusted.
- Existing violations remain ledger-tracked until repaired.
- Automated success does not replace a manual financial-output review.
- Offline behavior never presents stale financial data as current.

## Review record

Each manual review records the route, commit, locale, viewport, browser, input
method, assistive technology, result, and follow-up issue. A failed manual
finding is not waived by an axe pass. Regressions are fixed with a focused
automated check whenever their observable behavior can be expressed in a test.
This record makes accessibility review repeatable rather than dependent on one
person's memory.

The record is retained with release evidence.

It supports reproducible remediation.

It informs future component work.
