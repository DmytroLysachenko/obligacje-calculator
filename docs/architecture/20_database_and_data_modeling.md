# 20. Database & Data Modeling

The database stores the "source of truth" for instruments, historical rates, and (optionally) user data.

## 1. Schema Overview (Conceptual)

### A. `instruments` Table
Stores the definitions of all financial assets.
- `id` (UUID)
- `slug` (String, Unique)
- `type` (Enum: bond, crypto, equity, commodity)
- `metadata` (JSONB: engine-specific config)
- `is_active` (Boolean)

### B. `bond_series` Table
Specific issue details for bonds.
- `instrument_id` (FK)
- `series_code` (String, e.g., "EDO0834")
- `issue_date` (Date)
- `maturity_date` (Date)
- `initial_rate` (Decimal)
- `margin` (Decimal)

### C. `historical_data` Table
Time-series data for all assets.
- `id` (BigInt)
- `instrument_id` (FK)
- `timestamp` (Date/DateTime)
- `value` (Decimal)
- `type` (Enum: price, cpi, nbp_rate)

### D. `users` & `user_data` (Future)
For account-based syncing.
- `user_id` (UUID)
- `email` (String)
- `settings` (JSONB)
- `encrypted_notebook` (Text/Blob)

## 2. Key Relationships
- An `instrument` can have many `historical_data` points.
- A `bond` instrument has one entry in `bond_series` for each unique issue.
- A `user_scenario` links to an `instrument_id`.

## 3. Performance Optimizations
- **Indexing:** Indexes on `(instrument_id, timestamp)` for fast time-series queries.
- **Aggregates:** Pre-calculated monthly averages for long-term charts.
- **JSONB for Metadata:** Allows the `instruments` table to stay flexible as new asset types are added.

## 4. Client-Side Schema (IndexedDB)
Using Dexie.js to mirror parts of the logic for offline use.
- `scenarios`: Stores user's calculation inputs.
- `notebook_holdings`: Stores user's manual investment entries.
- `cache_rates`: Temporary storage of fetched historical data.

## 5. Migration Strategy
- Use Drizzle Kit for schema migrations.
- Ensure all financial data changes are versioned and audited.
- Maintain a `seed` script with historical GUS/NBP data for local development.
