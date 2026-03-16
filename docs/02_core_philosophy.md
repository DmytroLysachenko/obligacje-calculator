# 02. Core Product Philosophy

The development of the platform is governed by a set of non-negotiable principles. These ensure that as the application grows in complexity, it remains consistent in its value to the user.

## 1. Transparency of Logic
Every output must be explainable. The platform should never provide a "black box" result. Users should be able to click on any number to see the underlying assumptions, formulas, and data sources (e.g., "Why is my tax 19% here?").

## 2. Friction is the Priority
Most calculators show "gross" returns. We prioritize the "net" reality. Inflation, the 19% "Belka" tax, early redemption fees, and purchase spreads must be integrated into the core view of every calculation.

## 3. Educational Framing
Every feature is an opportunity to teach. We do not just show a chart; we explain *what the chart means* for the user's financial health. We use terminology that is technically correct but explained through contextual tooltips and plain-language summaries.

## 4. Calm and Analytical UX
The platform is a tool for long-term thinking. We avoid high-contrast "red/green" tickers, flashing notifications, or any elements that induce FOMO (Fear Of Missing Out). The design should promote a feeling of stability and trust.

## 5. Modular Domain Design
The system architecture treats financial logic as separate from the UI. This allows the core calculation engines to be tested independently and allows for the rapid addition of new financial instruments without breaking existing functionality.

## 6. Real-World Context
Investments do not exist in a vacuum. We use real historical data (from NBP, GUS, and Stooq) to provide context. Instead of just "5% growth," we show "5% growth during a 10% inflation period," highlighting the concept of *real return*.

## 7. User Privacy by Default
The platform provides high value without requiring an account. Sensitive financial simulations are kept private, and data persistence is handled with a "privacy-first" mindset.
