# Contrat de flux & d'états — Transaction Omni (intention → verrouillage → clôture)

Date : 2026-09-16 · Branche `omni-v2-rebuild` · HEAD `8b3a3e5`
Phase Nature Way : **Root System** (contrat avant code) — répond à la question fondateur du 2026-09-16.
Statut : **à confirmer par le fondateur** (D-TXN-1…D-TXN-6). Aucun code tant que le contrat n'est pas accepté.

## 0. Question fondateur (reformulée)

> « J'espère qu'**annuler une transaction en cours n'existe pas**, qu'un **verrouillage d'intention oblige à aller au bout**, et que l'UI permet seulement de **sortir faire autre chose puis revenir sans problème**. Ou bien — quel est le **bon flow** au vu de tout ce qu'on veut permettre avec Omni : offre, produit, service, mobile comme fixe comme digital, discovery ? »

## 1. Vérité code (sondée, pas d'opinion)

| Fait | Évidence |
|---|---|
| La machine à états transaction **n'a AUCUN état `cancelled`/`expired`/`abandoned`** | `src/domain/contracts.ts:45` — union = `intent_created → qr_ready → qr_verified → payment_declared → payment_confirmed → fulfilment_pending → fulfilled → received → rated → closed` |
| **Il n'existe AUCUNE route/REPO/UI pour annuler une transaction** | `grep cancel` sur `src/server/*` + `src/trunk/*` → aucune méthode de repo transaction cancel (seuls `cancelClaim` = revendication, et `cancelled` = statut de *demande de dispo*) |
| Le dock en flux `flow`/`claim` affiche un bouton **« Annuler »** … | `TrunkAppV13.tsx:1108` `{ icon: 'cancel', label: 'Annuler', target: 'none' }` |
| … qui en réalité **sort vers la carte** — branche `handleDock('cancel')` **inatteignable** (code mort) | `handleDock` : `if (target === 'cancel') setSheet('facility')` jamais appelée ; `'none'` fait `setSelectedId(null); setSheet('none')` → carte |
| `BuyerFlowV13` n'a qu'un **`Fermer` (X)** → `onClose` → retour fiche. Aucun cancel. | `BuyerFlowV13.tsx:273` |
| Une fois le flow fermé, **il n'existe AUCUNE surface pour revenir** sur une transaction en cours | API : seulement `getTransaction(transactionId)` (`api.ts:500`) — **aucun endpoint « mes transactions »** ; aucune UI « en cours » |
| **QR = fenêtre de 10 minutes** | `trunk-repository.ts` `issueQrToken` : `expiresAt = Date.now() + 10*60*1000` |
| Le paiement réel est **externe** (FedaPay) : `declareExternalPayment` puis `confirmExternalPayment` / webhook `reconcile` | routes `transaction-transitions`, `fedapay-adapter` |
| Le claim (revendication), lui, a un **vrai cancel** | `cancelClaim` + `claim_cancelled` (`trunk-repository.ts:1407`) |

**Conclusion de sûreté :** l'annulation *réelle* d'une transaction **n'existe pas** — c'est conforme à ton intuition. **MAIS** le bouton s'appelle « Annuler » alors qu'il fait « sortir vers la carte », et **aucun moyen de revenir n'existe**. C'est **pire que dangereux** : un acheteur croit avoir annulé et abandonne une transaction qui est **toujours vivante côté serveur** (paiement potentiellement en cours chez FedaPay).

## 2. Le bon flow (proposé) — la bascule est le **QR**, pas le type de vendeur

Le modèle se lit en **deux phases séparées par le verrou**, et ce découpage est **le même** pour offre/produit/service et pour fixe/mobile/digital. Ce qui change selon le type de fourniture, c'est **la sémantique de dispo et de réalisation** (Branch), jamais la machine à états (Trunk).

### Phase A — Découverte & Intention (souple, sortie libre)
`carte/recherche → fiche → sélection produits → demande de dispo → réponse vendeur → INTENTION d'achat`
- Rien n'est engagé : **aucun argent déplacé, aucun stock réservé, aucun QR**.
- Sortir est **libre**. L'intention est **parquée** et **reprenable**.
- Retrait/annulation possible **ici seulement** (statut souple `cancelled` de la demande), sans effet monétaire.

### Phase B — Transaction (dure, verrouillée après le QR)
`intention → QR émis (qr_ready) → QR vérifié (qr_verified) = VERROU → paiement → réalisation → réception → avis → clôture`
- À partir de `qr_verified` + paiement, la transaction est **engagée** : elle **doit aller au bout**.
- **Pas d'annulation unilatérale.** Deux issues seulement : **clôture complète**, ou **expiration** (règle serveur, hors action utilisateur).

### Le concept manquant : **suspendre / reprendre** + **expirer** (jamais « annuler »)

| Notion | Qui | Effet | Règle |
|---|---|---|---|
| **Suspendre** (sortir) | utilisateur | quitte l'écran, revient à la carte — la transaction **reste en attente** | libre, à toute étape |
| **Reprendre** | utilisateur | rouvre la transaction depuis « **Transactions en cours** » | requiert une surface de liste (aujourd'hui absente) |
| **Expirer** | **serveur** | transaction verrouillée qui stagne au-delà d'une fenêtre → est libérée (réservation/argent restitué au wallet) | la **seule** fin non-complète d'une transaction verrouillée |
| **Annuler** | — | **interdit en unilatéral sur transaction verrouillée.** Un vrai cancel mutuel (litige) est un chemin contrôlé (accord 2 parties ou opérateur) → V1 hors scope | décision D-TXN-1 |

### Pourquoi ça tient pour tous les cas

| Type de fourniture | Dispo (Phase A) | Déclencheur du verrou (Phase B) | Réalisation |
|---|---|---|---|
| **Fixe** (boutique) | stock / à valider | scan QR au comptoir | remise / service |
| **Mobile** (ambulant) | position partagée + rayon | scan QR au point de rencontre | remise |
| **Digital** (sans géo) | dispo en ligne | QR partagé à distance (ou clic) | livraison/accès |
| **Service** | créneau / date (**nouveau champ dispo**) | QR au rendez-vous | exécution du service |
| **Bien / propriété** | dispo + visite | QR à la visite | transfert |

→ **Un seul Trunk ; les types sont des variations de champs de dispo + libellés de réalisation.** Ne pas créer une seconde machine à états par type.

## 3. Décisions à confirmer (fondateur)

| # | Décision | Recommandation |
|---|---|---|
| **D-TXN-1** | Aucune **annulation unilatérale** d'une transaction verrouillée. Le bouton « Annuler » du flux doit être **renommé** (« Quitter » / « Retour à la carte ») et le code mort `handleDock('cancel')` **supprimé**. | **OUI** — corriger le libellé trompeur en priorité |
| **D-TXN-2** | Créer la surface **« Transactions en cours »** (acheteur **et** vendeur) listant les transactions non terminales, **reprenables**. C'est le *parent manquant* de « sortir et revenir ». | **OUI** — c'est le cœur de ta demande |
| **D-TXN-3** | Règle d'**expiration serveur** : QR **10 min** (déjà en place) ; **intention non verrouillée** : ? (proposer 48 h) ; **transaction verrouillée stagnante** : ? (proposer 72 h) → libère la réservation/rembourse le wallet. | À fixer avec toi |
| **D-TXN-4** | **Avant verrou** : retrait souple d'une intention/demande de dispo (aucun effet monétaire) — déjà partiellement couvert par `cancelled` de la demande. | **OUI** |
| **D-TXN-5** | **Après verrou** : cancel **mutuel** (litige) = chemin opérateur, **hors V1** (watch Gate 7). | **Hors V1** |
| **D-TXN-6** | **Dispo « service »** (créneau/date) = nouveau champ de la Phase A, tranche séparée quand un vrai vendeur service arrive. | À planifier |

## 4. Slice correctif immédiat (si D-TXN-1/D-TXN-2 acceptés)

Ordre de dépendance (un gate = une tranche) :
1. **FF-1 (correction trompeuse, S)** : renommer le bouton de flux + supprimer le code mort `handleDock('cancel')`. Tests + build + push.
2. **FF-2 (surface « Transactions en cours », M)** : endpoint `GET /api/v2/buyer/transactions` (+ vendeur) → repo `listMyTransactions` (lecture seule, non terminales) → UI liste reprenable (`openTxn(id)` recharge `loadTxn`). **C'est le parent manquant.**
3. **FF-3 (expiration serveur, M)** : règle temporelle sur intention + transaction verrouillée, libération/remboursement, audit. Décision D-TXN-3 requise.
4. **FF-4 (dispo service, M/L)** : champ créneau — après un vrai vendeur service.

## 5. Ce qui est bloqué / non prouvé

- Aucun cycle HTTP authentifié exécuté (sandbox sans DB/Auth) → les slices FF-* seront livrées **code + tests unitaires**, preuve navigateur groupée dans **PRE-1**.
- La fenêtre d'expiration (D-TXN-3) est une **décision métier**, pas un choix technique.