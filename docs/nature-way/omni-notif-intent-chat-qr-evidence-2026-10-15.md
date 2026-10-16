# Production Evidence Register — `NOTIF-INTENT-CHAT-QR` (`NR-4…NR-8`)

> **Porte :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`) · **Plan :** `NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01`
> **Audit source :** `omni-notif-logo-intent-chat-qr-audit-2026-10-15.md` (5 constats mesurés)
> **Commits :** `caf18e5` (code) + `68de053` (mémoire) · **Date :** 2026-10-15

## Ce qui a été livré

| Tâche | Défaut mesuré (audit) | Correctif | Classe de preuve |
|---|---|---|---|
| `NR-7` | `(source : auto)` **en dur** sur une réponse **humaine** (`BuyerFlowV13`) | le fait est **lu** au serveur (`responder_account_id` nullable = acteur automatique, Root §6.3) et nommé par `availability-source.ts` (pur) | garde unitaire falsifié |
| `NR-4` | `createPurchaseIntent` n'écrivait **aucune** notification → le vendeur ignorait l'intention | événement vendeur + livraisons (in_app, web_push conditionnel) + drain, sur `fresh_intent` seulement | garde statique + garde générique de drain |
| `NR-5` | la Room était inatteignable depuis le flux | l'intention **ouvre la Room** (`onRoom`) ; le vendeur y accède par sa notification | garde de contrat source |
| `NR-6` | le scanner QR **jetait** la transaction validée | « Ouvrir la transaction validée » → Room de la transaction scannée | garde de contrat source |
| `NR-8` | tap → Inbox **générique** ; centre in-app **sans logo** | le push transporte l'entité (`?txn=`/`?request=`) ; le client ouvre la Room ou le suivi ; logo Omni in-app ; message propre par `kind` | garde de rendu + garde message |

## Garde réparé au passage (méthode)

`check:dock-search` **échouait déjà sur HEAD propre** : la règle `search-01-price` cherchait
l'ancien appel direct `currencyFor(facility.priceCurrency)`, déplacé par BRANCHES-PRICE-DISPLAY
vers `priceDisplay()` (qui lit bien la devise de l'offre). Pire : son `--selftest` **passait à
tort** — une règle rouge faisait tirer **toute** mutation, masquant deux mutations périmées.
Corrigé : règle réalignée, 2 mutations réparées, `avail-01-poll-hardened` renforcée (le fichier
porte **deux** listes de réponses ; une seule était protégée). **Selftest 31/31.**

> **Leçon :** un garde rouge **et** un selftest qui ne peut pas échouer se couvrent l'un l'autre.
> Une règle périmée ne se contente pas d'échouer — elle **désarme** la falsification des autres.

## Falsifications exécutées

| Garde | Mutation | Résultat |
|---|---|---|
| `NotificationCenterV13.test.tsx` (logo) | retirer `<img class="omni-mark">` | **1 échec** ; restauré → 4/4 |
| `availability-source.test.ts` | neutraliser `responderKind` | échec ; restauré → pass |
| `intent-notification.test.ts` | retirer le producteur | échec ; restauré → pass |
| `push-message.test.ts` | retirer le `kind` | échec ; restauré → pass |
| `check:dock-search --selftest` | 31 mutations | **31/31** (contre « 31/31 » faussement vert avant) |

## État vérifié

- **1260/1260** tests (154 fichiers) · `tsc --noEmit` **0** · **7 gardes verts**
  (`boundary`, `live-surface`, `state`, `docs`, `coherence`, `dead-css`, `dock-search`).
- Bundles serverless régénérés **dans le même commit** (leçon `9c3f5d8`).
- Chaînes vérifiées dans le **bundle servi** (leçon `on2`) : `omni-logo-compact`, `omni-mark`,
  « Ouvrir la transaction validée » présents ; le client **lit** `?notifs`/`?txn`/`?request` ;
  le serveur **construit** `?notifs=1&txn=<id>`.

## Preuve prod (T-07d ✅)

- Déploiement GitHub `deployments` : **`68de053` Production** (2026-10-15T20:55:18Z).
- Prod sert **`assets/index-D6gULk6k.js`** === build local, **byte-identique**
  (sha256 `73622682…` des deux côtés).
- Chaînes présentes dans le bundle **servi** : `omni-logo-compact`, `omni-mark`,
  « Ouvrir la transaction validée », `get(\`txn\`)`, `get(\`request\`)`.
- Routes prod gardées : `GET /api/v2/transactions` → **401**, `POST /api/v2/purchase-intents` → **401**.
- Producteur + drain présents dans l'artefact serverless **commité**
  (`api/v2/purchase-intents.js` : `transaction_intent_created` ×3, drain ×15).

## NR-9 — réponse automatique au nom de l'entité (LIVRÉE 2026-10-15)

- **Décision fondateur « ok go ».** Species §95/§113 : l'automate répond **au nom de l'entité**
  quand l'offre est vivante, sans qu'un humain ait à la confirmer. Root §6.3/§7 nomme l'acteur
  (« seller **or approved automation** »).
- **Le mensonge `NR-7` est fermé à la racine.** `v2_availability_responses.actor_kind`
  (`'seller' | 'automation'`, défaut `'seller'`) dit **qui** a répondu. La lecture acheteur
  (`responderKind`) lit ce **fait** ; le repli sur `responder_account_id is null` ne couvre que
  les lignes antérieures à la migration — un compte vendeur supprimé (`on delete set null`) reste
  `'seller'`, il ne devient **jamais** une machine.
- **`decideAutoResponse` (module pur) encode les abstentions :** pas de Pro (D-04/R-4b), offre
  non publiée ou non fraîche (D-03, fenêtre 4 h), stock insuffisant (jamais de partiel, §113),
  `auto_availability` éteint (§95 : un réglage explicite, jamais une déduction silencieuse), et
  **la négociation ouverte** : dès qu'un acheteur a proposé un prix, l'automate **s'abstient** —
  négocier est un acte vendeur.
- **Deux couches, prouvées séparément.** La règle vit dans le module **et** est rejouée dans le
  SQL (`proposed_price_minor is null`), pour qu'un appel direct ne puisse pas la contourner.
  **Falsifié** : neutraliser le module seul → T2 tient (le SQL rattrape) ; neutraliser le SQL seul
  → T2 tient (le module rattrape) ; neutraliser **les deux** → **T2 échoue** (`price_minor: 20000`,
  le prix brut au lieu du remisé). Une preuve qui ne peut pas échouer ne prouve rien.
- **Preuve Postgres réelle** (`scripts/prove-nr9-auto-response.mjs`, branche jetable, code livré) :
  **18/18 PASS** — l'automate répond (acteur `automation`, **aucun compte**, la quantité demandée,
  le **prix affiché remisé**), l'acheteur **lit** `responderKind=automation`, il est **notifié**,
  le rejeu **ne double pas** la réponse, la négociation **abstient** (avec contrôle : la même offre
  sans proposition est bien servie), stock périmé/expiré/insuffisant/Pro absent/auto éteint
  abstiennent, le schéma **refuse** une automation avec compte (C9) ou sans quantité (C4), l'audit
  trace `automation`.
- **Migration `072_v2_automation_actor.sql`** — additive, idempotente, **appliquée à la canonique**
  `br-dawn-hill-am5amy22` (checksum `0e0c4ad1…`, 13 réponses intactes, 0 automation). Deux CHECK
  (acteur + quantité auto) et l'index partiel (une seule réponse auto par demande) vérifiés
  **par l'objet**, pas par le registre.

## Bug pré-existant trouvé par la preuve NR-9 : R-H refusait TOUTE proposition

- La requête de **nature d'offre** lue avant le refus R-H (`trunk-repository.ts`) ne sélectionnait
  **pas** `price_minor`. `listedPriceMinor` lisait donc `undefined → 0`, et **toute** proposition de
  prix était refusée (« votre proposition dépasse le prix affiché ») — y compris une proposition
  **plus basse** que le prix réel. **R-H n'a jamais fonctionné pour une proposition > 0.**
- **Invisible aux 1277 tests** : ils utilisent un `sql` **stubbé** qui ne compile jamais la requête
  (classe `NW-13j` / `RH-02`). Seule la preuve Postgres réelle le voit.
- Corrigé (la requête porte `p.price_minor`) et **verrouillé** par une garde statique falsifiée
  (`auto-response-producer.test.ts` : la requête de nature doit citer `p.price_minor`).

## Résidus honnêtes

- **Preuve navigateur non exécutée** : recevoir une notification sur un **appareil réel** (FCM)
  et voir la Room s'ouvrir depuis le tap demande une session réelle et un appareil — reste
  **manuelle** (prochain spot-check).
- **Réglage `auto_availability`** : l'interrupteur vendeur **existe déjà** (`SellerV13`, TRUNK-X2 :
  « Auto ON/OFF · Activer/Désactiver · Actualiser », réservé aux facilités Pro actives) — le
  contrôle de l'automate est donc **de bout en bout**, pas un résidu. Vérifié en le cherchant
  après avoir écrit le contraire : *ne pas déclarer manquant ce qu'on n'a pas cherché.*
- **Web Push est ARMÉ — correction d'une affirmation périmée.** VAPID **est** configuré en Production
  (`VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT`, `WP-1`), vérifié **par le comportement** : `GET
  /api/v2/notifications/push-key` → `configured:true` avec une vraie clé publique. La base canonique
  porte **4 livraisons `web_push` en état `delivered`** (dernière 2026-10-15T16:13:38Z). J'avais écrit
  « non configuré → `configured:false` » : **faux**, et contredit par une ligne `WP-1` **antérieure et
  juste** du même document d'état. *Leçon : une ligne neuve peut écraser une vérité déjà consignée —
  relire la ligne voisine avant d'écrire un résidu.*
- **`in_app` reste `queued` — par conception, pas un défaut.** Le drain ne dépile que `web_push`
  (`listPendingPushDeliveries` filtre `channel='web_push'`) ; le centre in-app lit
  `v2_notification_events` (+ `seen_at` au tap), jamais la livraison. 5 livraisons `in_app` restent
  `queued` avec `attempt_count=0` : c'est l'état normal d'un canal sans file d'envoi.
