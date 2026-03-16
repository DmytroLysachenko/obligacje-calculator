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
