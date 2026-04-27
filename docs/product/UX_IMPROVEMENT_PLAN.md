# UX & Feature Improvement Plan - Obligacje Calculator

This document outlines the strategic plan for improving user experience, adding high-value features, and polishing the application to ensure it's a world-class financial tool.

## 1. Onboarding & Education
*   **Feature:** Interactive Tour.
    *   *Details:* Implement a step-by-step guide (using `react-joyride` or similar) for first-time users on the Dashboard and Single Calculator.
*   **Feature:** Financial Glossary.
    *   *Details:* Add a "Help" or "Glossary" section in the Education tab explaining terms like:
        *   Belka Tax (Podatek Belki)
        *   IKE/IKZE Limits
        *   Bond Indexation (CPI + Margin)
        *   Redemption Fees
*   **Improvement:** Enhanced Tooltips.
    *   *Details:* Replace generic tooltips with "Learn More" links that open small modals with detailed examples.

## 2. Advanced Portfolio Features
*   **Feature:** User Accounts (Cloud Sync).
    *   *Details:* Move from purely local storage/link-based sharing to database-backed persistent user profiles.
*   **Feature:** Push Notifications.
    *   *Details:* Notify users when:
        *   A bond is maturing in 7 days.
        *   New bond series are released by the Ministry of Finance.
        *   Inflation data is updated.
*   **Feature:** Asset Diversification Analysis.
    *   *Details:* Add a section in the Notebook to compare the bond portfolio against historical performance of Gold or Global Stocks (WIG20, S&P 500).

## 3. Polish & Usability
*   **Improvement:** Skeleton Loaders.
    *   *Details:* Ensure every calculation request shows a consistent skeleton UI instead of a generic "Loading..." text or blank state.
*   **Improvement:** Mobile-First Tables.
    *   *Details:* Transform large tables into "Card Views" on screens smaller than 768px.
*   **Improvement:** Dark Mode Consistency.
    *   *Details:* Verify all chart colors and interactive elements are perfectly legible in both light and dark themes.
*   **Improvement:** Input Validation.
    *   *Details:* Add real-time validation for "Purchase Date" (cannot be in the far future) and "Initial Investment" (must be multiples of 100 for most bonds).

## 4. Export & Reports
*   **Feature:** PDF Reports.
    *   *Details:* Generate a beautiful one-page PDF summary for any calculation result, perfect for printing or sharing.
*   **Feature:** CSV/Excel Export.
    *   *Details:* Allow users to download the full monthly timeline of their simulation for custom analysis in Excel.

## 5. Technical SEO & Performance
*   **Improvement:** Image Optimization.
    *   *Details:* Ensure all OG images and icons are served in WebP format with proper caching.
*   **Improvement:** Edge Caching.
    *   *Details:* Cache API responses for historical data (inflation/NBP) at the edge for ultra-fast load times.
*   **Localization:** Set Polish as the default language for the site, as it targets the Polish market.

---

### Implementation Priority:
1.  **High:** Skeleton Loaders & Input Validation (Immediate UX win).
2.  **High:** Default Language to PL.
3.  **Medium:** Glossary/Tooltips & Mobile Tables.
4.  **Medium:** CSV Export.
5.  **Low:** User Accounts & Push Notifications.
