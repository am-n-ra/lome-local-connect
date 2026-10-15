# Production Evidence Register — `NOTIF-INTENT-CHAT-QR` (`NR-4…NR-8`)

> **Porte :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`) · **Plan :** `NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01`
> **Audit source :** `omni-notif-logo-intent-chat-qr-audit-2026-10-15.md` (5 constats mesurés)
> **Commit :** `caf18e5` · **Date :** 2026-10-15

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

## Résidus honnêtes

- **`NR-9` — réponse automatique au nom de l'entité (Species §95).** Le modèle l'a spécifiée
  comme un **acteur** (Root §6.3/§7 : « seller **or approved automation** »), mais
  `v2_availability_responses` n'a **aucune colonne `actor_kind`** : le schéma **ne peut pas
  distinguer** auto et humain — c'est précisément ce qui a produit le mensonge `NR-7`. Construire
  cette capacité est une **fondation neuve** (migration + producteur + contrat), interdite sur
  Branches sans décision fondateur. **Non construite.**
- **Preuve navigateur non exécutée** : recevoir une notification sur un **appareil réel** (FCM)
  et voir la Room s'ouvrir depuis le tap demande une session réelle et un appareil — reste
  **manuelle** (prochain spot-check).
- La décision fondateur « auto sur offre `price_kind='negociable'` » reste ouverte (Species n'a
  jamais traité la négociation ; `price_kind` vient de `R-H`).
