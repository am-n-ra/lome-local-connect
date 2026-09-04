# T-08 — Preuve intégrée (boucle transaction complète)

**Date :** 2026-09-03
**Statut :** ✅ **PASS (16/16)** — correlation `65488663-91f4-4347-ba46-4fd9d600991d`
**Script :** `scripts/prove-v2-integrated.mjs`

## Objectif (plan NW-PROD-OMNI-01, T-08)

Prouver la boucle transaction complète de bout en bout avec **un vrai vendeur** (`demo@seller.omni`), **un acheteur non-équipe** (`demo@buyer.omni`), et le rôle opérateur couvert par les routes admin (T-07a) :
**offre → demande de disponibilité → réponse vendeur → intention d'achat → QR (émission/vérification) → paiement externe (déclaration/confirmation) → fulfilment → réception → notation.**

## Résultat (production-connected-demo, `omni.sparkafrika.online`)

| # | Étape | Résultat |
|---|-------|----------|
| 1 | Identités signées (buyer + seller) | PASS |
| 2 | Offre réelle provisionnée (allouée, publiée) | PASS |
| 3 | Demande de disponibilité (crédit acheteur accepté) | PASS — HTTP 201 |
| 4 | Inbox vendeur voit la demande | PASS |
| 5 | Réponse vendeur (disponible) persistée | PASS — HTTP 201 |
| 6 | Acheteur lit la réponse | PASS |
| 7 | Intention d'achat créée | PASS — HTTP 201 |
| 8 | Token QR acheteur émis | PASS — HTTP 201 |
| 9 | Vendeur vérifie le QR (`qr_verified`) | PASS — HTTP 200 |
| 10 | Paiement déclaré (`payment_declared`) | PASS — HTTP 200 |
| 11 | Vendeur confirme le paiement (`payment_confirmed`) | PASS — HTTP 200 |
| 12 | Fulfilment pending | PASS — HTTP 200 |
| 13 | Fulfilled | PASS — HTTP 200 |
| 14 | Acheteur marque reçu (`received`) | PASS — HTTP 200 |
| 15 | Notation acheteur soumise (`rated`) | PASS — HTTP 200 |
| 16 | DB : événements transaction (v2 only) | PASS — 10 événements, état final `closed` |

## Décisions et découvertes

### Fixture « offre réelle » (T-08 exige « un vrai vendeur »)
Le catalogue du vendeur démo a `quantity_allocated_omni = 0` sur tous les produits → aucune réponse de disponibilité possible (`409 POLICY_REJECTED`). La preuve provisionne **une offre réelle, étiquetée, auto-approuvée** (`T-08 Offer <id>`, allocation 5, publiée) via une insertion `v2_products` (RD-1 : v2 uniquement, aucune écriture `public.*`). C'est la branche « offre » de la preuve. Nettoyable par nom (`T-08 Offer %`).

### Machine à états transaction (vérif code, `trunk-repository.ts`)
- Vendeur : `qr_ready → qr_verified`, `payment_declared → payment_confirmed`, `payment_confirmed → fulfilment_pending`, `fulfilment_pending → fulfilled`
- Acheteur : `qr_verified → payment_declared`, `fulfilled → received`, `received → rated`
- Rating : éligible uniquement en `received`/`rated` ; clôture la transaction (`closed`) et incrémente `qualifying_sales`.

### Race de visibilité serverless (documentée)
La notation appelée immédiatement après la transition `received` échoue parfois en `409 POLICY_REJECTED` (« Rating available only after receipt ») alors que l'événement `received` est bien en base — latence de visibilité entre invocations serverless. Mitigation dans la preuve : poll de l'état `received` + retry du rating (6 × 700 ms). **À traiter en Trunk si récurrent côté UI** (lecture de l'état transaction après écriture via la même connexion ou ré-essai client).

### Architecture de déploiement serverless (vérifiée — by design, PAS une divergence)
Les bundles `api/v2/*.js` sont **plafonnés à 12 volontairement** (limite serverless Vercel, voir `scripts/build-vercel-functions.mjs`). Les routes récentes (`transaction-ratings`, `availability-responses`, `buyer-qr-issuances`, `saved-searches`, `transaction-messages`, `wallet`) n'ont **pas** de fichier dédié : elles sont servies par le **catch-all `vercel.json`** (`availability.js` = fallback) + le handler Node complet (chaque bundle embarque le repository entier). C'est pourquoi elles répondent 401 en prod sans bundle tracké. **Constat T-08 : le routage est cohérent — aucune régénération requise.** (Note : `POST /api/v2/wallet` retourne 404 en prod ; à vérifier si la surface wallet doit être exposée — hors scope T-08.)

## Preuve de non-régression

- `npm test` : **285/285 (44 fichiers)** après ajout du script.
- Aucune écriture `public.*` (RD-1) ; tous les objets en `v2_*`.
- Clés d'idempotence uniques par run (`avail/resp/intent` + UUID sans tirets) ; token QR frais (10 min) ; pas de rejeu.

## Suite (T-08 → fermeture Gate 4)

1. ~~Régénérer les bundles~~ → **résolu : routage by design** (catch-all), aucune action.
2. Valider le volet **opérateur équipe** de T-08 (console admin déjà prouvée en T-07a) si une action opérateur dans la boucle est requise par le fondateur.
3. Puis clôturer **Gate 4 (Trunk)** et passer à la preuve/branch suivante du plan.
