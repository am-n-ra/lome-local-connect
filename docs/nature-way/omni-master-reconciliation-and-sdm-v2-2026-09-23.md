# Reconciliation des masters + System Dependency Map V2 — Omni

> **ID:** `SDM-OMNI-V2-2026-09-23`
> **As of:** 2026-09-23
> **Maturity target:** `pilot-ready` (boucle V1 : Trouver → Vérifier dispo → Décider → Transiger → Événement de stock, sur le pilote Lomé)
> **Map owner:** Nature Way (autorité) / Founder HQ (plan)
> **Source amont :** `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (Seed CLOS, `S-01…S-18`)
> **Branche :** `omni-v2-rebuild` — **aucun code modifié**

## Resource Receipt

| Statut | Ressource |
|---|---|
| Chargé | `.agents/skills/nature-way/references/prerequisite-architecture.md` |
| Template instancié | `.agents/skills/nature-way/templates/system-dependency-map.md` (ce document) |
| Chargé (à réconcilier) | `OMNI_MASTER_PRODUCT_INTERFACE.md`, `OMNI_MASTER.md`, `omni-v1-screen-and-state-specification.md`, `omni-master-visual-prd.md`, `omni-master-build-prompt.md`, `omni-platform-master-roadmap.md`, `omni-master-traceability.md` |
| Non chargé / raison | Les ~50 autres `docs/omni-*` (rapports/brouillons historiques) — **informatifs**, pas normatifs |

---

## 1. Réconciliation des masters concurrents

Le dépôt contient une dizaine de prétendants au titre de « master ». **Règle Nature Way : une seule source de vérité par sujet.** Verdict :

| Document | Rôle retenu | Statut |
|---|---|---|
| **`OMNI_MASTER_PRODUCT_INTERFACE.md`** (5185 l.) | **SEUL master produit/interface normatif** | **canonique** |
| `OMNI_MASTER.md` (11 l.) | stub de redirection | remplacé (l'énonce lui-même) |
| `omni-v1-screen-and-state-specification.md` (2231 l.) | **spécification d'écrans/états V1** — dérivée, non autonome | dérivé |
| `omni-master-visual-prd.md` (66 l.) | direction visuelle (« Atlas Glass ») | **candidat visuel** (à confronter à la maquette V1.3) |
| `omni-master-build-prompt.md` (209 l.) | prompt de reconstruction | outil, pas source |
| `omni-platform-master-roadmap.md` (201 l.) | **roadmap** (livraison), pas produit | dérivé |
| `omni-master-traceability.md` (60 l.) | traçabilité master → code | dérivé |
| ~50 autres `docs/omni-*` | rapports, audits, brouillons | **informatifs** |

### Contradictions à trancher (avec le Seed V2 comme arbitre)

| ID | Contradiction | Arbitrage Seed V2 |
|---|---|---|
| **C-1** | Le master canonique dit *« Facilities » au centre* (`WORLD → FACILITIES`). | **Le Seed prime** : au centre = **l'OFFRE**, toute entité. « Facility » devient **une forme d'entité** (lieu fixe), pas le pivot. → **à intégrer au master canonique** (amendement). |
| **C-2** | Le canonique ne connaît que produit+stock alloué. | **Seed `S-01/S-02`** : modèle **universel** (caractéristiques, pas types). → amendment master. |
| **C-3** | Le canonique/roadmap exigent auth lourde avant bien des actions. | **Seed `S-16/S-17`** : inscription **téléphone-first**, publier tôt (badge), KYC payant exclu. → amendment master. |
| **C-4** | La maquette V1.3 (référence acceptée) **ne couvre pas** le canonique (10 contrats « Build now » absents — audit G-02a revisité). | **Species V2** doit produire une maquette qui **couvre** le canonique amendé. |
| **C-5** | Le canonique déclare « la carte toujours visible / map-first » comme règle a priori. | **Seed `S-07`** : carte et recherche = **deux vues d'un même corpus**, carte **filtrable** ; la carte est la vue de découverte, pas un dogme d'écran unique. → amendment master. |

**Conclusion de réconciliation :** un **seul master** subsiste — `OMNI_MASTER_PRODUCT_INTERFACE.md` — **amendé par le Seed V2** sur C-1…C-5. Tous les autres redeviennent dérivés ou informatifs. *(Les amendements seront intégrés au master dans une tranche dédiée `R-0`, pas en éditant 5000 lignes à l'aveugle.)*

---

## 2. System Dependency Map V2

### Graphe causal (chaîne minimale qui rend la surface acheteur *vraie*)

| Edge ID | Parent | Child | Acteur | Source de vérité | Transition | Frontière d'auth | Fraîcheur | Statut | Preuve | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|---|
| E-01 | Autorité opérateur | Revue / arbitrage | Opérateur | `v2_audit_events`, rôles | action opérateur tracée | admin/operator uniquement | — | `real` | routes admin 401/200 (prod) | changement de rôles |
| E-02 | Autorité opérateur | Onboarding **entité** (individu **ou** org) | Offreur | compte + entité | création/revendication | signé-in | — | `partial` | claim flow existe ; **entité-individu manquante** | `S-18` preuve de contrôle |
| E-03 | Onboarding entité | **Entité canonique** (toute forme) | Offreur | `entity`/facility (à unifier) | création | owner | — | `partial` | facility existe ; **pas d'entité-personne** | amendement C-1 |
| E-04 | Entité canonique | **Offre** (universelle) | Offreur | offre + **caractéristiques** | publication | owner, ≥palier 0/1 | — | `partial` | produit+stock existe ; **caractéristiques absentes** | `S-01/S-02` |
| E-05 | Offre | **Disponibilité vivante** | Offreur / auto | état d'offre | confirmation / dépletion | owner / système | **fenêtre unique** | `partial` | stock alloué + fraîcheur existent ; **pas d'état pour objet unique/service** | `S-14` seuils |
| E-06 | Disponibilité | **Publication/visibilité** (niveaux 0–4) | Système | état d'existence | 0→4 | règle serveur | fraîcheur | `partial` | unclaimed/trust existe ; **échelle 0–4 non nommée** | `S-06` |
| E-07 | Publication | **Découverte** (recherche + carte filtrée) | Acheteur | index d'offres | requête par contraintes | browse libre ; recherche auth | fraîcheur | `partial` | recherche+MapLibre réels ; **recherche entité vs offre non séparée** | `S-11` test non-régression |
| E-08 | Découverte | **Décision / intention** | Acheteur | intention | creation intent | auth | — | `real` | FF-1…FF-8, prod | — |
| E-09 | Intention | **Transaction tracée QR** | Acheteur/Vendeur | machine 10 états | scan QR = verrou | acteur par état | QR TTL | `real` | preuve E2E cycle (T1–T9) | — |
| E-10 | Transaction | **Événement de stock** (fiabilisation) | Système | ledger | clôture | système | — | `real` | migration 055/056, preuve E2E | — |
| E-11 | Transaction | **Support / réconciliation** | Opérateur | audit, litiges | revue | admin | — | `partial` | audit réel ; litige schéma-only | `FF-9` (watch) |

### Inventaire acteurs / parents

| Couche | Capacité parente | Pourquoi parent | Statut | Plus petite preuve |
|---|---|---|---|---|
| Gouvernance/opérations | Autorité opérateur, revue, audit | rien ne se publie/vérifie sans arbitrage | `real` | routes admin prouvées prod |
| Fournisseur/entité | Onboarding **entité** (individu/org), revendication sécurisée | pas d'offre sans entité | `partial` | créer une **entité-personne** + offre unique |
| Données canoniques | Entité unifiée + **offre universelle** + caractéristiques | le modèle universel est la racine anti-dette | `partial` (à construire) | schéma où un ordi d'occasion **et** un commerce tiennent sans casse |
| Demande/découverte | Recherche à **2 niveaux** (entité / offre) + carte filtrée | supprime le contact un-par-un | `partial` | requête « produit » **et** requête « entité » sur le même index |
| Transaction/exécution | Intention → QR → paiement → exécution → avis | valeur traçable | `real` | preuve E2E existante |
| Support/mesure | Audit, analytics, réconciliation | exploitation | `partial` | — |

### Existing-surface rescue (orphaned leaves à dé-orphaner)

| Surface existante | Parent manquant | État honnête aujourd'hui | Claim à retirer | Slice de rebasage |
|---|---|---|---|---|
| Maquette V1.3 + code V13 | E-04 (offre universelle), E-05 (dispo non-stock), E-06 (échelle 0–4), E-07 (2 niveaux) | coquille visuelle cohérente, connectée à **un** modèle (produit/stock) | « Omni sait faire toute l'offre » | Species V2 + Root offre universelle |
| Wallet hardcodé « 0,00 $ », toggle vendeur inerte, admin mutation à vide, caméra (0,0) | (V-8 : 18 dettes) | UI belle, comportements morts/menteurs | « tout est connecté » | tranche V-9 après Root |
| `CartePage.tsx` / `routes/fiche.$id.tsx` (OSRM) | — | **code mort** | — | déjà re-routé via proxy (fait) |

### Sélection de slice

> **Première chaîne vraie à construire :** `E-02/E-03 (entité unifiée, y compris personne)` → `E-04 (offre universelle + caractéristiques)` → `E-05 (disponibilité vivante)` → `E-07 (découverte 2 niveaux)` → **preuve : un particulier publie un ordi d'occasion ET un commerce publie son stock ; un acheteur les trouve par contraintes et voit le « maintenant ».**
>
> **Pourquoi cette chaîne d'abord :** c'est la **racine anti-dette** (C-1/C-2). Tant qu'elle manque, toute la surface (maquette, code) hérite du moule « commerce + stock » et casse sur le reste. C'est le plus fort levier : elle débloque les 4 cas « pleins » *et* les 4 cas « délimités » sans refonte.
>
> **Pas actif encore :** comportements `V1+` (mobile, créneau, durée, transport live), branches P2/P3, nettoyage V-9.
>
> **Gate pour débloquer la suite :** preuve Root que le schéma porte **objet unique** + **commerce à stock** + **service** sans casse, + test de non-régression **S-11** (deux niveaux de recherche).

### Règle de disponibilité

Un enfant ne passe à l'implémentation que si ses arêtes parentes sont `verified`, ou explicitement `bounded` avec owner, échéance, échec sûr et plan de preuve. **Un écran rendu n'est pas une preuve que le système parent existe.**

---

## 3. Prochaine étape

**Species V2** — maquette de référence corrigée, couvrant le master amendé, exposée au fondateur **dans le navigateur** : **(1) vue acheteur (le cœur) → (2) vue offreur → (3) échelle d'existence 0–4.**
