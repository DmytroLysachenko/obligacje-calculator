# 23. Testing & Quality Assurance

Financial applications require a rigorous testing strategy to ensure mathematical correctness and system stability.

## 1. The Testing Pyramid

### A. Unit Tests (Engine Level)

- **Tool:** Vitest.
- **Target:** The `finance-core` library.
- **Scope:** Every bond type, tax rounding, inflation lag logic, and early redemption fee.
- **Requirement:** 100% code coverage.
- **Data-Driven Testing:** Use "Golden Files" (pre-calculated results from official bank tools) to compare against our engine.

### B. Integration Tests

- **Target:** API routes and database interactions.
- **Scope:** Correctly fetching historical series, handling missing GUS data, and caching logic.

### C. E2E (End-to-End) Tests

- **Tool:** Playwright.
- **Scope:** User journeys (e.g., "User fills EDO form -> result matches expectation -> user adds to notebook").
- **Visual Regression:** Ensure charts render correctly across Chrome, Firefox, and Safari (Mobile/Desktop).

## 2. Calculation Verification (Audit)

- We maintain a dedicated `audit.ts` file that contains the results of official PKO BP calculations for various scenarios.
- The CI/CD pipeline runs these audits on every commit. If our engine deviates by even 0.01 PLN, the build fails.

## 3. Performance Testing

- Use Lighthouse to track Core Web Vitals.
- Stress-test the chart rendering with 30 years of daily data points.

## 4. Manual QA

- Cross-checking results with real-world bond maturity statements from community members.
- Beta-testing with "Strategic Planner" users to find edge cases in complex bond ladders.

## 5. Deployment Checks

- **Staging Environment:** All changes deployed to a staging URL for final verification before production.
- **Smoke Tests:** Automated check of the 5 most popular bond calculators immediately after deployment.

## 6. Release Contracts

- `pnpm test:release` runs the calculation, worker, data freshness, API readiness, deployment, product readiness, script, and clean-code contract suites.
- `docs/technical/architecture/clean-code-contract.test.ts` blocks broad code-smell regressions in production paths: stale TODO/FIXME/debug markers, unmanaged route responses, direct feature-layer fetch calls, direct sync/provider fetch calls, unmanaged API body parsing, and undocumented lint-disable comments.
- Feature-local state models require focused unit tests before hook/page rewrites. This applies to calculator state, optimizer readiness/default models, notebook workspace models, dashboard metadata state, chart tooltip models, and similar non-React decision logic.
- Shared form models require focused unit tests before component splits. Current examples include market assumption setup-mode transitions and header value formatting.
- Source-contract tests must follow implementation ownership after refactors. If a public barrel re-exports a moved engine, contracts should inspect the concrete engine module where the invariant lives.
- Component split tests should assert ownership across model, control, and container files when the split is architecture-relevant. This prevents accidental recombining of pure logic and JSX-heavy rendering.
- Operational endpoints require service-level tests for payload/check construction and source contracts for route thinness.
- Chart fallback behavior requires data-helper tests covering fallback source, coverage bounds, partial availability, stale status, and route reuse.
- Provider HTTP changes require gateway tests that cover default headers, HTTP failure behavior, and fallback-compatible status handling.
- When a new architecture rule becomes release-critical, add or update a contract test in the same change as the documentation.

## 7. Production Hardening Checklist

Before a deploy candidate:

- run `pnpm check:release`
- run focused financial regressions for any touched calculation engine family
- run manual smoke flows for single calculator, comparison, notebook, optimizer, sync-status display, and economic-data dashboard
- verify generated/exported artifacts use the same display model as on-screen charts and tables
- verify docs changed with any new architecture boundary or release-blocking rule
