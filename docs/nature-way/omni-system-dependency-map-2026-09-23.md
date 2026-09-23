# System Dependency Map — Omni (Seed V2 reconciliation)

> **Map ID:** `SDM-OMNI-2026-09-23`
> **As of:** 2026-09-23 (UTC)
> **Maturity target:** `pilot-ready V1 loop` (Lomé field pilot)
> **Map owner:** Nature Way (product authority)
> **Trigger:** fondateur — « on a raté tout le process depuis Species » + « des éléments visuels et comportements de l'app actuelle qu'on risque de perdre »

## 0. Phase diagnosis (pourquoi cette carte existe)

| Fait observé | Preuve | Conséquence |
|---|---|---|
| Le fondateur déclare le process faussé **depuis Species** | message fondateur 2026-09-23 | Seed **et** Species doivent être réconciliés avant tout code |
| Une maquette V2 existe et est complète (72 écrans) | `docs/maquette/omni-species-v2-interactive.html` | candidat Species, **non encore accepté comme seule vérité** |
| L'app réelle est plus avancée que V1 sur le **côté acheteur + transaction** | `src/trunk/*` (22 modules de comportement), migrations 001→057, prod `omni.sparkafrika.online` | **ne pas** traiter l'app comme remplaçable par la maquette |
| L'app porte des comportements **absents de la maquette** | `prefers-reduced-motion`, `100svh`, `safe-area`, `aria-modal` (3 fichiers), `stagger` (2), `keyboard` (5), `waves` (1) — 0 occurrence dans la maquette | **risque de régression confirmé** (§3) |
| La maquette porte des concepts **absents de l'app** | offre par entité, avantage obligatoire, intégrité/réputation par offre, opérateur terrain, Room acheteur | **écart de Root** à trancher (§2) |

**Verdict de phase :** ni « continuer la maquette », ni « repartir de zéro ». **Reconcilier (Seed → Species) puis Root**, en **préservant** l'app comme source de comportements éprouvés.

---

## 1. Graphe causal — chaîne parent→enfant

| Edge ID | Parent (doit exister) | Enfant | Acteur | Source de vérité | Frontière d'autorisation | Fraîcheur | Statut | Preuve | Déclencheur de re-plan |
|---|---|---|---|---|---|---|---|---|---|
| E-01 | Entité canonique (`v2_facilities` + **`entity` à créer**) | Offre appartient à une entité (S-25) | Vendeur | DB v2 | propriétaire | — | **`missing`** | `S-25` confirmé ; app lie l'offre à `facility` | décision Root « entité » |
| E-02 | Entité | Badge de confiance sur l'**entité**, pas l'offre (S-30) | Admin/Opérateur | `v2_facilities.trust_state` | admin décide, opérateur constate | — | **`partial`** | trust sur facility ; pas d'entité séparée | idem E-01 |
| E-03 | Offre + visuel obligatoire | Publication d'offre (S-20) | Vendeur | `v2_products` | propriétaire | — | **`partial`** | pas de contrainte « visuel obligatoire » en base | décision Root |
| E-04 | Offre + **avantage Omni > 0** | Publication (S-19) | Vendeur | `v2_products` (discount) | propriétaire | — | **`partial`** | `coupon_code` existe ; pas de contrainte >0 imposée | décision Root |
| E-05 | Intégrité automatique + réputation d'offre | Affichage fiche offre (S-32) | Système | à créer | — | recalcul continu | **`missing`** | aucune table réputation d'offre | décision Root |
| E-06 | Espace vendeur progressif (entité d'abord, S-29) | Accès outils vendeur | Vendeur | UI `SellerV13` | compte connecté | — | **`real`** | `471ef98`, `SellerV13.test.tsx` | — |
| E-07 | QR émis **à l'intention** | Scan vendeur → verrou | Vendeur | `v2_qr_tokens` | intention vivante | TTL 10 min | **`verified`** | `e4948a5`, preuve E2E cycle | — |
| E-08 | Room transactionnelle acheteur (suivi+chat+reçu) | Symétrie vendeur/acheteur | Acheteur | `v2_transaction_*` | membres | — | **`partial`** | chat serveur existe ; maquette seule pour la Room | tranche dédiée |
| E-09 | Rôle **opérateur terrain** distinct de l'admin | Vérification terrain | Opérateur | DB rôles | admin nomme | — | **`partial`** | `role-management` grant operator existe ; pas de flux terrain | décision Root |
| E-10 | Réservation stock (alloué − réservé) | Disponibilité réelle | Système | `v2_products.quantity_reserved_omni` | serveur | — | **`verified`** | migration 055, preuve FF-8 | — |
| E-11 | Cycle V1 navigateur (4 largeurs) | Evidence de cohérence | — | prod | — | — | **`verified`** | PRE-1 80/80 | — |
| E-12 | Comportements d'app (reduced-motion, safe-area, focus, 100svh) | Qualité de l'app | — | `src/trunk/*` | — | — | **`verified`** | grep 2026-09-23 | perte si maquette remplace l'app |

**Lecture :** les **racines manquantes** sont **E-01 (entité)**, **E-05 (réputation d'offre)** ; les **partiels** sont **E-02/E-03/E-04 (confiance, visuel, avantage)**, **E-08 (Room)**, **E-09 (opérateur)**. Le reste est **déjà prouvé en prod**.

---

## 2. Inventaire acteurs & parents

| Couche | Capacité requise | Pourquoi parent | Enfants débloqués | Statut | Plus petite preuve |
|---|---|---|---|---|---|
| Gouvernance | Admin décide · **Opérateur constate** (E-09) | sans opérateur, la vérification terrain n'existe pas | vérité du badge | `partial` | 1 visite terrain tracée |
| Supply | **Entité** (E-01) puis fiche/édition | l'offre doit appartenir à une entité, pas à un lieu | offre, badge, réputation | `missing` | 1 entité + 1 offre rattachée |
| Données canoniques | Visuel obligatoire (E-03) + avantage >0 (E-04) | une offre sans visuel/avantage n'est pas publiable | publication honnête | `partial` | contrainte DB + refus |
| Demande | Découverte + contraintes réelles | — | résultats → intention | `verified` | NW-12, P0-C |
| Transaction | QR à l'intention (E-07) + Room (E-08) | verrou + symétrie | clôture + avis | `partial` | Room acheteur |
| Confiance/offre | Intégrité + réputation par offre (E-05) | la réputation vit sur l'offre **et** l'entité (S-32) | décision d'achat | `missing` | 1 offre avec réputation calculée |
| Support/mesure | Stock réservé (E-10) + preuves | — | fiabilité | `verified` | FF-8 |

---

## 3. Sauvetage de la surface existante (**le point fondateur n°2**)

> **Principe :** l'app réelle n'est **pas** une maquette à remplacer. C'est la **banque de comportements éprouvés**. La maquette est la **banque de décisions produit**. On fusionne, on ne remplace pas.

| Surface existante | Contenu réel | Statut | Ce qu'on risque de perdre |
|---|---|---|---|
| `prefers-reduced-motion` | 1 fichier | `real` | respect de l'accessibilité (absent maquette) |
| `100svh` + `safe-area` | 2 + 1 fichiers | `real` | plein écran mobile iOS/Android, encoches |
| `aria-modal` + capture de focus | 3 fichiers, 9 `focus` | `real` | accessibilité clavier/lecteur d'écran |
| Cinématique recherche `stagger`/`waves` + `map-reveal.ts` | 2 modules | `verified` | chorégraphie monde→rue, pop-in par vagues |
| `fallback-map.ts` (8 tests) | carte de repli réelle | `verified` | l'app ne meurt pas si MapLibre échoue |
| `useFreshnessTimer.ts` | fraîcheur 4h/24h | `verified` | « vivant » de la disponibilité |
| `transaction-{steps,time,timeline}.ts` | minuteurs + étapes | `verified` | « le temps relance, n'annule jamais » |
| `facility-cart.ts` | panier par entité | `verified` | panier persistant |
| `layout-contract.ts` + `v13-compare.ts` | coquille + comparateur | `verified` | coquille desktop/rail |
| Glyphes MapLibre `transformRequest` | `131d23a` | `verified` | clusters en chiffres formés |

**Décision :** la maquette V2 doit être **amendée pour hériter** de ces comportements (ou déclarer l'héritage par écrit). **Aucune source de comportement ne doit être perdue.**

---

## 4. Sélection de tranche

> **Chaîne véridique choisie d'abord :** `E-01 entité → E-02 badge sur entité → E-03 visuel obligatoire → E-04 avantage >0 → publication honnête`
> **Pourquoi celle-ci d'abord :** elle débloque **le plus de vérités en aval** (offre, badge, réputation, intention, QR) et lève l'incertitude la plus risquée — **le modèle de données**. Aujourd'hui l'offre est rattachée à un **lieu** alors que le fondateur a confirmé qu'elle appartient à une **entité** (S-25) : c'est la racine la plus fausse.
> **Non actif encore :** Room acheteur (E-08), opérateur terrain (E-09), réputation d'offre (E-05) — **dépendants** de E-01.
> **Porte à franchir ensuite :** preuve Root — migration additif + contrat d'API + refus serveur d'une offre sans visuel/avantage.

---

## 5. Règle de readiness

Un enfant ne passe en implémentation que lorsque ses parents sont `verified`, ou explicitement `bounded` avec propriétaire, déclencheur de revue, comportement d'échec sûr et plan de preuve.

**Conséquence immédiate :** tant que **E-01 (entité)** est `missing`, **E-05 (réputation d'offre)**, **E-08 (Room)** et **E-09 (opérateur terrain)** restent `planned`. On ne code pas un écran dont la racine n'existe pas — c'est exactement l'*orphaned leaf* que le fondateur reproche.
