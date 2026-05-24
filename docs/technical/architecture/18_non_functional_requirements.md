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
- **NFR6.4:** User-facing translated content must be locale-driven through the i18n layer. Inline language branches and inline `pl/en` translation objects in code are not acceptable.
- **NFR6.5:** Commented-out code, dead legacy branches, and duplicate touched-scope logic must be removed rather than preserved.
- **NFR6.6:** UI components must stay narrowly scoped, with route-level orchestration separated from calculation truth, display adapters, and export semantics.
- **NFR6.7:** Internationalized content may be stored as strings, arrays, or nested objects in locale resources, but not as hardcoded translated values in application files.
- **NFR6.8:** The application standard for internationalization is `next-intl`. Custom translation runtimes and custom translation-node resolution layers are not acceptable as long-term architecture.
- **NFR6.9:** Client-side translation access must use the project hook from `@/i18n/client`; SSR/server translation access must use `next-intl/server`; non-React shared utilities must use explicit locale-driven helpers rather than app-level compatibility shims.
- **NFR6.10:** API route handlers must stay thin and delegate business logic and DB access to `lib/server/**` services or repositories.
- **NFR6.11:** Shared UI must be grouped by subdomain under `shared/components/**`; compatibility shims are temporary and must be removed after migration.
- **NFR6.12:** Data reads belong in `lib/data/**`; server-only orchestration belongs in `lib/server/**`; schema and seed concerns must stay separated under `db/schemas/**` and `db/seed/**`.
- **NFR6.13:** Guest users may calculate and preview, but notebook/portfolio workspace mutations must be explicitly gated behind signed-in access.
- **NFR6.14:** Shared workspace selection state belongs in `shared/lib/workspace/**`; feature-local storage helpers must not become cross-feature dependencies.
- **NFR6.15:** Display options such as chart granularity must never alter calculation truth. Chart, table, and export layers must derive from one normalized display contract.
- **NFR6.16:** Simple-mode projected NBP defaults must be sourced from synced data and represented as a flat path until the user overrides them.
