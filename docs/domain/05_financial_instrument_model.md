# 05. Financial Instrument Model

To support the expansion from Polish Bonds to other assets (Bitcoin, S&P 500, Gold), the system uses a unified domain model. This ensures that the UI can render any instrument using a standardized interface while delegating specific math to specialized engines.

## 1. Core Instrument Entity

All instruments must implement this base structure:

```typescript
interface FinancialInstrument {
  id: string;               // Unique identifier (e.g., "PL-EDO-0834")
  slug: string;             // URL-friendly name (e.g., "edo-10-year")
  type: InstrumentType;     // "bond" | "crypto" | "equity" | "commodity"
  provider: string;         // "Polish Treasury" | "Exchange" | "NBP"
  
  // Display Metadata
  name: string;
  description: string;
  riskLevel: 1 | 2 | 3 | 4 | 5; // 1 = Low, 5 = High
  
  // Logic Pointers
  engineId: string;         // ID of the calculation engine to use
  taxRulesId: string;       // ID of the tax logic to apply
}
```

## 2. Instrument-Specific Extensions

### Bond Extension
```typescript
interface BondMetadata extends FinancialInstrument {
  durationMonths: number;
  interestModel: "fixed" | "floating-nbp" | "inflation-linked";
  capitalizationInterval: "annual" | "maturity" | "none";
  earlyRedemptionFee: number; // PLN per 100 PLN nominal
  baseMargin?: number;        // For floating/inflation types
}
```

### Market Asset Extension (Crypto/Equity)
```typescript
interface MarketAssetMetadata extends FinancialInstrument {
  ticker: string;             // e.g., "BTC", "SPX"
  historicalSource: "stooq" | "coingecko";
  volatilityIndex?: number;   // Calculated based on history
}
```

## 3. The Calculation State

When a user runs a simulation, the state is captured in a `Scenario` object:

```typescript
interface Scenario {
  instrumentId: string;
  startDate: Date;
  initialInvestment: number;
  monthlyContribution?: number;
  durationMonths: number;
  
  // User Assumptions
  assumptions: {
    expectedInflation: number[]; // Yearly percentages
    expectedMarketGrowth?: number;
    reinvestDividends: boolean;
  };
}
```

## 4. Normalization Layer
Before results are sent to the UI, they must be normalized to a standard `TimeSeries` format:

```typescript
interface TimeSeriesResult {
  date: Date;
  nominalValue: number;    // Principal + Accrued Interest
  netValue: number;        // After Tax and Fees
  realValue: number;       // Adjusted for Inflation
  events: FinancialEvent[]; // e.g., "Interest Payout", "Tax Deduction"
}
```
