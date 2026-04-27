# 25. Handler Pattern Orchestration

To ensure the calculation engine remains maintainable, scalable, and follows SOLID principles, the platform utilizes a **Handler & Factory Pattern** for orchestrating different investment scenarios.

## 1. Architectural Motivation

Originally, the `CalculationApplicationService` was a monolithic class responsible for:
- Data enrichment (Historical CPI/NBP)
- Database lookups for bond series
- Scenario-specific logic (Single Bond, Portfolio, Optimizer, etc.)
- Caching and sanitization

As the number of scenarios grew (Retirement Planner, Regular Investment), the class became a "God Object" violating the Single Responsibility Principle (SRP).

## 2. The Solution: Scenario Handlers

The logic is now decomposed into individual `ScenarioHandler` implementations, each residing in `features/bond-core/handlers/`.

### Core Components

#### A. `ScenarioHandler<TRequest, TResponse>` Interface
Defines the contract for any calculation scenario.
```typescript
export interface ScenarioHandler<TRequest, TResponse> {
  kind: ScenarioKind;
  handle(payload: TRequest, context: HandlerContext): Promise<CalculationEnvelope<TResponse>>;
}
```

#### B. `BaseHandler` Abstract Class
Provides shared utilities used across all handlers:
- `withHistoricalData()`: Enriches inputs with market data.
- `createEnvelope()`: Wraps raw results into a standardized `CalculationEnvelope`.
- `buildHistoricalDataWarnings()`: Checks for data gaps.

#### C. `HandlerFactory`
A centralized registry that maps `ScenarioKind` to the corresponding handler. This allows the `CalculationApplicationService` to remain agnostic of the specific calculation details.

## 3. Implementation Map

| Scenario Kind | Handler Class | Responsibility |
|---------------|---------------|----------------|
| `SINGLE_BOND` | `SingleBondHandler` | Individual bond math, historical series lookup, tax-wrapper split. |
| `PORTFOLIO_SIMULATION` | `PortfolioSimulationHandler` | Aggregated timeline generation for multiple bond lots. |
| `BOND_OPTIMIZER` | `OptimizerHandler` | Ranking all bond types based on horizon and inflation. |
| `REGULAR_INVESTMENT` | `RegularInvestmentHandler` | Recurring contribution modeling. |
| `BOND_COMPARISON` | `ComparisonHandler` | Normalized or independent side-by-side simulations. |
| `RETIREMENT_PLANNER` | `RetirementPlannerHandler` | Sustainable withdrawal modeling. |

## 4. Benefits

1.  **SOLID Adherence**:
    - **S**: Each handler does one thing.
    - **O**: New scenarios can be added by creating a new handler without modifying existing ones.
    - **D**: Data sources are injected via the `HandlerContext`.
2.  **Testability**: Individual handlers can be unit-tested in isolation by mocking the `HandlerContext`.
3.  **Readability**: The orchestrator (`CalculationApplicationService`) is reduced from ~600 lines to ~50 lines.
4.  **Performance**: Enables easier implementation of specific optimizations (e.g., worker-based batching) per scenario.
