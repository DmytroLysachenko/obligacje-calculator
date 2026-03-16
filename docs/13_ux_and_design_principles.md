# 13. UX & Design Principles

The platform's design must bridge the gap between "Consumer App" and "Professional Financial Tool."

## 1. Visual Language
- **Color Palette:**
    - Primary: Deep Navy (Trust, Stability).
    - Secondary: Teal/Green (Growth, Profit).
    - Accent: Amber (Warnings, Fees, Taxes).
    - Background: Clean White/Soft Gray (Clarity, focus).
- **Typography:** Sans-serif (Inter or Robust) for readability. Monospace for numerical tables to ensure alignment.

## 2. Data Visualization Standards
- **Interactivity:** Every chart point must have a tooltip showing the exact Date and Value.
- **Clarity over Beauty:** Avoid "curvy" lines if they distort the data. Use "Step" lines for interest rate changes.
- **Legend Integration:** Legends should be interactive (click to toggle visibility of a series).
- **Mobile Charts:** Simplified views with horizontal scrolling or "Tap to expand."

## 3. Progressive Disclosure
- **Level 1:** "You will have 12,500 PLN." (The Answer).
- **Level 2:** "10k Principal + 3k Interest - 500 Tax." (The Summary).
- **Level 3:** Full Month-by-Month Table. (The Proof).
- **Default:** Level 1 & 2 are visible. Level 3 is collapsed behind a "View Details" button.

## 4. Input Design
- **Sliders for Discovery:** Allow users to quickly see how "Amount" or "Time" changes the outcome.
- **Precision Inputs:** For power users, allow typing exact numbers.
- **Preserved State:** If a user moves from a Bond Calculator to a Comparison Tool, their "Initial Amount" and "Duration" should carry over.

## 5. Responsive Strategy
- **Desktop:** Multi-column layout (Inputs on left, Results on right).
- **Mobile:** Single-column scroll. Results summary is "Sticky" at the bottom or top so it updates as inputs change.

## 6. Feedback & Errors
- **Validation:** Instant feedback if a date is in the future or an amount is negative.
- **Helpful Failures:** If data is missing (e.g., NBP API down), explain it clearly and use the last cached value with a "Data from [Date]" badge.
