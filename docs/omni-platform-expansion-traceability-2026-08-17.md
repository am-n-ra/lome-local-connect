# Omni Platform Expansion — Initial Traceability Matrix

**Source of truth:** `docs/OMNI_MASTER_PRODUCT_INTERFACE.md` §0.5 and §0.7  
**Audit date:** 17 August 2026

| Requirement | Current evidence | Status | Planned phase |
|---|---|---|---|
| Search-first map entry | `src/routes/carte.tsx`, `SearchDock`, `MapCanvas` | Active V1 | D |
| Query preserved across auth | pending-search state exists in buyer flow | Partial; verify onboarding handoff | B |
| Buyer educational onboarding with demos | No dedicated onboarding route detected | Missing | B |
| Seller facility onboarding/claim | `vendeur.tsx` has create/claim states | Partial | B/E |
| Locale-aware language with manual override | No complete locale onboarding detected | Missing | B |
| PWA manifest/install/update | No manifest or service worker detected in source audit | Missing | C |
| Safe-area/dynamic viewport | Recent `100dvh` and safe-area rules exist | Active, needs PWA integration test | C |
| Search states and explained results | Buyer search/results exist | Partial; instrumentation and explanation matrix pending | D |
| Facility states | Data/UI states exist in parts of buyer/seller flows | Partial; audit trail/unlockers pending | E |
| Three-completed-sales Pro test credit | No confirmed active unlocker found in audit | Missing | H/I |
| Seller dashboard | `src/routes/vendeur.tsx` and panels exist | Active V1, needs task unification | F |
| Transaction chat | `ChatPanel` and `chat.functions.ts` exist | Partial; transaction scoping/system events pending | G |
| FedaPay/balance | FedaPay/deposit flow and seller balance exist | Active, needs explicit balance buckets | E/I |
| Coupons | Coupon UI/backend pieces exist | Partial; personalized offer engine and atomic consumption pending | H |
| Ads V1 | Ads panel exists | Partial; disclosure, attribution and draft-AI boundary pending | H |
| Free/Pro capability contract | Seller plan UI exists | Partial; actual entitlement matrix and $20 credit pending | I |
| Product offer state | Product pricing/availability exists | Partial; every product needs active offer or explicit no-discount state | H |
| Product/data events | No complete versioned event contract found in initial file audit | Missing | J |
| Consent, retention, export/delete | Not verified in initial audit | Missing | J |
| PWA/offline data safety | Not implemented | Missing | C/J |

## Initial acceptance boundaries

The first implementation pass must not claim native mobile, AI automation, automatic OSM ingestion, integrated payment processing or universal discounts. It must build the web-first contracts that make those future capabilities replaceable without rewriting the buyer/seller transaction model.

The data layer must measure commercial and discovery outcomes while avoiding precise-location collection and private-chat leakage in generic analytics. A personalized coupon is valid only when backed by an explicit rule, budget or promotion; otherwise the product displays an honest no-active-discount state.
