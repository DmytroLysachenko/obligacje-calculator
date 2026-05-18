# 06. Future Backend Migration to .NET Plan

This document captures a **future** migration direction for the platform:

- keep **frontend** in `Next.js + TypeScript`
- move **backend logic** into a dedicated `.NET` backend environment

This is **not** an active delivery plan right now.

It is a sketch for later, when the current product is functionally correct, UX-polished, and trustworthy enough on the existing Next.js backend layer.

The goal here is to preserve the intended architecture direction early, so future work does not have to rediscover it from scratch.

## 1. Current Intent

The target future architecture is:

- `Next.js` as frontend application shell and UI runtime
- `.NET` as the long-term backend platform
- PostgreSQL as the main persistence layer
- backend auth, authorization, RBAC, background execution, sharing, sync, and domain APIs handled in `.NET`

The product should eventually stop treating Next.js route handlers as the permanent backend solution.

The long-term goal is:

- thinner frontend
- clearer separation of concerns
- stronger backend contracts
- more stable operational model
- easier evolution of auth, permissions, jobs, and APIs

## 2. Why This Migration Exists

The current application already contains meaningful backend behavior, not only UI:

- portfolio CRUD and ownership logic
- scenario sharing
- sync/import pipelines
- issued-series resolution
- calculation orchestration
- export generation
- admin/status/sync endpoints
- trust/freshness metadata flows

This means the app is no longer a trivial "frontend with a few route handlers."

As the product matures, keeping all backend behavior inside the Next.js app becomes less attractive because it makes it harder to:

- enforce stronger domain boundaries
- centralize authorization
- scale background processing cleanly
- expose versioned APIs
- separate frontend deployment from backend deployment
- evolve security and operational tooling in a first-class way

## 3. Non-Goals Right Now

This plan does **not** mean:

- migrate immediately
- stop working on the current Next.js backend layer
- block current frontend/backend polishing
- add a second partially-built backend in parallel right now

This plan is explicitly deferred until the current product reaches a stronger trust and finish-quality baseline.

## 4. Recommended Future Target

## Target Shape

### Frontend

- Next.js App Router
- TypeScript
- React UI only
- SWR / fetch-based API consumption
- no long-term ownership of business-critical backend workflows

### Backend

- ASP.NET Core Web API
- Entity Framework Core or Dapper for persistence access
- PostgreSQL
- first-class authentication and authorization in `.NET`
- background jobs in `.NET`
- domain services in `.NET`
- API versioning and contract discipline

### Shared Boundary

The frontend should communicate with the backend only through explicit APIs, not through embedded server-side page logic or duplicated domain assumptions.

## 5. Architectural Principles for the .NET Backend

The backend should lean heavily on native or standard `.NET` capabilities where they actually help.

Preferred principles:

- `SOLID`
- `DRY`
- `KISS`
- explicit domain boundaries
- thin controllers
- service-layer orchestration
- policy-based authorization
- background work separated from request/response flows
- explicit DTO contracts
- auditability of trusted business rules

The backend should avoid:

- giant controller classes
- implicit cross-feature coupling
- duplicate validation rules in multiple endpoints
- mixing sync jobs, domain rules, and HTTP composition in one place

## 6. Native .NET Features to Prefer

The backend should use native `.NET` platform features as much as practical.

Recommended defaults:

### Authentication

- ASP.NET Core Identity if account-based user auth becomes first-class
- or JWT / cookie auth with ASP.NET authentication middleware if a slimmer identity model is preferred

### Authorization

- ASP.NET Core policy-based authorization
- claims-based checks
- route and action-level authorization attributes
- centralized authorization handlers where required

### RBAC

- role-based authorization for:
  - admin sync endpoints
  - moderation / operational surfaces
  - internal tooling
- policy-based expansion beyond simple roles where feature boundaries require it

### Validation

- data annotations where simple
- FluentValidation or equivalent if validation becomes domain-heavy

### Configuration

- `appsettings.*.json`
- options pattern
- environment-based configuration separation

### Background Work

- `IHostedService` / `BackgroundService` for simple internal recurring jobs
- Hangfire / Quartz / Azure-native scheduler later if job complexity or observability requires it

### Observability

- structured logging via built-in logging abstractions
- health checks
- metrics/tracing integration later

### API Conventions

- OpenAPI / Swagger
- versioned APIs
- explicit request/response contracts

## 7. Recommended Migration Scope

The long-term backend should own:

- bond metadata APIs
- issued-series resolution
- macro/reference data APIs
- sync/status/admin APIs
- portfolio APIs
- notebook/share APIs
- single/comparison/regular/ladder calculation APIs
- export APIs
- scenario snapshot APIs
- ownership and permission model

The frontend should keep:

- UI composition
- local form state
- local visual formatting
- route transitions
- rendering concerns

## 8. What Should Probably Stay Out of .NET

The migration should not move things to the backend just because it can.

Keep on the frontend:

- purely presentational helpers
- view-local state
- chart interaction state
- accordion / modal behavior
- local input staging before API submission

The backend should own business truth, not UI mechanics.

## 9. Migration Difficulty Estimate

For this project, the difficulty is best understood by migration depth.

### A. Partial API Migration

- move only route handlers and CRUD-like APIs
- keep frontend and some domain logic in TS

Estimated difficulty: `4/10`

### B. Meaningful Backend Migration

- move APIs, auth, portfolio/sharing, sync flows, and calculation orchestration
- keep Next.js frontend

Estimated difficulty: `6-7/10`

### C. Full Backend Truth Migration

- `.NET` becomes the real backend source of truth for all important business logic
- TS frontend becomes a thin client

Estimated difficulty: `8-9/10`

For the desired target described in this plan, assume the project is closer to `7/10` than `4/10`.

## 10. Time Estimate

These are directional estimates for one strong engineer working with full repo context.

### Backend Foundation + Hybrid Start

- `2 to 4 weeks`

Includes:

- project scaffolding
- auth/authz baseline
- API structure
- initial DB connectivity
- one or two migrated vertical slices

### Main Retained Backend Migration

- `5 to 8 weeks`

Includes:

- retained calculator APIs
- notebook/portfolio flows
- sharing
- sync/status APIs
- export stabilization

### Full Production-Grade Migration

- `8 to 12+ weeks`

Includes:

- broader regression safety
- operational hardening
- stronger observability
- background execution maturity
- cleanup of legacy Next route handlers

These estimates can move depending on:

- how much business logic is migrated versus only wrapped
- whether auth stays simple or becomes first-class account identity
- whether background ingestion remains light or becomes job-heavy

## 11. Recommended Migration Strategy

Do **not** rewrite everything at once.

The preferred strategy is a phased hybrid migration.

### Phase 0. Stabilize Current Product First

Do this before migration:

- finish retained frontend/backend correctness work
- finish calculation trust work
- finish UX and export hardening
- reduce known route regressions

This phase is mandatory.

### Phase 1. Create the .NET Backend Skeleton

Set up:

- ASP.NET Core Web API project
- environment configuration
- DB connection
- health endpoint
- OpenAPI
- auth/authz baseline
- shared API error model

No broad migration yet.

### Phase 2. Migrate Low-Risk Infrastructure Endpoints

Move first:

- health/status
- admin sync status
- bond/reference read APIs

Reason:

- easier contracts
- lower business risk
- good way to validate deployment and API boundary decisions

### Phase 3. Migrate Portfolio / Notebook Vertical Slice

Move:

- create/list/delete portfolio
- lots CRUD
- share toggles
- export/import package

Reason:

- strong business value
- clear backend boundaries
- good authorization test surface

### Phase 4. Migrate Scenario Sharing

Move:

- saved scenario snapshots
- public share replay APIs

Reason:

- sharing is backend-native by nature
- gives clean API contracts

### Phase 5. Migrate Calculation APIs

Move retained calculator request/response orchestration:

- single
- comparison
- regular investment
- ladder

This does **not** require moving all math immediately if a short transitional bridge is needed, but the long-term goal is backend-owned calculation truth.

### Phase 6. Migrate Sync / Ingestion Jobs

Move:

- bond offer sync
- issued series ingestion
- GUS CPI sync
- NBP history/reference sync
- admin triggers / job status

This is one of the strongest reasons to want `.NET` at all.

### Phase 7. Retire Next.js Backend Logic

Only after parity:

- remove replaced route handlers
- remove duplicate backend utilities from Next app
- keep frontend as clean API client

## 12. Domain Areas to Migrate as Modules

To keep the backend maintainable, split by business capability rather than by technical folder sprawl.

Suggested module boundaries:

- `BondCatalog`
- `BondSeries`
- `ReferenceData`
- `Calculation`
- `Portfolio`
- `ScenarioSharing`
- `SyncJobs`
- `AdminOperations`
- `IdentityAccess`

These do not need to be separate deployables.
They should at least be separate logical modules/namespaces/services.

## 13. Database Strategy

The default assumption should be:

- keep PostgreSQL
- evolve schema gradually
- do not invent a second persistence model unless clearly necessary

The current conceptual model around:

- `polish_bonds`
- `bond_series`
- `data_series`
- `data_points`
- `user_portfolios`
- `user_investment_lots`
- `shared_single_scenarios`

should remain the main conceptual backbone.

The migration should not start by redesigning every table.

Instead:

- first preserve domain behavior
- then improve schema where actual backend design demands it

## 14. Authentication, Authorization, and RBAC Direction

The `.NET` backend should become the final authority for identity and access rules.

Expected access classes:

- anonymous public reader
- guest notebook owner via cookie or temporary identity
- authenticated end user
- admin/operator

Likely authorization zones:

- public read-only scenario shares
- owner-only portfolio and lot operations
- admin-only sync and operational endpoints

If guest persistence remains supported long-term, it should still be normalized inside the backend through one explicit ownership model instead of route-by-route ad hoc handling.

## 15. Risks

The biggest migration risks are not HTTP mechanics.

They are:

- calculation parity drift
- sync/data-trust regressions
- split business rules between TS and C#
- auth/guest ownership regressions
- export behavior divergence
- frontend/backend contract drift during transition

This is why the migration must be phased, not rewritten in one jump.

## 16. Preconditions Before Starting

Do not begin active migration until these are materially true:

- retained calculators behave correctly under real validation
- data trust surfaces are honest enough
- notebook/share/export flows are stable enough
- current docs describe reality
- the current frontend shape is settled enough not to force parallel backend redesign

Without those preconditions, the migration would solidify moving targets.

## 17. Deliverables for the Future Migration Kickoff

When the team decides to activate this plan later, the first concrete deliverables should be:

1. backend solution skeleton in `.NET`
2. deployment/runtime decision
3. API contract baseline
4. auth/authz baseline
5. first migrated read-only vertical slice
6. architecture decision log for identity, background jobs, and migration sequencing

## 18. Current Status

Status: `Deferred future plan`

This plan is intentionally parked until the current product is functionally finished enough on the existing stack.

It exists so later work starts with a coherent backend target rather than improvised rewrite pressure.

## 19. Relationship to Current Plans

This plan is downstream from:

- `02_full_app_refactor_and_recovery_plan.md`
- `03_manual_regression_and_release_candidate_checklist.md`
- `04_post_refactor_polish_and_hardening_plan.md`
- `05_retained_route_regression_execution_log.md`

Only revisit active execution of this `.NET` migration after the current Next.js-backed product reaches a much stronger retained-core trust level.
