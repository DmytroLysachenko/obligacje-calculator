# UI Improvement Plan

This plan preserves calculation and data behaviour. Each ticket is a self-contained, green commit. Status is updated as commits land.

| #   | Commit purpose                     | Affected areas                                    | Acceptance criteria & validation                                                                                  | Status                                      |
| --- | ---------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | Design tokens & visual foundations | global styles, design documentation               | Unified semantic foundations, reduced-motion baseline, documented audit/direction; lint, types, focused contracts | completed — lint, type check, diff review   |
| 2   | Typography & spacing               | global type utilities, landing, error screen      | Shared scale and sentence-case professional tone; lint, types                                                     | completed — lint, type check, diff review   |
| 3   | Shared layout & navigation         | application layout, sidebar                       | Anchored desktop and contextual mobile navigation with clear active/focus states; lint, types                     | completed — lint, type check, diff review   |
| 4   | Reusable component consistency     | button, card, table, chart frame                  | Controls, surfaces, and data tables share restrained states and rhythm; lint, types                               | completed — lint, type check, diff review   |
| 5   | Forms & interaction states         | form fields, money input, form select             | Readable labels, errors, descriptions, and touch-size controls with no logic change; lint, types, form contracts  | completed — lint, type check, diff review   |
| 6   | Primary calculator                 | single-calculator panels and inputs               | Clearer setup/results hierarchy, calm pending/stale state; lint, types, calculator contracts                      | completed — lint, type check, diff review   |
| 7   | Secondary calculators              | regular investment, ladder, retirement, optimizer | Consistent control/result layouts and result hierarchy; lint, types, related contracts                            | completed — lint, type check, diff review   |
| 8   | Reference & workspace pages        | home, economic-data, education, notebook          | Better responsive density and page-specific hierarchy; lint, types                                                | in progress — checks & diff review complete |
| 9   | Accessibility & feedback           | toast, dialogs, suspense, error state             | Accessible labels/live feedback, reduced motion, clearer errors/loading; lint, types, feedback contracts          | pending                                     |
| 10  | Final consistency pass             | comparison, shared headers/notes                  | Eliminate remaining visual outliers and verify cross-route consistency; lint, types, full test suite/build        | pending                                     |

## Ticket ordering

1. Foundations — no blockers.
2. Typography & spacing — blocked by 1.
3. Layout & navigation — blocked by 1.
4. Primitive consistency — blocked by 1.
5. Forms — blocked by 4.
6. Primary calculator — blocked by 2, 5.
7. Secondary calculators — blocked by 3, 5.
8. Reference/workspace pages — blocked by 2, 3, 4.
9. Accessibility/feedback — blocked by 3, 4, 5.
10. Consistency pass — blocked by 6, 7, 8, 9.
