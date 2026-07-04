# Platform Documentation Index

Welcome to the official documentation for **Obligacje Calculator**. This documentation is the master reference for product boundaries, real requirements, technical design, and the current production-readiness path.

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
- [Project Map](./technical/architecture/28_project_map.md) - Repository ownership map for app, feature, shared, server, data, sync, and docs layers.

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

- [00. Current Product Roadmap](./plans/00_roadmap.md) - Current roadmap centered on the trusted-core production scope.
- [01. Long-Term Product Foundation Plan](./plans/01_longterm_product_foundation_plan.md) - Long-term direction after scope narrowing.
- [08. Cloud Run Release Candidate Plan](./plans/08_cloud_run_release_candidate_plan.md) - First Cloud Run deploy checklist for the trusted-core production scope.

### 6. Archived Plans

- [Archived Plans Index](./archive/plans/index.md) - Historical and completed execution plans preserved for reference.

---

_Last Updated: July 4, 2026 - App is in production-readiness cleanup for the trusted-core Cloud Run scope. Active docs distinguish current release work from archived recovery/refactor history, document the current feature folder vocabulary, and track unused-code cleanup through `pnpm scan:unused`._
