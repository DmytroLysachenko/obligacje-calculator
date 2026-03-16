# 19. System Architecture

The platform is designed as a modern, decoupled web application.

## 1. High-Level Components

### A. Frontend (Next.js)
- **UI Layer:** React components using Tailwind CSS and Radix UI.
- **Visualization:** Recharts or Highcharts for interactive data display.
- **State:** Zustand for local calculator state; React Query for data fetching.

### B. Core Calculation Library (`finance-core`)
- A pure TypeScript package.
- Contains the Bond Engine, Market Engine, and Tax Logic.
- 100% test coverage.

### C. Data Ingestion Service
- **Scheduler:** Inngest or GitHub Actions.
- **Task:** Fetch CPI from GUS, Rates from NBP, and Tickers from Stooq.
- **Storage:** PostgreSQL (Drizzle ORM) for historical series.

### D. Persistence Layer
- **Client-Side:** IndexedDB (via Dexie.js) for the Notebook and Scenarios.
- **Server-Side:** Optional Supabase/PostgreSQL for account-based sync.

## 2. Data Flow
1.  **User Input:** User changes a slider in the UI.
2.  **Calculation:** The `finance-core` engine runs locally in the browser.
3.  **Result:** UI updates instantly with new values and charts.
4.  **Sync:** If enabled, the scenario is saved to `IndexedDB`.

## 3. Scalability Strategy
- **Static Content:** Educational articles are pre-rendered (ISR) for speed.
- **Calculations:** Running calculations on the client offloads the server and provides zero latency.
- **Data Scaling:** Historical market data is aggregated into "Day/Month" snapshots to keep chart payloads small.

## 4. Technology Stack
- **Language:** TypeScript.
- **Framework:** Next.js (App Router).
- **Database:** PostgreSQL (via Drizzle).
- **Styling:** Tailwind CSS.
- **Testing:** Vitest for engine logic; Playwright for E2E.
