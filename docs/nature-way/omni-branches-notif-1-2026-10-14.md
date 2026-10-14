# BRANCHES-NOTIF-1 — la boucle de disponibilité notifie enfin les deux parties

> **Porte :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`). **Rattachement :** S-16 (auth/notification),
> S-21 (QR/suivi), D-05 (frontière auth) ; audit préalable `omni-notifications-audit-2026-10-14.md`.
> **Décision fondateur (2026-10-14) :** « comment marchent les notifications, où exactement la
> permission est demandée — ne vaut-il pas mieux la demander après une action qui l'utilise ? »
> **Méthode :** lire le code réel, puis prouver contre un Postgres réel (jamais un mock).

## 1. Le défaut mesuré (avant cette tranche)

L'audit a établi **deux découvertes** :

1. **La demande de disponibilité d'un acheteur ne produisait AUCUNE notification.**
   `createAvailabilityRequest` et `createBulkAvailabilityRequest` n'écrivaient aucun événement.
   L'acheteur **pollait** toutes les 4 s **tant qu'il était sur l'écran** ; s'il partait, la réponse
   du vendeur n'avait **nulle part** où surgir. Symétriquement, le vendeur n'était **jamais prévenu**
   qu'une demande l'attendait.
2. **Le push ne partait que si un abonnement existait DÉJÀ.** Le seul moyen de s'abonner était le
   bouton « Activer les notifications » de la feuille Compte — un vendeur qui n'ouvre jamais Compte
   ne recevait **jamais** de push, silencieusement.

**Conséquence pour la question du fondateur :** demander la permission « après une demande de dispo »
promettait une notification **qui n'existait pas**. **L'ordre est : d'abord le producteur, ensuite la
permission.** Demander une permission pour un événement qui ne se déclenche pas est un mensonge.

## 2. Ce qui est livré

### 2a. Producteur acheteur — `availability_response_created` (`respondAvailability`)

Quand un vendeur **répond** à une demande, l'acheteur est notifié **dans la même instruction** que
l'insertion de la réponse. On ne notifie **que sur une réponse réellement insérée** : le rejeu
idempotent (`inserted` vide) **ne re-notifie pas** — la clé `dedupe_key = <responseId>:response_created`
et l'`on conflict (recipient_account_id, dedupe_key) do nothing` verrouillent cela.

- **Destinataire :** `v2_availability_requests.buyer_account_id` (joint sur `inserted`).
- **Cible (deep-link) :** `entity_type='availability_request'`, `entity_id=<requestId>` → l'UI rouvre
  le **suivi de la demande** (`resumeAvailabilityRequest`), jamais un écran générique.
- **Livraisons :** `in_app` **toujours** ; `web_push` **seulement** si l'acheteur a un abonnement
  `permission_state='granted' and revoked_at is null`.

### 2b. Producteur vendeur — `availability_request_created` (les DEUX chemins de création)

Quand un acheteur **crée** une demande, **le propriétaire de la facilité visée** est notifié.

- **Chemin simple :** joint la facilité de `request_insert`.
- **Chemin groupé (bulk) :** déplie `facility_scope` (`join lateral unnest(...) on true`) → **chaque
  lieu visé** notifie **son** propriétaire. (Dédoublonnage **par destinataire** : un vendeur qui
  possède plusieurs lieux visés reçoit **un** avis, pas N.)
- **Cible :** `entity_type='availability_request'` → l'UI ouvre l'**espace vendeur** (`seller-queue`),
  où vit la file « Demandes en attente ». **Aucune** entrée de flux `startFlow`/`[0]` — le vendeur
  n'est jamais mis à la place de l'acheteur.

### 2c. `notification-center.ts` — libellés + cibles

| `event_type` | Libellé | Cible |
|---|---|---|
| `availability_request_created` | « Nouvelle demande de disponibilité » | `{ kind: 'seller-queue' }` |
| `availability_response_created` | « Réponse à votre demande » | `{ kind: 'availability-response', requestId }` |

Cible inconnue → `none`, **jamais** un lien mort (règle existante conservée).

### 2d. `push-prompt.ts` — la permission au moment d'engagement (NOTIF-1b)

Fichier **pur** (`shouldAutoPromptPush`) : le prompt automatique ne se déclenche **que** sur un moment
d'engagement (`buyer-request`, `buyer-intent`, `seller-offer`, `seller-qr`), **une seule fois par
appareil** (mémoire locale `omni-push-prompted`), et **seulement si la plateforme peut livrer**
(`supported`). Sur `needs-install` (iOS non installé), `not-configured`, `permission-denied`,
`unsupported` → **jamais** : une alerte qui ne peut pas arriver ne se promet pas.

Moments câblés : acheteur (demande de dispo envoyée, intention créée — `BuyerFlowV13.onEngagement`) ·
vendeur (offre créée en brouillon — `SellerV13` ; offre publiée — `ProductCatalogueV13` ; QR scanné et
accepté — `SellerQrScannerSheet`). Le bouton Compte **reste** — le prompt automatique ne le remplace
pas, il s'y ajoute.

## 3. Preuves

### 3a. Postgres réel — `scripts/prove-branches-notif-1.mjs` (branche jetable, code livré)

**7/7 PASS** sur branche jetable créée depuis la canonique puis **supprimée** :

| # | Vérifie |
|---|---|
| T1 | une demande notifie le **VENDEUR** (`availability_request_created`), in_app |
| T1b | l'événement vendeur pointe la **demande** (cible `seller-queue`) |
| T1c | livraison `in_app` présente |
| T1d | **aucun** `web_push` sans abonnement |
| T2 | **rejeu** de la demande → **pas** de double notification vendeur |
| T3 | une réponse notifie l'**ACHETEUR** (`availability_response_created`), in_app |
| T3b | l'événement acheteur pointe la **demande** (le tap rouvre le suivi) |
| T3c | livraison `in_app` présente |
| T4 | **rejeu** de la réponse → **pas** de double notification acheteur |
| T5 | abonnement `granted` → livraison **`web_push`** ajoutée (2ᵉ canal) |
| T6 | un **besoin groupé** notifie **chaque** vendeur visé (chemin `unnest`) — 2 vendeurs, 2 avis |

**Résidu vérifié :** la canonique `br-dawn-hill-am5amy22` porte **0** événement de ces deux types
(sondage avant/après) — la preuve n'a rien laissé fuiter.

### 3b. Contrats unitaires (falsifiables)

- `push-prompt.test.ts` (**5**) : prompt sur chaque moment d'engagement · jamais deux fois · jamais si
  abonnement actif · **jamais** sur une plateforme qui ne peut pas livrer · classification exhaustive.
- `notification-center.test.ts` (+**2**) : les deux nouveaux libellés + les deux nouvelles cibles.
- `notification-producers.test.ts` (**4**, garde de source) : les **deux** producteurs existent,
  dédoublonnent par `dedupe_key`, et le push est gardé par `permission_state='granted'`. Retirer un
  producteur → le test échoue.

### 3c. Gardes + suite

`tsc` 0 · **1186/1186** tests · `check:boundary` / `check:state` / `check:docs` / `check:coherence` /
`check:live-surface` verts · build OK · **12 bundles serverless régénérés** (le producteur est présent
dans `api/v2/availability.js` — vérifié, `4` occurrences des deux types).

## 4. Limite honnête

- La **livraison web_push réelle** (dépilement → endpoint du navigateur) n'est pas rejouée ici : elle
  est déjà couverte par `proof:web-push`. Ici on prouve que la **ligne de livraison** est créée au bon
  moment et pour le bon destinataire.
- **Réglages par catégorie** et « tout marquer comme lu » (écart maquette) restent **hors** de cette
  tranche — une fonctionnalité à la fois.
- Preuve navigateur avec **session réelle** (le prompt apparaît, le deep-link rouvre le suivi) au
  prochain spot-check fondateur.
