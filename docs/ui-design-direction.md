# UI Design Direction — Quiet Instrument Panel

## Product thesis

Obligacje Calculator is a Polish Treasury Bonds decision tool for people who want credible answers without financial-dashboard theatre. Its visual signature is a quiet instrument panel: warm paper-like neutral surfaces, ink-dark information, restrained green only for confirmed positive states, and carefully aligned figures that read like a reliable statement rather than a marketing page.

## Tokens

- **Paper** `#F8F7F4`: page background and large empty areas.
- **Surface** `#FFFFFF`: controls, tables, and contained content only.
- **Ink** `#181512`: primary text and primary actions.
- **Graphite** `#665F55`: supporting copy and inactive navigation.
- **Rule** `#DDD7CA`: dividers and input boundaries.
- **Yield green** `#397454`: confirmed success and positive financial results only.
- **Amber** `#B57922`: caution, stale assumptions, and incomplete conditions.

The existing semantic CSS tokens remain the source of truth. New product surfaces use token utilities rather than raw palette values.

## Typography & spacing

- Use the shared page-title scale for every route; the landing page may be more editorial but not materially larger.
- Use sentence case for ordinary labels, buttons, and feedback. Reserve compact uppercase labels for table columns or data provenance.
- Set numerical results in tabular figures. A primary answer is large; supporting values are deliberately quieter.
- Work only on the established 4/8/12/16/24/32/48/64px rhythm. Divider-led sections use 32px mobile and 48px desktop separation.

## Layout & components

- The sidebar is the fixed navigation instrument; content is a calm report canvas. Mobile receives a compact contextual header, not a second dashboard.
- Page headers anchor title, purpose, calculation state, and relevant actions in one aligned line/stack.
- Forms are grouped by decision, not by every input receiving its own decorative card. Controls use predictable 44–48px targets and readable descriptions.
- Result modules prioritise verdict, supporting figures, then evidence. Tables and charts stay operational, with quiet dividers rather than nested cards.
- Empty, loading, error, warning, and success states all explain the current condition and the next appropriate action in the same calm voice.

## Interaction & accessibility

- Every interactive primitive has visible keyboard focus, explicit hover/active feedback, and a 44px target when practical on touch screens.
- Motion is limited to color/opacity/transform transitions and is removed for `prefers-reduced-motion`.
- Buttons state the result of their action; status updates use polite live regions; icon-only controls receive accessible labels.
- On mobile, side-by-side calculators stack earlier; primary calculation actions remain clear after a long form without obscuring content.

## Reuse / remove

Reuse shared page headers, calculator shells, `FormField`, semantic notices, metric strips, table primitives, and responsive table sheets. Remove one-off all-caps “engine” language, arbitrary oversized headings, heavy tooltip shadow treatment, and `transition-all`.
