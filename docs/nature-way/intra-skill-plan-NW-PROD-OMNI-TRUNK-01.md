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
