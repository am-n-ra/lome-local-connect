# Plan local — Trunk V2 (NW-PROD-OMNI-TRUNK-01)

> **Porte :** Trunk OPEN 2026-10-02. **Cadrage VALIDÉ par le fondateur** (ordre « continu »).
> TT-0 CLOS, TT-3 CLOS. TT-1/TT-2 : owner fondateur (usage/données réelles).
> **Définition de fini de la porte :** les parcours principaux exécutables de bout en bout
> par un vrai utilisateur sur prod, états honnêtes, argent juste, surfaces conformes —
> clôture par verdict fondateur uniquement, jamais par livraison.

## Périmètre

**IN :** finition preuve des parcours existants (usage réel observé, données réelles,
conformité mesurée), argent juste avant yeux réels.
**OUT (parqué, pas supprimé) :** transport comme offre · voix FR sur appareil au-delà de la
lecture livrée (essai requis) · import monde eager (annulé DEC-V2-29) · job async ·
recommandations · toute feature sans rattachement S-xx.

## Slices

| Slice | Contenu | Owner | Statut au 2026-10-02 | Preuve exigée |
|---|---|---|---|---|
| TT-0 argent juste | UM-6 (20 USD, DEC-V2-09 + reconfirmation), UM-062 appliquée 2026-09-27 vérifiée, D-LOC-6 close par exécution (DEC-V2-33), D-LOC-8 montrer l'origine (DEC-V2-34), D-C5 nommage aligné 1/besoin | Relais (fait) | **CLOSE** | Registre, rapports MCP, suite verte |
| TT-1 usage réel | Vendeurs Lomé observés : claim → offre → dispo → intention → QR → clôture ; tap-claim terrain ; viewport pan/zoom ; voix FR ; NaN appareil | **Fondateur** (sessions + appareil) | **Ouvert, non exécutable relais** | Protocole écrit d'avance, constats datés, pas de simulation |
| TT-2 données réelles | Caractéristiques + visuels sur offres canoniques par actes vendeurs réels (aujourd'hui 0/16 déclarées, catalogue pilote mince) | Vendeurs réels via fondateur | **Ouvert** | Mesure canonique avant/après, jamais de migration de sens |
| TT-3 conformité tile-place | Sheet vs `lieu-connaitre` : Position, « rien à interroger », « pas ce lieu », note S-18 | Relais (fait `8e6dfb5`) | **CLOSE** | `tile-place-conformance` (4 tests, falsifié) |

## Règles de la porte

- H1 debout : rejouer l'intention avant chaque tranche ; sans rattachement S-xx, pas de code.
- Falsification obligatoire sur chaque règle neuve ; SQL réel contre Postgres (harnais
  `prove-root-read-paths`, branches jetables pour les écritures).
- Bundles serverless régénérés avec le source ; hash prod === build (T-07d) avant tout constat.
- Ne rouvrir Root que sur fait nouveau (régression prouvée ou décision fondateur).

## Re-plan

Fait contredit, garde rouge, refus de validation du cadrage, ou stop fondateur.

## Annexe — delta maquette (74 écrans) → app (mesuré 2026-10-03, pas inféré)

Couvert (~60) : search, results (+empty), offer, avail/pending/reply/intent/qr/txn-track/pay/txn-proof/rate (stages du flow), menu, demandes (file acheteur), favorites, saved, wallet, account, auth, bulk, compare, seller-entry/entity, lieu-connaitre (= tile-place, conformité gardée), seller-claim (= claim), seller-dash/validate/publish/offers/pro/reply/requests/response/orders/stock/automation/entity-fiche, company, entite-publique (+empty), produit-multi (panier vendeur), admin-console/review/roles/audit (+teams/zones), home, room (= salle transaction), recul — voir statuts ; remise/fraicheur (affichages embarqués), state-slow/error (légendes honnêtes, pas des sheets).

Sans équivalent app (maquette-only, à arbitrer HQ avant tout code — H1 : pas de tranche sans rattachement S-xx) :
| Écran | Objet probable | Statut |
|---|---|---|
| op-queue / op-visit / op-report / op-side | Opérations terrain (visites, rapports) | ABSENT (4 écrans) |
| signal | Signaler un contenu | ABSENT présumé |
| recu | Reçu de transaction | ABSENT présumé |
| recovery | Récupération de compte | ABSENT présumé |
| scan-entity / entity-from-qr | QR → fiche entité | PARTIEL (scan générique existe) |
| admin-signal | Couche intel admin | PARTIEL (données existent, surface dédiée ?) |
| notifications / notif-centre | Centre de notifications | PARTIEL (API+seen existent, centre ?) |
| facility-apex | Sens incertain | À NOMMER avant d'arbitrer |

Règle : aucun de ces écrans ne se construit sans décision HQ (garder / écarter / reporter).
Les construire à l'aveugle répéterait l'incident du 2026-09-23 (portes empilées).

## Tranches de finition proposées (ordre fondateur « tout ce qui manque »)

Chacune : contrat avant code, preuve falsifiée, gardes verts. Tailles en tranches-relais
(~1 session chacune à ce rythme ; aucun calendrier promis — le rythme dépend de
l'arbitrage et des retours terrain, pas du clavier).
S-xx indiqué = rattachement H1 proposé ; « S-?? » = à trancher avec HQ avant de coder.

| Slice | Contenu | S-xx / décision HQ requise | Taille | Données |
|---|---|---|---|---|
| TF-2 demand-signal (X04) | « Sauver cette recherche ? » sur vide → DemandSignal → côté vendeurs/acquisition | Seed : S-11 ? S-25 ? | M | NOUVELLE table + migration (MCP apply) |
| TF-3 historique closes (B18) + TF-4 reçu (recu) | **LIVRÉS** — S-26 dérivé : `listClosedTransactions` (miroir `= 'closed'` + vendeur), route, client, `TransactionReceiptV13` (ref stable, partage honnête), section Terminées home. Suite + falsifiés. |
| TF-1 notif-centre (X03) | **LIVRÉ** — centre événements + deep-links (flow/facility/seller/admin, `none` honnête), `getClaimRequest` membre-scopée + route, `NotificationCenterV13` testé, entrées menu, marquage vu-avant-navigation. Suite + falsifié. | S-26 | S+S | Lecture |
| TF-5 signalement (signal + admin-signal) | Signaler un contenu + file intel admin : LIRE les 2 écrans maquette d'abord, spec à écrire | S-32 ? | M | À cadrer (modération = autorité ?) |
| TF-6 ops terrain (op-*) | Queue/visite/rapport/side : modèle visites + surfaces | S-?? + usage TT-1 (le terrain dira si utile) | L | NOUVELLES tables ; REPORTER après TT-1 sauf besoin observé |
| TF-7 scan-entité | **LIVRÉ (partiel honnête)** — vérifié : scan → fiche → « Voir la page de l'entité » existe (remise affichée = les offres portent déjà la remise) ; manquait la **saisie manuelle** (maquette scan-entity, secours caméra) → ajoutée (même chemin validé `handleQrDetected`, erreurs honnêtes). Pas de reroutage scan→entité (casserait l'entrée claim). | S-27 (dashboard/scan strictement vendeur : scan public ouvre la fiche, pas le dash) | S | Glue (parse testé) |
| TF-8 recovery (X05) | Récupération de compte | Auth : que permet Neon Auth ? | S | Vérifier le provider d'abord |
| facility-apex | RÉSOLU SANS CODE : l'aperçu-pin = la fiche (un tap de moins, même contenu) | — | — | — |

**Ordre recommandé :** TF-3 + TF-4 (petits, danych certaines, closent B18/recu) → TF-1 (X03, lecture) → TF-7 (vérifier puis compléter) → TF-2 (migration, avec MCP) → TF-8 (après réalité auth) → TF-5/TF-6 (spec d'abord, TF-6 après TT-1 sauf besoin observé).
**« Fini » redéfini :** maquette 74 − parqués HQ + app équivalents prouvés + verdict. Pas de date : le chemin critique est arbitrage (toi) + terrain (toi), pas le code.
