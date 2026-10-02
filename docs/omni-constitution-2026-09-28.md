# Constitution Omni — pack autonomie (index de synthèse)

> **Statut :** `validé fondateur 2026-09-28` (« go c'est ça ») — index de travail sans
> présence ACTIF. Tranches enchaînées sans aval par pas ; stop sur points réservés §10.
> **Ce document n'est PAS un master.** C'est un index qui pointe les autorités. En cas de
> divergence entre une ligne ci-dessous et l'autorité citée, **l'autorité citée prévaut**.
> Il ne remplace ni le Seed V2, ni le SDM, ni les contrats Root, ni la maquette, ni l'état
> de référence, ni le plan. Il ne supprime ni n'archive rien (H-4 reste séparé).
> **As of :** 2026-09-28 · **Revue :** à la prochaine porte ou déclencheur FMC.

## 0. Mission et cap (source : FMC `FMC-OMNI-2026-09-26`, Master Plan `HQ-OMNI-2026-09-02`)

- **Mission :** un index complet et vivant de l'offre locale, interrogeable par les contraintes
  du chercheur, pour supprimer la recherche, le contact et la comparaison à la main.
- **Outcome :** représentation map-first de l'offre du monde, contrainte par contrainte, convertie
  en transaction tracée QR — vendeurs de toute forme sans inventaire complet.
- **Cible de maturité :** `pilot-ready` sur Lomé (FMC). **Cap décidé 2026-09-28 (DEC-V2-10) :**
  `production-ready` comme CIBLE — le verdict reste une preuve (Root close → Trunk → Heartwood →
  Canopy launch envelope + production-evidence-register → Rings). ASAP = enchaîner sans temps
  mort, jamais sauter de porte.
- **Succès mesuré :** un vendeur réel + un acheteur réel (hors équipe) bouclent le trajet complet,
  transaction QR + événement de stock. Secondaire : dispos répondues dans la fenêtre de fraîcheur.

## 1. Le cœur (source : Intent Brief V2, confirmé « c'est ça » 2026-09-23)

> **Omni = un index COMPLET et VIVANT de l'offre, interrogeable par les contraintes du chercheur.**

- **COMPLET** (« qui a ça ? ») : toute l'offre, toutes entités — commerce, particulier/occasion,
  ambulant, service, transport, digital, immobilier.
- **VIVANT** (« qui l'a maintenant ? ») : état connu à l'instant T, maintenu (confirmation vendeur
  ou auto depuis stock alloué) dans une **fenêtre de fraîcheur unique**.
- **INTERROGEABLE** : près de moi, maintenant, tel prix, telle quantité, tel état — sans appels.
- **« Disponible » = UNE notion** (« peut me satisfaire maintenant »), exprimée par caractéristique
  (nombre / présence / place / position) — une seule logique de fraîcheur.
- **Trajet critique :** cherche par contraintes (ou flâne carte filtrée) → voit l'offre → sait si
  transactable maintenant → intention → **QR émis dans le même geste** → vendeur verrouille (scan
  ou dashboard) → paiement externe **enregistré** → exécution confirmée → avis → **événement stock**.
- **Variante in-store :** client en boutique scanne le QR public de l'entité → remise appliquée.
- **Cas limites (modèle oui, comportement `V1+`) :** ambulant (position mouvante), service (créneau),
  zem/taxi (position live), appartement (durée, multi-entités). Aucune dette de base.
- **Positionnement (décision 2026-08-13) : PAS un marketplace** — couche de découverte +
  disponibilité temps réel, confiance prouvée par QR, jamais d'avis manipulables.

## 2. Les 32 décisions (source : Intent Brief V2 §Décisions + §S-32 + boucle F)

| ID | Règle |
|---|---|
| S-01 | Tout est offre ; les différences sont des caractéristiques |
| S-02 | Modèle universel jour 1, comportements séquencés (confirmé définitivement) |
| S-03 | L'entité mère liste son offre (registre, pas annuaire) |
| S-04 | Toute offre existe via une entité — pas d'offre orpheline |
| S-05 | Amorçage à froid : lieux présents = `unclaimed` niveau 0, sans promesse de stock, bouton Revendiquer (tactique, pas le cœur) |
| S-06 | Échelle d'existence 0 Présente → 1 Revendiquée → 2 Publiée → 3 Vivante → 4 Transactable |
| S-07 | Carte + recherche = deux vues d'un seul corpus ; carte filtrable |
| S-08 | Itinéraire = fonction de soutien ; transport = une offre comme les autres |
| S-09 | Le prix est visible/comparable sans faire le tour des magasins |
| S-10 | Offre non limitée au physique (digital/service/immo/transport) ; origine géo même pour le digital |
| S-11 | Deux niveaux cohabitent : chercher une entité / chercher une offre (test de non-régression Root obligatoire) |
| S-12 | Transport : modèle jour 1, affichage V1 ; requête A→B + assignation = `V1+` |
| S-13 | Entité = tout offreur (commerce, organisation ou personne seule, même objet) |
| S-14 | Confiance = identité + preuve, séparées ; seuil adapté au volume (1 particulier / 3 commerce) |
| S-15 | Coût marginal fondateur = 0 ; exception routage à décider (S-15-exception : OSRM défaut, Mapbox borné plus tard) |
| S-16 | Inscription téléphone-first ; OTP e-mail Neon ; WhatsApp initié par l'utilisateur ; SMS payant exclu |
| S-17 | Paliers 0/1 joignable → publie (Non vérifié) · 2 vérifié opérateur · 3 prouvé par usage |
| S-18 | Revendiquer un lieu réel = preuve de contrôle + arbitrage opérateur AVANT transfert (anti-usurpation) |
| S-19 | Avantage promotionnel > 0 obligatoire pour publier (finance la boucle traçable) |
| S-20 | Toute offre porte au moins un visuel (qualité produit, pas déco) |
| S-21 | Scan in-store = moteur d'acquisition (QR public d'entité → remise) |
| S-22 | QR multi-canaux (écran, partage hors Omni, validation dashboard = même verrou) |
| S-23 | QR lié offre + utilisateur + transaction ; avantage appliqué par l'offre |
| S-24 | Scan du code acheteur strictement côté vendeur |
| S-25 | L'offre appartient à l'ENTITÉ, pas au lieu (le lieu dit *où*, jamais *à qui*) |
| S-26 | Chaque transaction génère une VERSION de l'offre (snapshot gelé : prix, coupon, qté, lieu, date) |
| S-27 | Dashboard vendeur strictement côté vendeur ; acheteur voit « Code validé » puis la suite |
| S-28 | Toujours créer une entité, même pour un particulier à objet unique |
| S-29 | Espace vendeur progressif : sans entité, entrée Créer/Revendiquer uniquement |
| S-30 | La confiance porte sur l'ENTITÉ, jamais sur l'offre (héritage) |
| S-31 | Publier ne requiert PAS la vérification (badge Non vérifié, couches gagnées ensuite) |
| S-32 | Intégrité automatique (visuel/prix/description/doublon) + réputation par offre (avis tracés) — CONFIRMÉ (a) |
| S-1/S-2 | Offres séparées d'abord (jamais de regroupement forcé) ; niveau 0 = « Lieu connu — pas encore géré » |

## 3. Modèle économique boucle F (source : Intent Brief V2 §Modèle)

**Principe :** le cœur est gratuit ; on paie pour être choisi, pour l'échelle, pour la confiance
avancée — jamais pour exister ou être vu. **Aucune commission** (biens payés hors app).

| | Gratuit | Entité Pro $10 ≈ 5 000 F/mois |
|---|---|---|
| Entités | 1 | plusieurs (slots) |
| Offres publiées | plafond 20 (configurable) | illimité |
| Disponibilité | manuelle | auto (fenêtre de fraîcheur) |
| Analytics / campagnes / file prioritaire | — | oui (sponsorisé étiqueté, amplifie sans remplacer) |

| Acheteur | Gratuit | Buyer Pro $5 ≈ 2 500 F/mois |
|---|---|---|
| Recherche + vérifs 1 entité | illimité | illimité |
| Bulk | 3 / mois | 100 / mois |
| Favoris/comparateur | limité (comparateur ≤ 3) | illimité + alertes (comparateur ≤ 10) |

- **Bulk (état actuel) :** 1 produit × N facilités (≥ 2), coût **1 crédit par besoin**
  (R-4 `019d97f`, miroir client `bulk-cost-contract`) ; multi-produits chez un vendeur =
  **demandes manuelles** gratuites (sheet dédiée, jamais « bulk »). **D-C5 CLOS par exécution
  2026-09-29** (facturation R-4 + nommage `887a547`) — rouvrir d'un mot si le libellé déplaît.
- **Bonus confiance : 20 USD — CONFIRMÉ fondateur 2026-09-28 (UM-6, DEC-V2-09).**
  Constante unique `SELLER_BONUS_USD_MINOR`, seuil adapté au volume (S-14).
- **Wallet = recharges XOF (FedaPay), pas de retrait.** Packs bulk = hypothèse réversible.
- Deux familles monétaires documentées : wallet ×100 vs offres brut — **D-LOC-6/8 OUVERTS.**

## 4. Acteurs et parcours (source : FMC + Seed)

- **Acheteur** (n'importe qui, téléphone, mobile-first, Lomé) : cherche → transactable ? → intention
  → QR → réception → avis.
- **Entité offreuse** (commerce, particulier, ambulant, service, transporteur, digital) : crée ou
  revendique (S-18) → publie (avantage + visuel + 4 caractéristiques exigées RH-02 + position
  dérivée) → répond dispo (manuel ou auto Pro) → verrouille (scan/dashboard) → encaisse hors app,
  enregistré → avis.
- **Opérateur/Admin** (équipe Omni + terrain) : vérifie entités, arbitre revendications, assigne
  zones, audite. Rôle terrain distinct de l'admin.

## 5. Non-goals et contraintes (source : Seed + FMC + AGENTS)

- **Non-goals V1 :** processeur de paiement · livraison/matching transport · annuaire statique ·
  AI-first · inventaire complet · temps réel mobilité · import OSM massif · multi-facilités global ·
  réseau social · KYC payant · paiement biens in-app · recommandations IA (ultérieur) · déploiement `main`.
- **Stack :** PWA mobile-first, UI française (vouvoiement), MapLibre uniquement, Neon Postgres +
  Vercel, FedaPay recharges wallet uniquement. Branche : `omni-v2-rebuild` uniquement, jamais `main`.
- **Données :** préserver par défaut ; destructif = décision explicite. OSM/externe distingué
  d'Omni-propre. Fixtures bornées, jamais de claims.

## 6. Données et autorités (source : contrats Root + SDM)

- **Entité > lieu** : `entity_id` sur offres/lieux/entitlements ; `facility_id` nullable ;
  lecture `coalesce(p.entity_id, f.entity_id)`. Confiance = entité (S-30). Pro = par entité (R-4b).
- **Caractéristiques vivantes :** unicité = présence (R-G), négociable = chercher moins cher (R-H).
  Condition/livraison = déclarations (R-I : ordre OUVERT).
- **Échelle S-06 dérivée, jamais stockée** : niveau 4 = niveau 3 + `allocated − reserved > 0`.
- **Transaction :** 10 états, Phase A souple / Phase B dure (verrou `qr_verified`), jamais d'annulation
  après verrou, le temps relance (D-TXN). QR TTL borné, ré-émission/révocation.
- **Peuplement (décision 2026-09-28, DEC-V2-10) :** import-206 retiré comme stratégie ; monde peuplé
  depuis données de lieux par défaut des cartes, **en unclaimed** (S-05 intact) ; gardes : périmètre
  (précédent Ghana), provenance étiquetée, S-18 avant transfert. Résout SCOUT-01 par conception.
  Chemin d'écriture canonique = traitement Root d'autorité.

## 7. État réel (as-of 2026-09-28 — vivant : `docs/founder-hq/current-state.md`)

- **Porte : Root OUVERTE** (Seed V2 clos, Species V2 close `founder-confirmed` 2026-09-25).
- **Livré :** R-B/C/D/E/F/G/H, ALIGN-1/2, DEMO SUPPLY (3 offres niveau 4), UM (famille monétaire),
  itinéraires réels (Mapbox, quota, verrou intention), équipes/zone.
- **Mesure board 2026-09-27 :** 16 offres (3 déclarent une caractéristique), 206 lieux, devise
  propre (16/16 XOF). **Goulot = usage, pas capacité.**
- **Maturité : `prototype`** (maquette `pilot-ready`, app non). Cap `production-ready` décidé
  2026-09-28 — verdict par preuve, pas par déclaration.
- **Portée 2026-09-28 (DEC-V2-11) :** plus de staging « launch Lomé de test » — V1 prod-ready
  avec couverture monde via données cartes par défaut, en unclaimed. Lomé reste premier terrain
  d'usage (vendeurs/acheteurs réels, démo), pas une phase séparée. A-4 intact (première géographie
  d'usage) ; boucle E prévoyait déjà la carte mondiale. Implications amplifiées : géocodage
  (6/206 adresses), fantômes hors zone, D-LOC par marché critique, voix/routage par zone.
- **État vérifié ce jour :** `check:state` CONSISTENT ; HEAD `d08d888` = origin.

## 8. Maquette (source : `docs/maquette/omni-species-v2-interactive.html`)

- **74 écrans**, 5 niveaux, validés `SP-1…SP-10` (« Validé » 2026-09-25).
- SP-1 caractéristiques · SP-2 échelle 0→4 · SP-3 double niveau · SP-4 confiance au choix ·
  SP-5 immo/digital · SP-6 compléments · SP-7/8 monde peuplé + lieu-connaître · SP-9 routage honnête ·
  SP-10 pin déplaçable.
- Référence visuelle (tokens, monochrome + accent confiance `#2E8B6F`) — ne pas improviser un écran.

## 9. Preuves et gardes (comment on prouve ici)

- **Règle :** une preuve qui ne peut pas échouer n'en est pas une — falsifier dans les deux sens.
  Mesurer le rendu, pas le source ; le bundle servi, pas le source ; la base, pas le registre.
- **Commandes :** `npm test` · `npx tsc --noEmit` · `npm run check:state` · `check:docs` ·
  `check:coherence` · `check:maquette` (Playwright) · `check:boundary` · `check:live-surface` ·
  `check:species-t12` · scripts `prove-*` sur branche jetable (0 résidu).
- **T-07d :** prod === build local (hash), entrée de déploiement GitHub vérifiée — un push ne prouve
  pas un déploiement. **Déploiements prod = ordre fondateur explicite.**
- **Argent :** jamais de secret dans le chat ; prix en fonctions pures testables ; deux familles
  d'unités mesurées avant toute « correction ».

## 10. Réservé au fondateur + délégation (source : FMC §Frontière + DEC-V2-10)

**Fondateur-gated (bloquant) :** montants/wallet/paiements · données personnelles · migrations
destructives et patterns disable-trigger · autorité données/sécurité · activation d'une
géographie hors données cartes couvertes (le monde couvert est délégué ; MAJ DEC-V2-11, remplace
« hors pilote Lomé ») · prod (T-07d) · engagements externes · réouverture Seed/Species ·
**décisions ouvertes : H1–H4, essai voix RT-4.**
(R-I clos, D-LOC-6/8 tranchées dont D-LOC-6 par exécution UM-062 appliquée 2026-09-27,
062 vérifiée — retirés de cette liste le 2026-09-29.)
**Délégué :** tranches de routine, bugs avec preuve, migrations additives, docs/tests/gardes,
pushes docs-only. Revue asynchrone par receipts ; stop-and-report sur garde rouge ou incident.
**Délégation réversible à tout moment**, revue 2026-12-26 ou déclencheur.

## 11. Sources (chaque section → son autorité)

| Section | Autorité | Date |
|---|---|---|
| Mission, périmètre, done | `docs/nature-way/omni-founder-mission-contract-2026-09-26.md` | 2026-09-26 |
| Cœur, 32 décisions, économie, cas | `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` | 2026-09-23 |
| Ordre de construction | `docs/nature-way/omni-system-dependency-map-2026-09-23.md` | 2026-09-23 |
| Visuel | `docs/maquette/omni-species-v2-interactive.html` (74 écrans, SP-1…SP-10) | 2026-09-25 |
| État, gate, résidus | `docs/founder-hq/current-state.md` + `docs/founder-hq/founder-hq-board.md` | vivant |
| Plan ordonné | `docs/founder-hq/founder-hq-master-plan.md` (`HQ-OMNI-2026-09-02`) | vivant |
| Décisions | `docs/decisions/omni-decision-log.md` (DEC-V2-01…10) | vivant |
| Preuves | `docs/nature-way/omni-proof-register-v2-2026-09-25.md` + registres datés | vivant |
| Bonus $20, délégation, cap, peuplement | DEC-V2-09/10 + ADR FHQ 2026-09-28 | 2026-09-28 |
