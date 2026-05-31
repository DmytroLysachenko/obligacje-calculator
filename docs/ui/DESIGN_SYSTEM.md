# Design Direction

## Product Type

Professional financial analysis platform.

Users should feel:

- trust
- clarity
- focus
- precision

Not:

- startup flashy
- marketing website
- colorful SaaS
- AI-generated dashboard

## Inspiration

Primary:

- Linear
- Vercel Dashboard
- Raycast

Secondary:

- Stripe Dashboard

## Visual Principles

Typography over decoration.

Prefer:

- whitespace
- hierarchy
- alignment
- grouping

Avoid:

- excessive borders
- excessive shadows
- excessive colors
- nested cards

## Screen Rhythm

Financial analysis pages should read in this order:

1. Hero
2. Controls
3. Key Results
4. Analysis
5. Detailed Data

This is a hierarchy rule, not a marketing layout. Keep controls and data close enough that users can scan assumptions and outcomes without hunting through decorative panels.

## Spacing Scale

Allowed spacing values:

- 4
- 8
- 12
- 16
- 24
- 32
- 48
- 64

Do not introduce arbitrary spacing in new UI work. If a component needs a tighter or wider layout, first check whether the page hierarchy is wrong before adding another one-off value.

## Typography Scale

Use typography as the first hierarchy tool.

- Primary metric: 40px
- Large metric: 32px
- Section title: 18px
- Card title: 15px
- Body: 14px
- Metadata: 12px

Prefer shared classes from `app/globals.css`:

- `ui-primary-metric`
- `ui-large-metric`
- `ui-section-title`
- `ui-card-title`
- `ui-body`
- `ui-metadata`

Avoid making every label uppercase and bold. Metadata should support the reading flow; it should not compete with metrics.

## Colors

Background: #F7F7F5
Surface: #FFFFFF

Text Primary: #111111
Text Secondary: #5C5C5C

Border: #E6E5E1

Success: #4E8F71
Warning: #C89D4F

Use semantic tokens instead of raw Tailwind palette classes in product surfaces:

- `text-success`
- `text-warning`
- `text-destructive`
- `text-muted-foreground`
- `border-border`
- `bg-muted`
- `bg-card`

Raw palette utilities such as `text-slate-*`, `bg-blue-*`, `border-amber-*`, and `text-emerald-*` should be treated as visual debt unless they are inside a low-level shadcn primitive or a deliberately documented chart palette.

## Radius

Small:
6-8px

Avoid:
12px+

Default product surfaces should use `rounded-lg` or less. Larger radii are allowed only for low-level primitives where the component itself owns the interaction style and the exception is documented in `docs/ui/design-refactor-contract.test.ts`.

## Borders And Cards

Use borders only when they communicate structure.

Prefer:

- section spacing
- `border-t` or `border-b`
- `divide-y`
- muted backgrounds for form groups
- table row separators

Avoid:

- card inside card
- border around every metric
- border around every helper note
- large shadowed cards
- gradient panels
- translucent decorative shells

The target is at least 50% fewer borders compared with the old UI. A bordered container must have a job: table boundary, modal/dialog boundary, active control state, or page-level structural separation.

## Tables

Tables should feel premium and operational:

- row height should be comfortable, usually `py-4` or `py-5`
- use subtle separators through `border-border`
- avoid zebra striping unless the table is very dense
- keep badges small and semantic
- use monospace only for identifiers, dates, and numeric trace fields where alignment matters

## Sidebar

The sidebar must feel anchored and visually distinct from the content area.

Use:

- steady background contrast
- clear active item state
- compact utility groups
- minimal decorative depth

Do not repeat page card styling inside the sidebar. It is navigation infrastructure, not page content.

## Refactor Guardrails

Any UI refactor should keep these boundaries:

- Do not change business logic.
- Do not change calculation logic.
- Do not change persistence or API data structures.
- Do not introduce new visual primitives when shared token classes cover the need.
- Prefer deleting wrappers before adding new wrappers.
- Prefer one clear verdict or metric area before secondary detail.
- Collapse or subordinate supporting notes when they compete with primary results.
