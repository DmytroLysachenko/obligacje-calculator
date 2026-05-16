# 11. User Notebook & Tracking

The notebook is now a **manual portfolio workspace**, not a dashboard-theater layer and not a broker integration.

Its job is simple:

- let the user record real or planned bond lots
- let the user simulate them together
- let the user export/import the notebook
- let the user share a portfolio publicly if they want a read-only link

## 1. Current Product Position

The notebook is a secondary retained surface.

It exists **after** the flagship calculator flow, not before it.

That means:

- home page should not pretend the notebook is the main first action
- notebook should help users revisit real lots
- notebook should not impersonate an advisory dashboard

## 2. Current Ownership Model

The current notebook path is guest-first.

### 2.1 Guest mode

By default:

- the app creates or reuses a guest owner id
- that owner id is stored in a cookie
- portfolios and lots are scoped to that owner id

This means the notebook is usable without mandatory sign-in.

### 2.2 Authenticated mode

If auth is available and stable:

- ownership can resolve to the signed-in user id instead

But the retained UX should not depend on auth being present to make notebook basics work.

## 3. Current Core Entities

### 3.1 Portfolio

A portfolio is a container for lots.

Current supported actions:

- create
- select
- rename/update
- delete
- toggle public sharing
- export
- import

### 3.2 Lot

A lot stores a user-recorded bond purchase or planned purchase context.

Current important fields:

- bond type
- optional bond series
- purchase date
- amount
- rebuy/swap flags
- notes

## 4. What the Notebook Is For

The notebook should help answer questions like:

- “What bonds did I actually buy?”
- “What happens if I hold these lots to the modeled horizon?”
- “How concentrated are my ladder maturities?”
- “How do my saved lots relate to the single-scenario simulations I ran before?”

The notebook should **not** act like:

- automatic suitability advice
- a brokerage statement
- a tax-filing engine
- a live bank-connected portfolio

## 5. Current User Flows

### 5.1 Create portfolio

Current flow:

1. create a portfolio
2. it appears immediately in notebook state
3. selection updates without needing a full page reload

### 5.2 Add lot

Current flow:

1. choose portfolio
2. save lot metadata
3. revisit later in portfolio detail

### 5.3 Simulate portfolio

Current flow:

1. notebook lots are converted into a canonical simulation payload
2. portfolio simulation runs through retained calculation paths
3. result is shown as a portfolio-level view, not as a pseudo-trading dashboard

### 5.4 Delete portfolio

Current flow:

1. destructive action is confirmed
2. owned portfolio is deleted
3. notebook view clears stale selection immediately

This was missing earlier and is now an explicit supported path.

### 5.5 Export / import

Current flow:

- export produces a portable notebook package
- import recreates portfolio data under the current owner context

### 5.6 Public share

Current flow:

- portfolio sharing uses a stable `share_id`
- public link opens a read-only portfolio page

This is intentionally separate from single-calculator scenario sharing.

## 6. Current Share Model

There are now **two** sharing concepts in the product:

### A. Portfolio share

Use when:

- you want to share a notebook portfolio
- the recipient should see the recorded lot set

Technical model:

- `user_portfolios.share_id`
- `is_public`
- read-only page under `/p/[shareId]`

### B. Single-scenario share

Use when:

- you want to share one committed single-bond simulation

Technical model:

- persisted snapshot in `shared_single_scenarios`
- read-only replay page under `/s/[shareId]`

These should not be merged conceptually.

## 7. Current UI Expectations

Notebook UI should remain:

- secondary
- clean
- records-oriented
- honest about what is stored and what is modeled

Notebook UI should avoid:

- “wealth cockpit” theater
- too many equally weighted side panels
- recommendation-like messaging
- showing empty dashboards when there are no real lots

## 8. Current Technical Rules

### Rule 1. Response parsing must stay consistent

Clients should consume `ApiResponse<T>` consistently.

This matters because notebook bugs previously came from:

- sometimes assuming raw arrays
- sometimes assuming wrapped payloads

### Rule 2. Ownership must stay aligned across route families

The following route families must resolve the same owner context:

- create/list
- detail
- lots
- simulate
- export/import
- share
- delete

### Rule 3. UI state should update immediately after notebook mutations

Create/import/delete should not require a manual hard refresh to become visible.

## 9. Current Known Limits

The notebook still has intentional limits:

- no bank/broker sync
- no automatic lot discovery
- no authoritative tax statement generation
- no live valuation feed pretending to be a brokerage account

This is good.

The notebook is stronger when it stays narrow and reliable.

## 10. Future-safe Direction

If notebook grows later, the preferred direction is:

- better lot detail
- better aggregated simulation
- clearer maturity and payout reading
- safer import/export

Not:

- more dashboard noise
- more pseudo-advisory suggestions
- more live “smart” nudges without validated value

