# Contrat Heartwood S4 — Ambulants (offres `mobile`) découvrables · `NW-PROD-OMNI-HEARTWOOD-01`

> **Porte :** Heartwood OPEN (`TRUNK_CLOSED_HEARTWOOD_OPEN`) · **Autorité :** `/nature-way`.
> **As of :** 2026-10-07 · **Reclassé S4 → 3ᵉ slice** (S2 argent réel = session fondateur ; S3 téléphone = décision fournisseur).
> **Loi :** contrat avant code. **Objet :** exposer ce qui existe — **aucune nouvelle fondation**.

## 1. Problème mesuré (pas supposé)

Le type `mobile` (ambulant) existe **de bout en bout côté vendeur** :
`createSellerFacility` l'écrit (`trunk-repository.ts:1358`), `SellerCatalogueFacility.facilityType`
l'expose, et la maquette acceptée le **dessine** — `.vdot.mobile` (accent `--warn` + `pulse`,
`omni-species-v2-interactive.html:34`), reprise byte-exact dans `ui-v13.css:51`, et
`fallback-map.ts:172` sait poser la classe `mobile`.

Mais **la découverte ne voit jamais la forme du lieu** :
- `listPublicFacilities` **ne sélectionne pas** `f.facility_type` → `PublicFacility` n'a **aucun**
  champ de forme (vérifié : absent de `types.ts:32-56`).
- `TrunkMap.toFallbackFacilities` (`:41`) pose `kind: facility.trust === 'confirmed' ? 'standard' : 'claimed'`
  — **jamais `'mobile'`** → un ambulant s'affiche comme un lieu fixe.
- Aucun marqueur de carte, aucune puce, aucun badge de fiche ne dit « ce vendeur se déplace ».

**Conséquence produit (le fond, pas cosmétique) :** un acheteur ne peut pas voir qu'un vendeur
**se déplace** — or c'est le cas d'usage « ambulant » que le fondateur a nommé. Le marqueur
`.vdot.mobile` est une **surface qui existe déjà** et n'est **jamais alimentée** (même classe que
le QR S1 : la capacité est là, le câblage manque).

## 2. Décisions de contrat

- **S4-C1 — Filtre carte « Transport (mobile) » = `facilityType === 'mobile'`.** La chip existe déjà,
  désactivée (`MAP_FILTERS`, `soonReason`). On l'**active** et on la branche sur la **forme du lieu**.
  Pas de nouvelle chip, pas de nouveau rail : on **fait marcher** celui de la maquette.
- **S4-C2 — Sémantique honnête du libellé.** « Transport » est ambigu (il a une résonance livraison /
  véhicules — S-08/S-12, **hors Heartwood**). On garde le libellé de la maquette mais on le rend
  **explicite** : libellé **« Transport (mobile) »**, filtre = **lieu mobile**. Aucune offre de
  transport-logistique n'est modélisée (non-goal), donc le filtre ne peut pas mentir en laissant
  croire qu'il trie des services de livraison.
- **S4-C3 — Un ambulant se marque sur la carte.** `pinFeatureCollection` porte `facilityType` ; les
  lieux `mobile` reçoivent la **puce ambre** (`--warn` `#8a6d1f` — cœur **et** anneau, jamais
  l'accent, réservé à la confiance) ; les puces fixes gardent l'anneau plein (propriété → sombre/clair).
  Le repli DOM (`fallback-map`) porte déjà `kind: 'mobile'` → `.vdot.mobile` (ambre **+ pulse**).
  **Honnêteté d'implémentation :** les puces MapLibre sont des `circle` — elles n'ont ni pointillés
  ni `pulse` (un vrai pointillé exigerait une image d'icône, = nouvelle surface). La distinction
  réelle est donc la **couleur** (ambre vs encre) sur le chemin vecteur, et **ambre + pulse** sur le
  repli. La maquette (`.vdot`) est un marqueur DOM : son `pulse` est atteint par le repli.
- **S4-C4 — La fiche facilité dit la forme.** Ligne **« Forme : Fixe / Mobile (se déplace) / Immatérielle »**
  (le Seed S-01 nomme « Déplétion · Forme · Position… »). Vocabulaire repris de la maquette
  (`Fixé · sur place` / `Mobile · se déplace` / `Immatérielle — origine`). Sur une fiche mobile,
  la ligne de position lit **« Mobile — se déplace · rayon N km »** quand `rayonKm` est renseigné,
  sinon **« Mobile — se déplace »** (le rayon n'est pas inventé).
- **S4-C5 — Monochrome d'abord ; ambre = « attention/distinction », pas un état de confiance.**
  Une puce mobile n'affirme **rien** sur la disponibilité ni la confiance ; elle dit seulement
  « ce lieu se déplace ». Ambre, pas accent.
- **S4-C6 — `digital` (immatériel) reste hors filtre.** Un lieu digital n'a pas de point de carte
  (`facility_type='digital'`, lat/lng NULL) → il n'entre pas dans un filtre de carte. Le filtre
  `Transport (mobile)` ne matche **que** `mobile`. On n'ajoute **pas** de chip « Digital » (ce serait
  une surface neuve ; le digital se découvre déjà par la recherche `S-11` entité/offre).
- **S4-C7 — Données : rien à réparer, mais rien à démontrer non plus (mesuré).** Sur la canonique
  (`br-dawn-hill-am5amy22`, 2026-10-07) : **13744 facilités, 0 `mobile`, 0 `fixe`, 0 `digital`,
  13744 `NULL`**. Y compris les lieux réels (`Omni Demo Seller Hub`, `Boulangerie du Marché`,
  `Épicerie Chez Afi`) : `facility_type = NULL`. **La donnée n'a jamais déclaré de forme** (les lieux
  viennent du seed/import avant `044`, pas du chemin `createSellerFacility` qui, lui, écrit bien le
  type). Conséquence : le filtre `Transport (mobile)` **ne matche rien aujourd'hui**, et la ligne
  « Forme » **se tait partout** — c'est **honnête** (forme non déclarée), mais **non démontrable
  avec la donnée réelle**. On n'invente pas une forme. Un **ambulant de démo** (créé par le vrai
  chemin vendeur) est un pas **données** séparé, réversible — **non créé ici** (acte de supply).

## 3. Preuve exigée

- **Garde falsifié** (`facility-type.test.ts`) : `toFacility` projette `facility_type` ;
  `facilityMatchesFilter` matche `mobile` (et pas `digital`/`fixe`/`null`) ; `pinFeatureCollection`
  porte `facilityType`. Falsifier : retirer la projection → échec.
- **Preuve SQL réelle** (branche canonique, lecture seule) : `facility_type` existe et est sélectionnable ;
  compter `mobile` = 0 aujourd'hui (honnête : personne n'en a créé).
- **Garde de non-régression filtre** : `Transport (mobile)` n'est plus `soon`.

## 4. Non-goals

- Pas de transport-logistique V2 (S-08/S-12). Pas de chip « Digital ». Pas de nouvelle fondation.
- Pas d'édition de la forme après création (slice séparée si besoin).
- Terrain (`TT-1`/`TT-2`/Gate 7) reste **en dernier**.
