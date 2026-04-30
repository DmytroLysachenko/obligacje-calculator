# 17. Functional Requirements

This document defines the **current** requirements for the product after the scope reset.

The app is a **calculator and education tool**, not a recommendation engine.

## 1. Core Product Boundary

- **FR1.1:** The app must simulate Polish treasury bond outcomes based on explicit user inputs.
- **FR1.2:** The app must explain assumptions, timing, fees, and taxes behind a result.
- **FR1.3:** The app must not present outputs as personal financial advice or recommendations.
- **FR1.4:** Pages and features that are incomplete or weak must be labeled, narrowed, hidden, or removed.

## 2. Calculator Requirements

- **FR2.1:** The single bond calculator must support all intended live bond types only if their rules are verified.
- **FR2.2:** The app must calculate maturity and early-redemption scenarios using explicit fee and tax logic.
- **FR2.3:** Inflation-indexed bonds must use the correct inflation-linking rules for the supported scenario.
- **FR2.4:** Regular investment, ladder, comparison, and retirement calculators must share consistent calculation primitives where applicable.
- **FR2.5:** Unsupported or partially validated scenario branches must not be presented as equivalent to trusted ones.
- **FR2.6:** Features that rank bond scenarios must be framed as assumption-based sorting, not advisory guidance.
- **FR2.7:** Retirement-oriented calculations must state exactly which bond types and scenario families are supported.

## 3. Interaction and Performance Requirements

- **FR3.1:** Opening a calculator page must not trigger infinite update or calculation loops.
- **FR3.2:** Small input edits must not cause unnecessary full-page recalculation or heavy remounts.
- **FR3.3:** Heavy calculations should be debounced or explicitly user-triggered, depending on the flow.
- **FR3.4:** URL sync must not create state churn or recalculation loops.
- **FR3.5:** Result sections, charts, and tables should update only when their dependent calculation state changes.
- **FR3.6:** Core flows must distinguish between draft input editing state and committed calculation state where immediate recalculation is too expensive or confusing.
- **FR3.7:** Comparison pages must not continuously update on open without a bounded and intentional trigger path.

## 4. Input Control Requirements

- **FR4.1:** Numeric fields must support precise direct entry.
- **FR4.2:** Sliders, where retained, must use practical ranges and small enough steps for financial assumptions.
- **FR4.3:** Macro assumption sliders must not force coarse jumps such as 1% when finer input is expected.
- **FR4.4:** Sliders must not be the only practical way to set important values.
- **FR4.5:** Inflation-oriented assumption controls should support realistic fine-grained edits and should generally not exceed a default visible max of 15% unless a scenario explicitly requires it.
- **FR4.6:** Slider behavior must be consistent across pages and must not feel jumpy or unpredictable.

## 5. UX and Copy Requirements

- **FR5.1:** The app must use neutral simulation language instead of recommendation language.
- **FR5.2:** Result views must prioritize clarity over feature density.
- **FR5.3:** Critical text and numbers must have readable contrast against background surfaces.
- **FR5.4:** Advanced controls should be secondary to the primary calculator flow.
- **FR5.5:** Visual artifacts, unexplained separators, and unstable layout shifts must be removed from calculator flows.
- **FR5.6:** Core calculator screens must remain understandable without requiring the user to interpret many side widgets, helper panels, or decorative layers.

## 6. Data and Freshness Requirements

- **FR6.1:** Data-backed pages must show source, coverage, and freshness state.
- **FR6.2:** The sync timestamp shown in the UI must reflect actual current sync metadata.
- **FR6.3:** Pages must not show `unknown` source state as a normal mature experience.
- **FR6.4:** Historical comparison features must either use sufficient real coverage or be narrowed/reframed.
- **FR6.5:** The economic data page must either present useful current data with real provenance or be clearly marked unavailable/experimental.
- **FR6.6:** Data-backed comparisons must not imply broad historical completeness when coverage is narrow.

## 7. Documentation and Release Requirements

- **FR7.1:** Active documentation must reflect the real state of the app.
- **FR7.2:** A feature is not complete until it is stable, testable, understandable, and documented honestly.
- **FR7.3:** The app must not be described as production-ready until stability, calculation trust, and data transparency gates are met.
- **FR7.4:** Documentation must distinguish between trusted, experimental, narrowed, and deferred product surfaces.
