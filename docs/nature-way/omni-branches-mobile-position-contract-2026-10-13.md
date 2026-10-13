# BRANCHES-MOBILE-POSITION — cadre + tranche (2026-10-13)

Gate : `HEARTWOOD_CLOSED_BRANCHES_OPEN`. On **durcit** une branche existante, on n'ouvre pas de
fondation. Une seule fonctionnalité.

## La question du fondateur

« Est-ce qu'on a un mécanisme de position pour les ambulants ? » — puis « pas encore » a été précisé
en « **le mécanisme de déplacement n'existe pas** ».

## Ce qui existe réellement (mesuré, pas supposé)

- **La forme `mobile` existe** : `v2_facilities.facility_type in ('fixe','mobile','digital')` +
  `rayon_km` (CHECK mobile ≤ 500), écrits **une fois à la création** (`createSellerFacility`).
- **La carte traite déjà l'ambulant** : `map-pins.ts` `isMobileFacility()` (puce à anneau pointillé),
  `map-filters.ts` chip « Ambulants », `facility-form.ts` libellé « Mobile · se déplace · rayon N km ».
- **Ce qui manque** : un ambulant **se déplace dans la journée**, mais sa position reste **le point
  fixe déclaré à la création**. Aucun moyen de dire « je suis ici maintenant ».

## Décision de cadre (S-02 / S-06, sans nouvelle fondation)

1. **Pas de suivi continu** (`watchPosition`) — c'est `V1+`, explicitement hors tranche.
2. La position d'un ambulant = **un point + un rayon déclarés**, rafraîchis par un **geste manuel**.
3. **Un seul geste, trois formes** (S-02) : « Je suis ici » ne change le **sens** que pour `mobile`
   (« où je suis »). Pour `fixe` il **corrige** le point ; pour `digital` il **ne s'applique pas**
   (une origine immatérielle ne se déplace pas). Le geste est le même.
4. **La déclaration n'est pas la vérification** (S-31). Un point que le vendeur bouge lui-même est
   *déclaré*, jamais *vérifié*. On le stocke, on l'horodate, on l'affiche — sans le confondre avec
   une preuve terrain.

## La tranche

- **`POST /api/v2/seller/facilities/:id/position`** — owner-bound, lat/lng bornés à la zone pilote.
- Migration `071` : `position_declared_at`, `position_verified_at` (nullable, additive, idempotente).
- UI `SellerV13` : bouton **« Je suis ici »** sur la facilité active (mobile/fixe), géolocalisation
  navigateur, succès = « Position mise à jour · à HH:MM » ; un `fixe` voit « Position corrigée ».
- Fiche publique : affiche **« Position déclarée · à HH:MM »** pour un mobile — le contrat S-31 est
  visible, pas caché.

## Preuve

- `scripts/prove-branches-mobile-position.mjs` sur branche jetable : mobile déplace → lat/lng changent,
  `position_declared_at` posé, `position_verified_at` **reste nul** (déclaré ≠ vérifié) ; hors zone
  refusé ; non-propriétaire refusé ; `digital` refusé.
- Falsification : sans le changement de lat/lng, le test échoue.
