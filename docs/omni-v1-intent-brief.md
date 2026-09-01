# Intent Brief — Omni

> **Status:** founder-confirmed
> **As of:** 2026-08-31 (strengthened with field evidence, 2026-09-02)
> **Owner:** Founder / Omni

| Field | Current answer |
|---|---|
| **Trigger** | People cannot know, at the instant they need something, who nearby actually has it — without depending on word of mouth, a business's own online presence, or luck. |
| **Problem** | The world's real supply — shops, markets, stalls, informal sellers, mobile providers, professionals, digital providers — is fragmented and largely absent from any queryable, geographic representation. Existing maps and delivery apps only represent a narrow slice of it. |
| **Affected actor(s) and context** | Anyone, anywhere, needing a product or service under real constraints (location, price, quantity, timing). On the supply side: any provider of goods or services, regardless of formality — a shop, a market stall, a roadside seller, a mobile professional, a home-based seller, a fully digital provider. |
| **Current alternatives/workarounds** | Word of mouth; hoping the provider is on Google Maps or has a website; physically going or calling to check; delivery apps that cover only a narrow, curated subset of supply and locations. |
| **Desired outcome** | A person can express a need with real constraints and discover the relevant real-world supply around them, verify current availability without burdening the provider, and complete a traceable transaction when they choose to buy. |
| **Harm or failure to avoid** | Fabricating availability or certainty Omni does not actually have; requiring a provider to adopt inventory/POS infrastructure they don't have to participate; exposing seller contact/location prematurely; discriminating against informal, mobile, or non-technical providers by design or by omission. |
| **Smallest critical journey** | Buyer expresses a need with constraints → discovers geographically relevant supply → requests availability → receives an honest signal → chooses to buy → completes a traceable Omni transaction. |
| **Success signal** | Real users, given a real need, search geographically without being taught to; ask Omni to verify availability instead of calling every seller themselves; providers participate without maintaining a full digital inventory. Field validation already observed this directionally (see Founder confirmation). |
| **Constraints and resources** | Solo/early founder, limited dev resources — this is precisely why availability was designed around a provider-declared allocation rather than full inventory sync. Web app + PWA first; Android and iOS to follow. MapLibre for the map layer. |
| **Non-goals** | Immersive/3D or VR-style street-level exploration; full indoor navigation; complete seller inventory synchronization; autonomous seller or buyer agents; advertising intelligence or behavioral targeting; in-app merchant payment processing; browser extension. These remain future branches, not V1 dependencies. |
| **Assumptions / unknowns** | The mandatory-discount mechanism will be accepted by providers as a fair trade for automation/leads (unconfirmed at scale, strong qualitative signal from one interviewed provider — see below). The freshness window for Omni-allocated stock is not yet numerically fixed — owned as a Root System decision, not a Seed one. |
| **Risk classification** | Ordinary — no regulated activity, no minors-specific handling, no payment processing by Omni itself in V1 (payment is always external, declared by both parties). |
| **Next proof and gate** | Root System — Availability data model (see Species 09, §15) is the next concrete gate. |

## Founder confirmation

I confirm this problem statement as I originally conceived it: the absence of a clear, queryable map of the world's supply — not availability itself, which was a downstream design choice made because I don't have the resources to force every provider into full inventory management. Availability exists to make discovered supply actionable without burdening the provider; the provider is always the best source of truth on their own stock, which is why Omni asks rather than tracks.

Field evidence supports this: in mock demo interviews with 15+ people, users went straight to product search without needing it explained, and asked for more products / said "we're not finding this" — direct signal that geographic product search is the natural entry point. One interviewed seller confirmed that only about 4 of 100 clients come from physical roadside signage, and that they lack the technical capacity to do social media ads or content — direct signal that Omni's promise of discoverability without technical burden addresses a real, named pain, not an assumed one.

Nothing remains open at the Seed level. Species 08 (Search & Demand) and Species 09 (Availability) are the accepted design blueprints this Intent Brief authorizes.
