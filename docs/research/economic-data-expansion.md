# Economic data expansion: Polish saver context

## Decision

Keep the calculator's authoritative inputs narrow: the current retail-bond offer,
CPI and the NBP reference rate. Add the following as clearly labelled **context**
series, not automatic return assumptions. They make the product more useful for a
Polish saver without implying that any macro reading predicts a bond return.

The existing database already supports this shape: `data_series` stores source,
frequency and freshness metadata, and `data_points` stores dated observations.
Today the retained macro sync covers `pl-cpi` (official GUS monthly archive) and
`nbp-ref-rate`; production seed data also contains S&P 500 and gold series. The
bond-offer sync stores current Polish retail-bond terms. [Current data model](../technical/architecture/20_database_and_data_modeling.md)

## Recommended order

| Priority | Series to retain                                                      | Official source and practical feed                                                                                                                                                                                                                                                                           | Saver-facing value                                                                                                                                                                                                                                            |
| -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2        | **POLONIA / overnight interbank rate**                                | [NBP's POLONIA page](https://nbp.pl/statystyka-i-sprawozdawczosc/stawka-referencyjna-polonia/) publishes the daily, volume-weighted unsecured overnight interbank rate and historical downloads.                                                                                                             | Makes ROR/DOR's reference-rate mechanism tangible and distinguishes the overnight market rate from the NBP policy rate. Educational context only: the bond terms define the actual index and timing.                                                          |
| 1        | **PLN FX: EUR/PLN and USD/PLN mid-rates; optionally table-C bid/ask** | [NBP Web API](https://api.nbp.pl/en.html) supplies current and historical A/B mid rates and C buy/sell rates in JSON/XML (FX history from 2 Jan 2002).                                                                                                                                                       | Enables a “value in PLN” comparison for foreign-currency goals, a PLN investor's historical USD asset view, and an honest illustration of exchange-rate risk/spread. Do not portray NBP mid-rate as an executable retail exchange rate.                       |
| 1        | **Wages: average monthly gross wage, enterprise sector**              | [GUS Local Data Bank wage series](https://bdl.stat.gov.pl/bdl/dane/podgrup/temat/40/403/2687) provides the short-term enterprise-sector series and its scope; use the documented [BDL REST API](https://api.stat.gov.pl/Home/BdlApi?lang=en) for JSON/XML ingestion.                                         | A simple “income growth versus inflation and savings target” view makes real purchasing power personal. Label it _gross_ and note that the enterprise-sector measure covers entities with 10+ employees, so it is not a household income forecast.            |
| 1        | **Unemployment: registered unemployment rate and count**              | [GUS Local Data Bank registered-unemployment data](https://bdl.stat.gov.pl/bdl/dane/podgrup/wymiary/4/12/2961) provides monthly observations through the same [BDL REST API](https://api.stat.gov.pl/Home/BdlApi?lang=en); use the national rate/count, not a mixture of registered and survey unemployment. | Supports a plain-language household-resilience card: weak labour-market conditions are a reason to review emergency-fund assumptions, not a signal to trade bonds. Regional views can later add local relevance.                                              |
| 3        | **Retail sales: real, seasonally adjusted and year-on-year change**   | GUS's monthly [retail-sales releases](https://stat.gov.pl/en/topics/prices-trade/trade/retail-sales-in-june-2026%2C11%2C130.html) include constant-price and seasonally adjusted movements plus downloadable tables.                                                                                         | Gives a timely read on consumer demand alongside CPI and wages. Use a “household economy” explainer, not a recommendation engine.                                                                                                                             |
| 3        | **Real GDP: quarterly y/y and q/q, seasonally adjusted**              | [GUS quarterly national accounts](https://stat.gov.pl/en/topics/national-accounts/quarterly-national-accounts/) publish flash/preliminary estimates and later revisions; download the published tables rather than scrape prose.                                                                             | Provides the slow-moving economic backdrop for an educational dashboard and scenario explanations. Preserve vintage/revision metadata; GDP is revised, so an older point must be replaceable.                                                                 |
| 4        | **Polish Treasury auction yields / issuance demand**                  | The Ministry of Finance [Transaction Database](https://www.gov.pl/web/finance/transaction-database) is downloadable and includes primary-auction yields/prices; [T-bill and T-bond auctions](https://www.gov.pl/web/finance/t-bills-and-t-bonds) provide issuance context.                                   | Lets users compare the _new retail offer_ with wholesale issuance conditions and learn why a held retail bond follows its own terms. This is **not** a daily secondary-market yield curve; do not imply tradability/liquidity or like-for-like comparability. |

## Product boundary and rollout

1. **First release:** EUR/PLN + USD/PLN, wages and registered unemployment.
   The NBP API and GUS BDL API make these repeatable official feeds, and the
   user value is immediate: currency exposure plus income/purchasing-power and
   resilience context.
2. **Second release:** POLONIA as a compact companion to NBP-linked bonds.
   It should follow confirmation that its official historical-download format is
   stable for unattended ingestion.
3. **Third release:** retail sales, GDP and Treasury yields in an expandable
   macro view. These are useful orientation data, but less directly actionable
   for an individual bond calculation and have stronger revision/definition
   concerns.

For every series, retain `source_url`, publication/effective date, retrieval
time, unit, frequency, seasonal-adjustment flag, revision/vintage where present,
and a freshness policy. Show the date and definition beside the chart. Treat a
missing or stale value as unavailable context, never as a calculated input.

## Why this is business value, not investment advice

The differentiator is helping a Polish saver understand _their purchasing power,
income resilience, PLN exposure and the mechanism of a selected bond_. These
datasets can make that interpretation concrete, but cannot establish a future
return, a buy/sell recommendation or a personal suitability result.
