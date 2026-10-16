# Omni — Transaction : comment ça marche aujourd'hui, et les gaps à clore

Date : 2026-10-15 · Branche `omni-v2-rebuild` · HEAD `63e7ace` · Porte `HEARTWOOD_CLOSED_BRANCHES_OPEN`
Méthode : **mesure du code livré** (grep + lecture des requêtes réelles), pas de la documentation.
Aucune ligne de code produit n'est modifiée par ce document.

---

## 1. Comment fonctionne la transaction aujourd'hui (parcours réel)

### Phase A — Découverte → Intention (souple, sortie libre, **aucun argent**)

| # | Étape | Surface | Écriture serveur | Preuve |
|---|---|---|---|---|
| A1 | Recherche (offre ou entité) | sheet `search` | `listPublicFacilities` (globale si `q`, viewport sinon) | `trunk-repository.ts` |
| A2 | Résultats + pins carte | sheet `results` + carte | — | `visibleFacilities` |
| A3 | Fiche lieu (échelle S-06, intégrité S-32) | sheet `facility` | — | `TrunkAppV13` |
| A4 | Sélection produits (**panier par vendeur**) | fiche | sessionStorage | `facility-cart.ts` |
| A5 | **Demande de disponibilité** | fiche → sheet `flow` | `createAvailabilityRequest` → `v2_availability_requests` (**expire 15 min**) | `trunk-repository.ts:8194` |
| A6 | Réponse vendeur (`available`/`partial`/`unavailable`) | `SellerReplyV13` | `respondAvailability` | idem |
| A7 | **Intention d'achat** | sheet `flow` → **Room** | `createPurchaseIntent` → `intent_created` + **réservation stock** | `trunk-repository.ts:6719` |

- **Annulation Phase A** : l'acheteur peut annuler sa demande (`cancelAvailabilityRequest` → statut `cancelled`), **aucun effet monétaire**. Exposé à l'écran (« Annuler la demande »).
- **Le flux s'arrête à l'intention.** `type Stage = 'avail' | 'pending' | 'result' | 'intent'`. Plus aucune étape `txn`/`qr`/`pay`/`rate` dans le flux (BRANCHES-ROOM, `1094312`).
- **La Room est la seule surface post-intention** (S-27), acheteur **et** vendeur.

### Phase B — Transaction (dure, verrouillée au scan QR)

| # | État | Qui agit | Ce qui se passe | Argent |
|---|---|---|---|---|
| B1 | `intent_created` | acheteur | émet son QR (`issueBuyerQrToken`) | aucun |
| B2 | `qr_ready` | **vendeur** | scanne le QR (`verifyQrToken`) → **VERROU** | aucun |
| B3 | `qr_verified` | acheteur | déclare le paiement (`declareExternalPayment`) | **externe** (cash / mobile money) |
| B4 | `payment_declared` | **vendeur** | confirme le paiement reçu (`confirmExternalPayment`) | idem |
| B5 | `payment_confirmed` | vendeur | enregistre l'exécution | — |
| B6 | `fulfilment_pending` | vendeur | marque la remise | — |
| B7 | `fulfilled` | acheteur | confirme la réception | — |
| B8 | `received` | acheteur | laisse un avis (1–5 + note) | — |
| B9 | `rated` → `closed` | système | clôture, `stock_settle` décrémente le stock alloué | — |

- **Pas d'annulation unilatérale après verrou** (D-TXN-1) : conforme au contrat du 2026-09-16.
- **Le paiement n'est pas traité par Omni** : Omni enregistre une **déclaration** acheteur puis une **confirmation** vendeur. C'est honnête (FedaPay n'est utilisé que pour le wallet), mais le bouton dit « Payer (cash) » alors qu'il **déclare**.
- **Notifications existantes** : `availability_request_created` (vendeur), `availability_response_created` (acheteur), `transaction_turn` (contrepartie à chaque transition). NR-8 : la notification ouvre la **Room ciblée**, jamais l'accueil générique.

---

## 2. Gaps mesurés (aucun n'est une supposition)

| ID | Gap | Preuve (fichier:ligne) | Sévérité | Effet utilisateur |
|---|---|---|---|---|
| **GAP-1** | Une transaction **expirée** n'apparaît **ni** dans « En cours » **ni** dans « Terminées » : elle **disparaît** | `trunk-repository.ts:7923` (`<> 'closed'` **+** exclusion `pi.state='expired'`) et `:8019` (`= 'closed'`) | **Haute** | ~~L'acheteur ne retrouve aucune trace~~ **CORRIGÉ (TXN-G1, 2026-10-15)** : elle apparaît dans « Terminées », étiquetée « Expirée », sans reçu. |
| **GAP-2** | Le balayage d'expiration ne couvre **que l'avant-verrou** (`not exists … state='qr_verified'`) | `trunk-repository.ts:8057-8060` | **Haute** | Une transaction **verrouillée** (QR scanné, paiement déclaré) qui stagne reste **ouverte indéfiniment** — ni clôture, ni expiration, ni remboursement. D-TXN-3 (« verrouillée stagnante : 72 h ») **non implémenté**. |
| **GAP-3** | `'expired'` est **écrit** comme état de transaction mais **absent** de `TransactionState` (domaine) et du validateur HTTP | `domain/contracts.ts:45` (10 valeurs) · `http.ts:441` · vs `trunk/types.ts:245` (11 valeurs, dont `expired`) | Moyenne | ~~Divergence domaine/client~~ **CORRIGÉ (TXN-G3, 2026-10-15)** : une seule source (`domain/contracts.ts`) ; client et validateur la réutilisent. |
| **GAP-4** | La Room **perd le QR** à la fermeture : `qrToken` n'est jamais rechargé (`useState(null)`, seul `issueQr` le pose) et `getTransaction` ne renvoie pas de jeton | `TransactionRoom.tsx:52,121` · `trunk-repository.ts:7786` | Moyenne | ~~L'acheteur qui ferme et rouvre doit ré-émettre~~ **CORRIGÉ (TXN-G4, 2026-10-15)** : le token **en clair n'est jamais stocké** (seul `token_hash`), donc l'image ne peut pas être rechargée — c'est **correct**. La Room reçoit l'**état** du QR et dit la vérité (« un QR est déjà émis, ré-émettre le remplace »). |
| **GAP-5** | ~~Le vendeur n'est pas notifié de la création d'une intention d'achat~~ | ~~`createPurchaseIntent` : 0 notification~~ | ~~Moyenne~~ | **FAUX — déjà livré.** Re-mesuré le 2026-10-15 : `transaction_intent_created` existe dans `createPurchaseIntent` (commit `caf18e5`, NR-4/S-27), est câblé dans `notification-center.ts` (libellé + cible Room) et présent dans le bundle servi. **Le registre initial avait été écrit par grep et le grep avait raté le producteur.** |
| **GAP-6** | La fenêtre de **15 min** de la demande de dispo n'est **affichée nulle part** (ni acheteur, ni vendeur) | `trunk-repository.ts` (`15 * 60 * 1000`) ; `expiresAt` **exposé** par l'API mais **rendu nulle part** | Moyenne | ~~L'acheteur voit « En attente » sans savoir qu'il expire en 15 min~~ **CORRIGÉ (TXN-G6, 2026-10-15)** : l'acheteur voit « Réponse attendue · N min pour répondre » (rafraîchi) et le vendeur voit le délai sur chaque demande ouverte. Aucun chiffre en dur : l'échéance vient de `expires_at` réel. |
| **GAP-7** | Aucune **notification à l'expiration** (ni acheteur, ni vendeur) | sweep `trunk-repository.ts` : `notification` = **0 occurrence** (mesuré en base : 2 types seulement) | Moyenne | ~~Une transaction expire en silence~~ **CORRIGÉ (TXN-G7, 2026-10-15)** : le balayage notifie les **deux** parties (`availability_request_expired` acheteur → suivi de demande ; `availability_response_lapsed` vendeur → file), idempotent, push seulement si abonnement actif. Prouvé 11/11 sur Postgres réel + falsifié (5 échecs). |
| **GAP-8** | `'failed'` figure dans `AvailabilityStatus` mais **n'est jamais écrit** pour une demande | `domain/contracts.ts` ; 0 écriture hors FedaPay | Basse | **DÉCISION (TXN-G8, 2026-10-15) : garder.** Le CHECK de la base (`v2_availability_requests`) **autorise** `failed` — le retirer du type créerait une divergence **inverse** (la DB admettrait un statut que le type refuse, risque de bug au read). État mort **inoffensif**, aligné sur la contrainte. Dette de type assumée, pas un mensonge. |
| **GAP-9** | « Signaler un problème » dans la Room = bouton **désactivé** « bientôt » (FF-9, litige hors V1) | `TransactionRoom.tsx:303` | Basse (assumée) | Conforme au contrat (litige = Gate 7). À **nommer** comme dette, pas à corriger maintenant. |
| **GAP-10** | Un zombie **existant en base** a `current_state='qr_ready'` **et** intention `expired` ; `getTransaction` ne projetait `'expired'` que sur `intent_created` | mesuré `01256abd…`, `trunk-repository.ts:7830` | **Haute (corrigée)** | **CORRIGÉ (TXN-G1)** : la Room et l'historique disent maintenant la même chose. Ce cas n'était **visible par aucune lecture de code** — il a fallu le chercher dans la base. |

### Ce qui fonctionne (mesuré, pas supposé)
- Le parcours complet A1→B9 **existe** et est câblé serveur + UI des deux côtés.
- **Aucune impasse de transition** : chaque état a **exactement un** acteur qui agit, et cet acteur a un bouton dans la Room (vérifié état par état).
- **Le rôle est lu au serveur** (`actorRole`), jamais supposé — la reprise ouvre la Room avec le bon rôle.
- Le verrou (scan QR vendeur) est **réellement** appliqué : `qr_verified` est un état canonique, et le sweep **ne touche jamais** une transaction verrouillée (c'est la contrepartie de GAP-2).
- Le message d'honnêteté d'expiration **existe** dans la Room et est **désormais atteignable** (TXN-G1).

### TXN-G1 — livré 2026-10-15 (GAP-1)

**Ce qui a changé :** une intention expirée est **terminale**. `listClosedTransactions` accepte les deux formes écrites (`closed` **et** `expired`, y compris la zombie pré-migration dont l'intention est `expired` sans événement) et les **projette sur un état honnête** (« Expirée »). Les deux UIs (acheteur, vendeur) étiquettent « Expirée », et une expirée **n'ouvre pas le reçu** (aucun achat) : elle ouvre la Room, où le message « Rien n'a été débité » est enfin lisible.

**Défaut plus profond trouvé par la preuve SQL réelle (branche canonique, 2026-10-15) :** il existe sur la canonique **un** zombie (transaction `01256abd…`) dont `current_state` est `qr_ready` **et** l'intention `expired`. `getTransaction` ne projetait `'expired'` que sur `current_state = 'intent_created'` → la **Room** aurait dit « QR à scanner » pendant que l'**historique** disait « Expirée ». **Deux surfaces, deux réponses pour la même transaction.** Corrigé : `intent_state = 'expired'` suffit (l'`intent_state` est `null` dès qu'un verrou existe, donc `expired` implique « pas verrouillé »).

**Preuve mesurée (avant/après), SQL réel :**

| | `current_state` | `intent_state` | état montré |
|---|---|---|---|
| Ancienne projection | `qr_ready` | `expired` | `qr_ready` (« QR à scanner ») |
| **Nouvelle projection** | `qr_ready` | `expired` | **`expired`** (« Expirée ») |

**Preuves :** garde `txn-g1-expired-visible.test.ts` (4) + 3 tests repo, **falsifiés** dans les deux sens ; `prove-root-read-paths` étendu (**38 chemins**, SQL réel canonique) ; **1293/1293 tests** ; tsc 0 ; 6 gardes verts ; bundles serverless régénérés (le fix `pi2.state = 'expired'` présent dans `api/v2/availability.js` servi).

### Ce qui fonctionne toujours (mesuré)

---

## 3. Ce que ça dit au fondateur

**La transaction fonctionne de bout en bout**, mais **elle ne sait pas finir autrement qu'en clôture complète**. Deux trous réels :

1. **Une intention qui meurt disparaît** (GAP-1) — le pire des deux, parce que l'utilisateur n'a **aucun moyen de savoir** ce qui s'est passé, et le stock est libéré dans son dos.
2. **Une transaction verrouillée qui stagne ne finit jamais** (GAP-2) — ni clôture, ni expiration. C'est la moitié « verrouillée » de D-TXN-3, jamais construite.

Les gaps 3–8 sont des **défauts de cohérence et de visibilité** : ils ne cassent pas le parcours, mais ils laissent l'utilisateur deviner (délai, QR perdu, silence à l'expiration).

---

## 4. Plan de clôture proposé (ordre de dépendance)

| Tranche | Contenu | Dépend de | Ferme |
|---|---|---|---|
| **TXN-G1** | **Historique honnête** : une transaction expirée apparaît dans une 3ᵉ vue « Expirées » (ou est marquée dans « Terminées »), avec le message « Rien n'a été débité » | — | GAP-1 |
| **TXN-G2** | **Expiration du verrouillé** : règle serveur (D-TXN-3, 72 h proposé) sur transaction verrouillée stagnante → état canonique + libération/remboursement + audit | D-TXN-3 (décision fondateur) | GAP-2 |
| **TXN-G3** | **Types alignés** : `expired` entre dans `TransactionState` domaine + validateur HTTP ; une seule définition | — | GAP-3 |
| **TXN-G4** | **QR persistant** : `getTransaction` renvoie le QR vivant (ou l'état `qr_ready`) → la Room l'affiche sans ré-émission ; ré-émission explicite seulement si expiré | TXN-G3 (types) | GAP-4 |
| **TXN-G5** | **Notification d'intention** au vendeur (même producteur que la demande de dispo) | — | GAP-5 |
| **TXN-G6** | **Délai visible** : la fenêtre 15 min affichée côté acheteur (« expire dans X min ») et vendeur | — | GAP-6 |
| **TXN-G7** | **Notification d'expiration** aux deux parties | TXN-G2 (état canonique) | GAP-7 |
| **TXN-G8** | **Dette de type** : retirer `failed` d'`AvailabilityStatus` ou l'écrire réellement | — | GAP-8 |

**Décisions fondateur requises avant TXN-G2/TXN-G7 :**
- **D-TXN-3a** : fenêtre d'expiration d'une transaction **verrouillée** (proposé **72 h**).
- **D-TXN-3b** : à l'expiration d'un verrouillé — **libération simple** du stock, ou **remboursement wallet** (aucun débit Omni n'existe aujourd'hui hors wallet, donc probablement libération seule) ?

**Résidu honnête** : aucune preuve navigateur **authentifiée** n'a été faite ici (sandbox sans session réelle). Le parcours est prouvé par lecture des requêtes réelles + suite de tests ; le spot-check fondateur reste requis avant de déclarer la clôture.
