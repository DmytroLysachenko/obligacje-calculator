# 21. API Design & Integrations

The platform interacts with multiple external data providers to keep its calculations accurate.

## 1. Internal API (Next.js Routes)

### `GET /api/instruments`
- Returns a list of available assets with basic metadata.
- Supports filtering by type.

### `GET /api/rates/:instrumentId`
- Returns historical time-series data for a specific asset.
- Supports `?start=` and `?end=` date filters.

### `GET /api/calculate/bond`
- A server-side alternative to the client-side engine (useful for API-based integrations).
- Inputs passed as query params; returns a JSON breakdown.

## 2. External Integrations

### A. GUS (API.stat.gov.pl)
- **Purpose:** Fetch monthly CPI (Inflation) data.
- **Challenge:** The API can be slow and returns complex XML/JSON structures.
- **Strategy:** Cache GUS data heavily; only fetch once per month after the 15th.

### B. NBP (api.nbp.pl)
- **Purpose:** Fetch the "Reference Rate" and daily Exchange Rates (USD/PLN).
- **Strategy:** Daily fetch for FX; on-demand or periodic for NBP rates.

### C. Stooq (CSV/Web Scraping)
- **Purpose:** Fetch S&P 500, Gold, and Bitcoin prices.
- **Strategy:** Use `stooq.pl` CSV exports for bulk historical data; use an aggregator like CoinGecko for crypto if Stooq is unavailable.

## 3. The Ingestion Pipeline (Worker)
1.  **Trigger:** Cron job runs at 01:00 UTC.
2.  **Fetch:** Poll GUS, NBP, and Stooq.
3.  **Clean:** Normalize data into the `historical_data` schema (correcting for holidays/gaps).
4.  **Save:** Update PostgreSQL.
5.  **Invalidate:** Purge Vercel/CDN cache for related instrument routes.

## 4. Rate Limiting & Safety
- Use a "Circuit Breaker" pattern: if GUS API is down, don't keep retrying; wait 1 hour.
- Implement API key rotation for providers that require authentication.
- Log all ingestion failures to an observability tool (Sentry/Logtail).
