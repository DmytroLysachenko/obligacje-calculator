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

**Normal sync evidence**:
The private-preview readiness record produced by a successful monthly sync using the official `gov.pl` current-offer source, with the resulting source and freshness state visible in the app. Fallback sourcing is a separately tested degraded mode and does not establish normal readiness.
_Avoid_: fallback-only readiness, hidden fallback data
