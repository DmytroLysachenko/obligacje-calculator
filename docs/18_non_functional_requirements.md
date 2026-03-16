# 18. Non-Functional Requirements

Quality and performance standards for the platform.

## 1. Correctness & Precision
- **NFR1.1:** Calculations must match official PKO BP / Bond portal results with a margin of < 0.01 PLN.
- **NFR1.2:** Use high-precision decimal math libraries (Decimal.js). No floating-point errors.
- **NFR1.3:** Calculations must be unit-tested against at least 50 historical edge cases.

## 2. Performance
- **NFR2.1:** Initial page load < 2 seconds on 4G.
- **NFR2.2:** Calculator re-calculation on input change < 100ms.
- **NFR2.3:** Charts must render smoothly with up to 10,000 data points (long-term simulations).

## 3. Availability & Reliability
- **NFR3.1:** The app must work offline (PWA) for previously cached assets and calculators.
- **NFR3.2:** Graceful degradation: If the external API (NBP/GUS) is down, use local cached data and show a "Stale Data" warning.

## 4. Security & Privacy
- **NFR4.1:** No financial data should be sent to the server in "Anonymous Mode."
- **NFR4.2:** Compliance with GDPR (RODO) for any future account features.
- **NFR4.3:** Use CSP (Content Security Policy) to prevent XSS.

## 5. Accessibility
- **NFR5.1:** WCAG 2.1 Level AA compliance.
- **NFR5.2:** Screen reader support for charts (via ARIA descriptions or data tables).
- **NFR5.3:** High-contrast mode support.

## 6. Maintainability
- **NFR6.1:** Separation of concern: Calculation logic must be in a standalone, framework-agnostic package.
- **NFR6.2:** API response caching to minimize external provider costs/load.
- **NFR6.3:** Modular instrument definitions (JSON-based) to allow adding new bonds without code changes.
