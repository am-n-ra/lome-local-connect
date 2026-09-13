# NW-13f — Analytics vendeur Pro (performance, conversion, provenance scans) — 2026-09-13

**Tranche:** #6 de l'ordre validé fondateur (§8c de `omni-nw-13b-plans-free-pro-spec-2026-09-10.md`) — « Analytique vendeur Pro: conversion, provenance scans ».
**Branche:** `omni-v2-rebuild`. **Phase Nature Way:** Branche (mini-racine → mini-tronc → mini-preuve).

## 1. Object

Donner au vendeur (propriétaire de facilité) une vue de **performance factuelle** de sa facilité, sans exposer les données d'autres vendeurs :
- **Entonnoir de conversion**: demandes reçues → réponses dispo → transactions démarrées → QR vérifiés → clôturées.
- **Volume / revenu**: somme des `net_amount_minor` des transactions `closed`.
- **Provenance scans**: nombre de QR vérifiés + latence moyenne de vérification (création token → `verified_at`).

Source de vérité : dérivations **read-only** sur les tables existantes (`v2_availability_requests/responses`, `v2_transaction_snapshots`, `v2_transaction_events`, `v2_qr_tokens`) — **aucune migration requise**.

## 2. Contrat

### `SellerFacilityAnalytics` (serveur + client)
```ts
{ facilityId: string; facilityName: string;
  requests: number; responsesAvailable: number;
  transactionsStarted: number; qrScansVerified: number; transactionsClosed: number;
  grossRevenueMinor: number; billingCurrency: string;
  scanToVerifyAvgMs: number | null }
```

### Route
`GET /api/v2/seller/facilities/:id/analytics`
- 401 sans session (`AUTH_REQUIRED`).
- 409 `POLICY_REJECTED` si facilité inexistante / non possédée (`SellerAuthorizationPolicyError`).
- 200 avec le dérivé pour le propriétaire; facilité propre sans activité → zéros + `scanToVerifyAvgMs: null`.

## 3. Preuves

| Classe | Élément | Résultat |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | clean |
| Tests unitaires | `src/server/trunk-repository.test.ts` (+3: agrégation, zéros, non-possédée), `src/server/http.test.ts` (+1 409), `src/trunk/api.test.ts` (+1 endpoint client) | **56 files / 429 tests pass** |
| Frontière client | `npm run check:boundary` | clean |
| Build | `npm run build` | `dist/assets/index-bYBBhTs2.js` |
| Bundles serverless | `node scripts/build-vercel-functions.mjs` | 12 fonctions régénérées; `getFacilityAnalytics` + `/analytics` présents dans `availability.js` |
| Smoke navigateur | preview local sur `dist`, bundle `index-bYBBhTs2.js` servi | app boot sans crash (canvas + dock Recherche/QR/Menu/Buyer); chaînes « Performance »/« Demandes reçues »/« QR vérifiés » présentes dans le bundle servi |

### Requêtes SQL couvertes
- Sonde de propriété: `join v2_accounts a on a.id = f.account_id and a.auth_user_id = …` (garde identique à `getFacilityRenewalStatus`).
- `requests` = count des `v2_availability_requests` dont `facility_scope` contient la facilité.
- `responsesAvailable` = count des `v2_availability_responses` avec `facility_id = …`.
- `transactionsStarted` = count `v2_transaction_snapshots` avec `facility_id = …`.
- `qrScansVerified` = count `v2_qr_tokens.verified_at is not null` sur les transactions de la facilité.
- `transactionsClosed` = count `v2_transaction_events.state='closed'` sur ces transactions.
- `grossRevenueMinor` = `sum(net_amount_minor)` des transactions `closed`.
- `scanToVerifyAvgMs` = `avg(extract(epoch from (verified_at - created_at)) * 1000)`, null si aucun scan.

## 4. Résidus honnêtes

- **Preuve navigateur UI** de la cardbox « Performance » non capturée avec session vendeur réelle (sandbox sans DB/Auth). Chaînes UI vérifiées dans le bundle local.
- **Preuve prod** (401/409/200 end-to-end) à confirmer au spot-check fondateur avec une vraie facilité.
- **Portée**: analytics **par-facilité**; pas de vue marché globale, pas de ventes par produit, pas d'export, pas de recommandations (tranches ultérieures).
- Gate 6 `closed` maintenu; Gate 7 `watch`.