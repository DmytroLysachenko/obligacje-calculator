# Platform Documentation Index

Welcome to the official documentation for **Obligacje Calculator**. This documentation is the master reference for product boundaries, real requirements, technical design, and active recovery/refactor work.

## Table of Contents

### 0. Documentation Governance
- [Documentation Architecture and Rules](./00_documentation_architecture_and_rules.md) - Structure, naming, numbering, and archive rules for the documentation system.

### 1. Strategy & Vision (Product)
- [Product Vision & Purpose](./product/01_product_vision_and_purpose.md) - Why this calculator exists and what problem it should solve.
- [Core Product Philosophy](./product/02_core_philosophy.md) - The fundamental principles guiding development.
- [Target Users & Personas](./product/03_target_users_and_personas.md) - Detailed analysis of who we are building for.
- [UX & Design Principles](./product/13_ux_and_design_principles.md) - Aesthetic and usability standards.
- [UI Copy & Tone](./product/14_ui_copy_and_tone.md) - How we communicate with the user.
- [Content Strategy & Education](./product/15_content_strategy_and_education.md) - Our approach to financial literacy.
- [Functional Requirements](./product/17_functional_requirements.md) - Current product requirements after scope reset.
- [Roadmap & MVP Definition](./product/25_roadmap_and_mvp_definition.md) - Reset MVP and recovery path.
- [Trusted & Experimental Feature Matrix](./product/26_trusted_and_experimental_feature_matrix.md) - Current support classes for core, conditional, and experimental pages.
- [UX Improvement Plan](./product/18_ux_improvement_plan.md) - Continuous enhancement of the user experience.

### 2. Technical Architecture
- [System Architecture](./technical/architecture/19_system_architecture.md) - High-level technical design.
- [Handler Pattern Orchestration](./technical/architecture/25_handler_pattern_orchestration.md) - **[NEW]** Decoupled calculation logic.
- [Information Architecture](./technical/architecture/12_information_architecture.md) - Structural map.
- [Non-Functional Requirements](./technical/architecture/18_non_functional_requirements.md) - Quality and performance.
- [Database & Data Modeling](./technical/architecture/20_database_and_data_modeling.md) - Schema and strategy.
- [Detailed Data Schemas](./technical/architecture/20_detailed_data_schemas.md) - Table structures.
- [API Design & Integrations](./technical/architecture/21_api_design_and_integrations.md) - NBP, GUS, Yahoo Finance.
- [Security & Privacy](./technical/architecture/22_security_and_privacy.md) - Protecting user data.
- [Testing & Quality Assurance](./technical/architecture/23_testing_and_quality_assurance.md) - Correctness.
- [Deployment & DevOps](./technical/architecture/24_deployment_and_devops.md) - CI/CD strategy.
- [Engineering and Coding Rules](./technical/architecture/26_engineering_and_coding_rules.md) - Strict repo rules for i18n, component structure, code hygiene, and maintainability.

### 3. Domain Knowledge
- [Polish Bonds Domain Guide](./technical/domain/04_polish_bonds_domain_guide.md) - Comprehensive rules and mechanics.
- [Financial Instrument Model](./technical/domain/05_financial_instrument_model.md) - Unified data structures.
- [Bond Calculation Engine](./technical/domain/06_bond_calculation_engine.md) - Math and logic deep-dive.
- [Calculation Scenarios](./technical/domain/07_calculation_scenarios.md) - Investment paths.
- [Risk Communication & Disclaimers](./product/16_risk_communication_and_disclaimers.md) - Legal boundaries.

### 4. Features & Logic
- [Historical Data & Backtesting](./technical/features/08_historical_data_and_backtesting.md) - Past performance.
- [Comparative Simulations](./technical/features/09_comparative_simulations.md) - Multi-asset comparisons.
- [Savings & Retirement Planner](./technical/features/10_savings_and_retirement_planner.md) - Planning tools.
- [User Notebook & Tracking](./technical/features/11_user_notebook_and_tracking.md) - Personal investments.

### 5. Current Plans & Roadmap
- [00. Current Product Roadmap](./plans/00_roadmap.md) - Honest current-state roadmap centered on recovery and simplification.
- [01. Long-Term Product Foundation Plan](./plans/01_longterm_product_foundation_plan.md) - Long-term direction after scope narrowing.
- [02. Full App Refactor and Recovery Plan](./plans/02_full_app_refactor_and_recovery_plan.md) - Active refactor plan for stability, calculation trust, UX simplification, and documentation reset.
- [03. Manual Regression and Release Candidate Checklist](./plans/03_manual_regression_and_release_candidate_checklist.md) - Route-by-route validation checklist for finishing the recovery refactor responsibly.
- [04. Post-Refactor Polish and Hardening Plan](./plans/04_post_refactor_polish_and_hardening_plan.md) - Separate plan for i18n cleanup, UI/UX polish, edge-case handling, accessibility, and finish-quality hardening.
- [05. Retained Route Regression Execution Log](./plans/05_retained_route_regression_execution_log.md) - Current retained-route evidence snapshot, trust limits, and release-position log.
- [06. Future Backend Migration to .NET Plan](./plans/06_future_backend_migration_to_dotnet_plan.md) - Deferred architecture sketch for keeping Next.js as frontend-only and moving backend logic to a dedicated .NET platform later.
- [08. Cloud Run Release Candidate Plan](./plans/08_cloud_run_release_candidate_plan.md) - First Cloud Run deploy checklist for the trusted-core production scope.

### 6. Archived Plans
- [Archived Plans Index](./archive/plans/index.md) - Historical and completed execution plans preserved for reference.

---
*Last Updated: May 26, 2026 - App remains in active refactor/recovery, with comparison and workspace surfaces split into smaller sections, chart and route data boundaries tightened, current `lib/data/**`, `lib/server/**`, and `db/schemas/**` structure reflected in top-level docs, and secondary tools intentionally demoted behind the flagship calculator flows.*
