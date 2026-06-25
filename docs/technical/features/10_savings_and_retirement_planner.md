# 10. Retirement Planner

The retained retirement surface is a limited withdrawal planner. It is not a full goal-planning or portfolio-allocation recommendation engine.

## 1. Current Scope

The user provides:

- initial capital
- monthly withdrawal
- scenario horizon
- supported bond type
- tax wrapper
- expected CPI and NBP assumptions

The UI calls the retirement calculation endpoint and renders a single modeled withdrawal path. The planner explains whether the balance remains positive, the final balance, total withdrawn, modeled annual rate, tax paid, and assumptions/warnings returned by the engine.

## 2. Current Ownership

- `features/retirement/components/RetirementPlannerContainer.tsx` owns client state, macro-default adoption, calculation submission, and component wiring.
- `features/retirement/components/RetirementInputsPanel.tsx` owns input controls.
- `features/retirement/components/RetirementPlannerPanels.tsx` owns result summary, ready state, limits, depletion warning, and support panels.
- `features/retirement/components/RetirementResultsOverview.tsx` owns the balance chart and chart support metadata.
- `features/retirement/lib/retirement-planner-model.ts` owns supported-bond fallback, chart point projection, scenario coverage, translated label maps, tax labels, and model-limit text.
- `features/retirement/lib/retirement-format.ts` owns retirement-specific rate formatting.
- `features/retirement/constants/default-inputs.ts` owns default planner inputs.
- `features/retirement/types/retirement.ts` owns durable planner input types.

## 3. Limits

The current planner uses a steady-rate model and supported retail bond families only. It does not model a full retirement portfolio, stochastic market paths, equity allocation, or contribution-gap optimization.

The UI must keep those limits visible through the limits section and returned calculation assumptions/warnings.

## 4. Testing

Current focused tests include:

- `features/retirement/lib/retirement-planner-model.test.ts` for pure model behavior
- `docs/ui/design-refactor-contract.test.ts` for UI token and surface boundaries
- shared calculation and handler tests under `features/bond-core/tests/**` for engine truth
