# T-10a — Inventaire Branches/UI (Gate 5) : app réelle vs maquette unifiée acceptée

**Date :** 2026-09-03 · **Ordre fondateur : « go »** (ouverture Gate 5)
**Autorité visuelle :** `docs/maquette/omni-species-maquette.html` (G-02b/c/d acceptés) + vocabulaire `docs/design.md`
**App réelle :** `src/main.tsx` → `src/trunk/TrunkApp.tsx` (seule app servie en prod)

## 1. État réel de l'app (constaté)

| Surface | État | Détail |
|---|---|---|
| Entrée | ✅ `TrunkApp` | `main.tsx` ne rend QUE `TrunkApp` |
| `src/components/omni/` (CartePage, panels…) | ⚠️ mort partiel | Non importé par `main.tsx` ; référencé seulement par `src/routes/*` et `omni-clean/*` (hors app servie). Son « Recherches enregistrées » est un placeholder → `setWishOpen(true)` (wishlist), **pas** l'API B19 |
| `src/components/ui/Liquid*` | ✅ design-system | `LiquidGlass`, `LiquidSearchDock`, `LiquidResultCarousel`, `LiquidFacilitySheet` **rendus** ; `LiquidTransactionRoom` + `LiquidSellerCockpit` **importés mais JAMAIS rendus** dans `TrunkApp` |
| Salle transaction (acheteur) | ⚠️ **sheet monolithique inline** | Le flux TXN complet (QR + chat + paiement + réception + note) est tassé dans l'étape 4 de la sheet « availability » (un `<section>` inline géant dans `TrunkApp`). Fonctionne (prouvé T-08), mais **ne suit pas le layout de la maquette** : pas de timeline verticale, pas de dock verrouillé ✕/▦/≡, `LiquidTransactionRoom` inutilisé |

## 2. Écarts vs maquette acceptée

| # | Élément maquette (autorité) | App actuelle | Écart |
|---|---|---|---|
| B13/B14 | **Salle transaction** : timeline verticale intent→rating, chat scopé, QR passerelle, **dock verrouillé ✕ Annuler / ▦ QR / ≡ Menu** (pas de ‹ dans le flux) | Sheet « availability » étape 4 en colonne unique ; back libre ; `TransactionStepper` horizontal ; QR via `TransactionQrCard` | **Fonction OK, layout ≠ maquette** → restructurer en vraie « room » avec timeline + dock verrouillé |
| B19 | **Recherches enregistrées** : surface dédiée, liste, relance | Backend prouvé (GET/POST/DELETE `/api/v2/saved-searches`, T-07c) ; UI = placeholder wishlist dans du code mort | **Pas de surface UI** → créer la surface sur l'API existante |
| — | Fiches facilité/offre avec visuels, corps « claim » non-revendiquée | `LiquidFacilitySheet` rendu | À auditer finement (visuels, claim body) |
| — | Sheets vendeur/admin (A1–A8) | Console admin + audit (T-07a), cockpit vendeur | `LiquidSellerCockpit` **non rendu** → brancher ou retirer |

## 3. Découvertes techniques pour Gate 5

1. **Dead code** : `components/omni/` hors app servie — décision à prendre (nettoyer ou ignorer). Ne pas y toucher tant que ce n'est pas le chemin prod.
2. **Composants orphelins** : `LiquidTransactionRoom`, `LiquidSellerCockpit` prêts mais non branchés — base de travail pour B13.
3. **Dette connue (à traiter dans Gate 5)** :
   - Race de visibilité serverless **rating après `received`** (T-08, retry documenté) → le handler `onSubmitRating` doit ré-essayer proprement côté UI.
   - `POST /api/v2/wallet` **404 en prod** (catch-all) → à vérifier si la surface wallet est exposée.
4. **`TransactionStepper` horizontal actuel ≠ timeline verticale maquette** (`txntrack`).

## 4. Plan d'exécution Gate 5 (ordre verrouillé Admin → Seller → Buyer)

| Sous-tâche | Contenu | Slice |
|---|---|---|
| **T-10b** | Restructurer la salle transaction en « room » conforme maquette : timeline verticale intent→rating, chat scopé, QR passerelle, dock verrouillé ✕/▦/≡, retry rating. Brancher `LiquidTransactionRoom` ou reconstruire selon maquette. | Buyer (cœur) |
| **T-10c** | Surface **Recherches enregistrées** (B19) sur l'API existante : liste, relance, suppression. | Buyer |
| **T-10d** | Fiche facilité/offre : visuels + corps claim (non-revendiquée) vs maquette. | Buyer |
| **T-10e** | Cockpit vendeur : brancher `LiquidSellerCockpit` ou aligner la sheet actuelle. | Seller |
| **T-10f** | Sheets admin A1–A8 vs maquette (console/audit existants T-07a). | Admin |
| **T-10g** | Preuve navigateur 4 largeurs (map toujours visible R-03, scrollbars masquées, icônes SVG), tests + build + push. | Transverse |

**Approche :** petites slices incrémentales (une surface à la fois, prouvée avant la suivante), même méthode que le tronc. Commencer par **T-10b (salle transaction)** = le cœur de la maquette et le plus gros écart.

## 5. Risque / garde-fou

- **Ne pas casser le flux TXN prouvé (T-08)** : la restructuration est un changement de layout, pas de logique — les handlers existants (`onIssueBuyerQr`, `onDeclarePayment`, `onMarkReceived`, `onSubmitRating`) sont réutilisés tels quels.
- Tests : les handlers sont testés ; la restructuration visuelle ne doit pas changer les signatures.
