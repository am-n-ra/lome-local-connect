# Notifications — comment ça marche, où la permission est demandée, quels événements existent

> **Porte :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`). **Plan :** `NW-PROD-OMNI-PRICE-01` (suite).
> **Question fondateur (2026-10-14) :** « comment marchent les notifications, où exactement la
> permission est demandée — ne vaut-il pas mieux la demander après une action qui l'utilise, comme
> après une demande de dispo d'un acheteur, ou côté vendeur au stade vérification / création
> d'offre ? Et quelles notifications existent, comment marchent-elles ? »
> **Méthode :** lecture du code réel (aucune supposition). Chaque affirmation ci-dessous est citée.

## 1. La machine (3 couches + 1 canal)

| Couche | Où | Rôle |
|---|---|---|
| **Événement** | `v2_notification_events` | écrit **dans** la transaction métier (recipient, event_type, entity_type/id, `dedupe_key` idempotent, payload, correlation) |
| **Livraisons** | `v2_notification_deliveries` | **une ligne par canal** : `in_app` (toujours) + `web_push` (seulement si abonnement actif) |
| **Inbox** | `NotificationCenterV13` + `notification-center.ts` (pur) | liste les événements ; tap = marquer vue + ouvrir la cible (flux / claim / seller / review) ; cible inconnue → `none`, jamais un lien mort |
| **Push web** | `web-push.ts` | dépile les livraisons `web_push` ; `delivered`/`retry`(recul exp.)/`revoke`(404/410)/`exhausted` ; iOS ⇒ **app installée** requise |

## 2. Où la permission est demandée — **un seul endroit**

- `Notification.requestPermission()` est appelé **uniquement** dans `enablePush()` (`TrunkAppV13.tsx:347-356`),
  déclenché par le bouton **« Activer les notifications »** de la feuille **Compte** (`:3246`).
- **Aucun prompt automatique au chargement.** Le commentaire de `push-subscribe.ts` le dit noir sur
  blanc : « la permission ne se demande JAMAIS avant l'installation » (iOS : push seulement en PWA).
- C'est **correct** et **à conserver** : demander au chargement est l'anti-patron (refus massif).

## 3. Quels événements existent réellement (5 producteurs)

| `event_type` | Destinataire | Déclencheur (fichier:ligne) | Push ? |
|---|---|---|---|
| `transaction_turn` | la **contrepartie** | chaque transition acceptée (`trunk-repository.ts:4656`) | oui, **si** abonnement |
| `claim_submitted` | **reviewers** | demande de revendication soumise (`:2376`) | in_app |
| `claim_reviewed` | le **revendicateur** | décision opérateur (`:2508`) | in_app |
| `seller_account_activated` | le **vendeur** | activation (`:2615`) | in_app |
| `seller_account_suspended` / `_reactivated` | le **vendeur** | suspension/réactivation (`:2652`) | in_app |

Message push par état (`web-push.ts`) : `qr_verified`, `payment_declared`, `payment_confirmed`,
`fulfilled`, `received`, `rated`, `closed` — tous rattachés à `transaction_turn`.

## 4. ⚠️ Deux découvertes qui changent la réponse

**(a) La demande de dispo d'un acheteur ne produit AUCUNE notification.**
`createAvailabilityRequest` (`:8043`) et `createBulkAvailabilityRequest` (`:8176`) n'écrivent
**aucun** événement de notification. L'acheteur **poll** la réponse toutes les 4 s **tant qu'il est
sur l'écran** (`BuyerFlowV13.tsx:134-147`) ; s'il part, la réponse n'a **nulle part** où surgir.
→ Demander la permission « après une demande de dispo » promettrait une notification **qui n'existe
pas**. Le geste du fondateur est juste en intention, mais le **producteur manque d'abord**.

**(b) Le push ne part que si un abonnement existe DÉJÀ — impasse possible.**
La livraison `web_push` de `transaction_turn` est créée **seulement** si le destinataire a un
abonnement actif (`:4666-4673`, jointure `v2_web_push_subscriptions`). Or le **seul** moyen de
s'abonner est le bouton Compte. Un vendeur qui n'ouvre jamais Compte ne s'abonne jamais → la ligne
de livraison n'est **même pas créée** → **aucun push, silencieusement**. L'Inbox garde tout, mais la
promesse affichée (« Recevez l'alerte quand c'est votre tour d'agir ») est **inatteignable** sans
passer par Compte.

## 5. Maquette ↔ app (le centre de notifications)

| Élément maquette (`notif-centre`) | App | Verdict |
|---|---|---|
| « Réponse à votre demande » | **aucun événement** | **ABSENT** |
| « Code validé par le vendeur » | `transaction_turn` (`qr_verified`) | **OK** |
| « Nouvelle offre près de vous » | aucun événement | **ABSENT** |
| « Visite de vérification planifiée » | aucune notification (TF-6 existe sans notifier) | **ABSENT** |
| Réglages : « Réponses & transactions » ON | pas de réglage par catégorie | **ABSENT** |
| Réglages : « Offres autour de moi » ON | idem | **ABSENT** |
| Réglages : « Rappels de vérification » OFF | idem | **ABSENT** |
| « Tout marquer comme lu » | pas de tout-marquer (seulement vu-au-tap) | **ABSENT** |

→ L'app notifie **plus étroit** que la maquette : 5 types d'événements (transaction + revendication +
compte vendeur), là où la maquette implique 4 **catégories** réglables.

## 6. Réponse et recommandation (décision fondateur)

**La question « où demander la permission » est bonne, mais l'ordre est : d'abord le producteur,
ensuite la permission.** Demander une permission pour un événement qui ne se déclenche pas est un
mensonge.

- **Où demander, honnêtement :** au premier moment où un événement **va réellement** être envoyé au
  user — c'est-à-dire quand il **devient partie à une transaction** : l'acheteur qui crée une
  **intention d'achat**, le vendeur qui **scanne un QR**. Ce sont les producteurs de
  `transaction_turn` ; c'est exactement ce que la copie actuelle promet déjà.
- **Ne PAS déplacer la permission vers « demande de dispo » tant que (a) n'est pas corrigé** : il n'y
  a aucun événement là aujourd'hui.
- **Producteur le plus utile à ajouter (le geste du fondateur, correctement placé) :** l'acheteur
  notifié quand un vendeur **répond** à sa demande de dispo (« Réponse à votre demande » de la
  maquette). C'est le seul endroit où l'acheteur attend **hors écran**.
- **Réglages par catégorie + « tout marquer comme lu »** = écart maquette, plus tard.

**Plus petite tranche proposée (attend l'ordre) :** `BRANCHES-NOTIF-1` — (1) producteur
`availability_response_created` → notification acheteur ; (2) demander la permission au moment de
l'intention d'achat (acheteur) / du premier scan (vendeur), **en plus** de Compte, jamais à la place ;
(3) ne créer la livraison `web_push` que si l'abonnement existe **déjà** (inchangé) mais **dire** au
vendeur, au moment utile, qu'il peut l'activer. Aucune fondation neuve.
