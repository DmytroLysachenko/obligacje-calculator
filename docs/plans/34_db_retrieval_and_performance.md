# 34. Next 10 Commits Plan: End-to-End Database Integration & Performance

This plan focuses on transitioning the application from a "hybrid" data model (Constants + DB) to a "DB-First" architecture. All financial parameters, market data, and bond definitions will be retrieved from Neon PostgreSQL, ensuring scalability and consistency.

## Commit Sequence

### Commit 1. DB-Driven Bond Definitions & Metadata
**Goal**: Remove `BOND_DEFINITIONS` constant and use `polish_bonds` table as the single source of truth.
**Scope**:
- Update `polish_bonds` table to include `description` (JSONB) and English names.
- Update `getBondDefinitions` in `data-access.ts` to be fully exhaustive.
- Refactor all UI components to use DB-fetched definitions via a shared hook or context.

### Commit 2. Dynamic Tax Limits & Regulation Storage
**Goal**: Move IKE/IKZE annual limits and tax rates from constants to the DB.
**Scope**:
- Create `tax_rules` or `regulation_limits` table.
- Seed limits for 2020-2025.
- Update `getLimitForYear` logic to query the database.

### Commit 3. Market Data Expansion: SPX, Gold, and WIBOR
**Goal**: Fully populate the `data_series` and `data_points` for non-bond assets.
**Scope**:
- Implement seeding scripts for S&P 500 (10y history), Gold, and WIBOR 3M/6M.
- Update `SyncEngine` to prioritize DB data over fallback `HISTORICAL_RETURNS`.
- Ensure `getMultiAssetHistory` never hits the fallback if DB has >1 year of data.

### Commit 4. High-Performance Macro Cache Layer
**Goal**: Minimize DB load for frequent calculation requests.
**Scope**:
- Implement a simple server-side memoization for macro data (CPI/NBP).
- Use `Next.js` tags or a dedicated `Map` with a TTL to store common historical ranges.
- Reduce latency for portfolio simulations by 50%+.

### Commit 5. Unified Sync Engine Hardening
**Goal**: Ensure data freshness without manual intervention.
**Scope**:
- Refactor scraping and API clients (NBP, Stooq) into a robust `SyncManager`.
- Add "Partial Sync" logic to only fetch missing months.
- Implement "Data Integrity Check" to alert on gaps in the `data_points` table.

### Commit 6. DB-Backed Calculation Assumptions
**Goal**: Store default market scenarios (Stable, High Inflation, Recession) in the DB.
**Scope**:
- Create `market_scenarios` table.
- Allow the UI to fetch "Low/Base/High" parameters dynamically.
- Enable admin users to update "Expected Inflation" globally via the DB.

### Commit 7. Removal of `HISTORICAL_RETURNS` Fallback
**Goal**: Eliminate code-bloat and outdated mocks.
**Scope**:
- Audit all features (`comparison-engine`, `regular-investment`) to ensure zero dependency on `constants/historical-data.ts`.
- Delete the fallback constant file.
- Implement a graceful "No Data" UI state for scenarios outside DB coverage.

### Commit 8. Optimized Portfolio Querying
**Goal**: Scale Notebook features for large user datasets.
**Scope**:
- Add indexes to `user_investment_lots` on `portfolio_id` and `purchase_date`.
- Implement a `getPortfolioSummary` stored procedure or optimized Drizzle query to fetch lot counts and total nominals in one trip.

### Commit 9. Transactional Integrity for Portfolio Edits
**Goal**: Ensure lot additions/edits are bulletproof.
**Scope**:
- Implement Drizzle transactions for "Save to Notebook" actions.
- Automatically create/update `user_transactions` when a lot is added or rebought.
- Ensure `updated_at` timestamps are correctly managed at the DB level.

### Commit 10. Final Performance & E2E Validation Audit
**Goal**: Verify the "Pure DB" state.
**Scope**:
- E2E tests using a test DB (Vitest + TestContainers or local Postgres).
- Performance audit: ensure no calculation takes longer than 300ms including DB fetch.
- Update `README_DB.md` with the final schema documentation.

## Recommended Milestones

### Milestone A: Definitions & Tax (Commits 1-2)
- Zero-constant core configuration.

### Milestone B: Market Data Mastery (Commits 3-5)
- Full historical backing for all asset classes.

### Milestone C: Persistence & Scale (Commits 6-10)
- Hardened transactions, optimized queries, and audit completion.
