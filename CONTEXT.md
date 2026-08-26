# Obligacje Calculator

This context defines the product language for a trust-first Polish treasury-bond calculator and education product.

## Language

**Committed calculation**:
The last successfully calculated scenario a user has explicitly accepted by submitting a calculation. It remains the decision reference while later input changes form a draft, until the user recalculates.
_Avoid_: live result, automatically refreshed result

**Shared scenario**:
A fully specified scenario opened from a share link. Opening it is an explicit calculation request because its inputs are already fixed by the shared snapshot.
_Avoid_: partially filled draft, implicit background recalculation

**Previous-offer reference**:
A committed calculation whose bond offer is no longer current. It remains visible as a decision reference, while the app marks it as previous-offer and requires explicit recalculation for a current-offer calculation.
_Avoid_: silently refreshed result, current-offer calculation

**Trusted-core release**:
The first production-style Cloud Run release, limited to product surfaces whose calculation behaviour, data transparency, and user-facing claims meet the project's release gates. It is a release scope, not a claim that every visible route is production-certified.
_Avoid_: full-platform launch, feature-complete release

**Release admission**:
The decision to include an individual product surface in the trusted-core release after it has passed its applicable evidence gates. Conditional surfaces are excluded until admitted.
_Avoid_: default inclusion, provisional shipping

**Pre-release visibility**:
The current availability of a route before the public launch decision. It does not grant release admission or establish the route as part of the public product promise.
_Avoid_: shipping status, production scope

**Exception-driven calculation assurance**:
The maintenance stance in which the existing calculation regression suite is the baseline, and new calculation work begins only from a concrete failing scenario, changed rule, or contradiction in release evidence.
_Avoid_: reopening broad calculation validation, speculative math work

**Private-preview operational readiness**:
The evidence-backed state in which the private Cloud Run preview can synchronize authoritative data, expose its source and freshness status, and pass its defined deployment and smoke checks. It is a pre-public-launch milestone.
_Avoid_: public launch readiness, feature completion

**Authenticated private preview**:
A private-preview state in which Google OAuth is configured and a signed-in user can exercise the workspace access path as part of operational evidence.
_Avoid_: anonymous-only preview, OAuth-optional readiness

**Private-preview sync cadence**:
The documented monthly operator run that refreshes active bond offers and macro data for the private preview. Automation is intentionally deferred until public-launch preparation.
_Avoid_: scheduled production sync, ad-hoc data refresh

**Private portfolio utility**:
The intended long-term posture of the application: a personally operated tool
and portfolio artifact, used by its maintainer and selected preview users, not
a product pursuing public launch or broad production admission. Work should
prioritize trusted personal decisions, current data, and demonstrable code
quality; public-launch operational controls remain deferred unless this posture
changes.
_Avoid_: production SaaS, public-launch candidate

**Investment strategy comparison**:
A decision workflow that contrasts explicitly stated long-term investment
strategies under the same contribution, horizon, tax, cost, and data-freshness
assumptions. It explains trade-offs and projected outcomes; it does not issue a
personalized buy, sell, or allocation instruction.
_Avoid_: return ranking, investment recommendation

**Cross-asset strategy comparison**:
An informative comparison of explicitly chosen bond, equity/index, and
cryptocurrency strategies over a stated horizon. It preserves each asset
class's distinct return basis, volatility, drawdown risk, fees, taxes, data
provenance, and limitations; an apparent winner is never presented as a
recommended allocation.
_Avoid_: apples-to-apples return table, portfolio advice

**Historical contribution replay**:
An informative reconstruction of what a fixed, recurring contribution—such as
100 PLN each week—would have bought and become worth over a selected completed
period. It reports historical outcomes under declared price, FX, fee, tax, and
reinvestment assumptions; it is not a forecast or an implied future return.
_Avoid_: expected return calculator, investment forecast

**Long-term instruments workspace**:
The future private workspace that may organize Polish treasury bonds, equities,
and cryptocurrencies into distinct research and strategy-comparison sections.
Each instrument class retains its own assumptions, risk language, data sources,
and evidence rather than being treated as interchangeable. It is deferred until
the Polish-bond strategy workflow is coherent and useful for the maintainer's
own decisions.
_Avoid_: generic trading dashboard, unified asset calculator

**Normal sync evidence**:
The private-preview readiness record produced by a successful monthly sync using the official `gov.pl` current-offer source, with the resulting source and freshness state visible in the app. Fallback sourcing is a separately tested degraded mode and does not establish normal readiness.
_Avoid_: fallback-only readiness, hidden fallback data
