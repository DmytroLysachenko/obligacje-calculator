# 01. Product Vision & Purpose

## The Problem
Financial planning is often perceived as either overly simplistic (basic savings accounts) or prohibitively complex (speculative trading and complex derivatives). Retail investors in Poland, particularly those seeking low-to-moderate risk, lack a transparent, high-fidelity tool to model their financial future. Existing bank calculators are often biased toward specific products, while spreadsheet modeling is prone to errors and difficult for the average user.

## The Vision
To build the most trusted, accurate, and educational investment simulation platform in Central Europe. The platform will empower users to move from passive saving to informed, strategic investing by providing a "financial sandbox" where decisions can be tested before they are executed.

## Core Purpose
1.  **Democratize Financial Literacy:** Break down complex concepts like "inflation-linked margins," "Belka tax," and "compounding" into understandable, actionable insights.
2.  **Unbiased Simulation:** Provide a neutral ground where Polish Treasury Bonds can be compared fairly against global equities, commodities, and digital assets.
3.  **Accuracy First:** Establish a "source of truth" for calculations that accounts for all real-world frictions (taxes, fees, inflation, liquidity).
4.  **Strategic Planning:** Shift focus from "price watching" to "goal achieving," helping users plan for retirement, house down-payments, or children's education.

## Evolutionary Path
- **Phase 1: The Bond Specialist.** Perfect the modeling of Polish Treasury Bonds, including the most complex inflation-linked scenarios.
- **Phase 2: The Multi-Asset Simulator.** Integrate S&P 500, Gold, and Bitcoin to allow for risk/reward comparisons.
- **Phase 3: The Personal Finance Hub.** Introduce personalized savings plans and automated goal tracking.

## Production Scale & Infrastructure Targets (New)
To transition from a conceptual MVP to a production-ready system, the following infrastructure targets must be met:
- **Data Veracity:** Eliminate mocked data. All macroeconomic and bond series data must be sourced from official providers (NBP, Stooq, GUS) and seeded into a relational database.
- **Calculation Accuracy:** The bond math engine must handle exact day counts, capitalization rules, early redemption penalties, and tax roundings accurately without approximations.
- **Database Scalability:** Implement robust, strictly-typed schemas (Drizzle/PostgreSQL) with proper indexing to support user portfolios and historical market data at scale.
- **User Continuity:** Provide secure user authentication and persistent portfolio tracking to enable long-term financial planning.

## Success Metric
Success is defined by the number of users who report feeling "significantly more confident" in their investment choices after using the platform, validated by the platform's mathematical accuracy against real-world bond outcomes and robust handling of high-traffic data syncs.