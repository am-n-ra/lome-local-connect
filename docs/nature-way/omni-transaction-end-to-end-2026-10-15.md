# Comment marche une transaction dans Omni — de la recherche à la clôture (2026-10-15)

> Réponse à la question fondateur : « comment fonctionne une transaction, depuis la recherche ? »
> + « quelles étapes restent incomplètes ou indisponibles, et plan pour les fermer ».
> **Tout ce qui suit est mesuré dans le code livré et la base canonique**, jamais supposé.
> Porte courante : **`HEARTWOOD_CLOSED_BRANCHES_OPEN`** (Branches OPEN).

## 1. Le parcours réel, étape par étape

| # | Étape | Qui agit | Où (surface) | État |
|---|---|---|---|---|
| 0 | **Parcourir la carte** | acheteur | carte + rail de filtres | **livré** (sans compte, D-05) |
| 1 | **Rechercher** (offre *ou* entité) | acheteur | barre de recherche | **livré** — recherche tapée = **globale** (BRANCHES-SEARCH-SCOPE) ; **compte requis** (D-05, reprise après connexion) |
| 2 | **Ouvrir une fiche facilité** | acheteur | fiche | **livré** — prix **avec et sans remise**, niveau d'existence S-06, intégrité/réputation S-32, visuel d'offre |
| 3 | **Demander la disponibilité** | acheteur | fiche → formulaire | **livré** — 1 facilité = **gratuit** ; groupé = crédits bulk ; **délai 15 min visible** (TXN-G6) |
| 4 | **Répondre** | vendeur | file vendeur | **livré** — l'acheteur voit « Confirmé par le vendeur » / « Automatique au nom du vendeur » (**NR-7** : jamais un « auto » en dur) |
| 5 | **Créer l'intention d'achat** (le **verrou**) | acheteur | fiche → flux | **livré** — **réserve le stock** (FF-8) ; émet un **vrai QR** (S1) ; notifie le vendeur (NR-4) |
| 6 | **Scanner le QR** | vendeur | scanner | **livré** — passe à `qr_verified` : **la transaction devient verrouillée** |
| 7 | **Déclarer le paiement** | acheteur | salle de transaction | **livré** — `payment_declared` (l'argent circule **hors Omni**, FedaPay/espèces) |
| 8 | **Confirmer le paiement** | vendeur | salle de transaction | **livré** — `payment_confirmed` |
| 9 | **Mettre en œuvre** | vendeur | salle de transaction | **livré** — `fulfilment_pending` → `fulfilled` |
| 10 | **Confirmer la réception** | acheteur | salle de transaction | **livré** — `received` |
| 11 | **Noter** | acheteur | salle de transaction | **livré** — `rated` **puis `closed`** : le stock est **décrémenté** (settle) et l'entité peut se confirmer |
| — | **Contact vendeur** (tél/WhatsApp) | acheteur | salle de transaction | **livré** — débloqué **après intention** (RAC-1) |
| — | **Itinéraire réel** | acheteur | salle de transaction | **livré** — **verrouillé jusqu'à l'intention** (RT-D2) ; guidage vocal = essai appareil |
| — | **Notifications** | les deux | push + Inbox | **livré** — logo Omni + **tap vers l'événement** (NR-8), pas l'Inbox générique |

**La matrice de transitions est appliquée côté serveur, acteur par acteur** (`transitionTransaction`) :
`qr_ready →(vendeur) qr_verified →(acheteur) payment_declared →(vendeur) payment_confirmed
→(vendeur) fulfilment_pending →(vendeur) fulfilled →(acheteur) received →(acheteur) rated → closed`.
Un acteur ne peut pas jouer l'étape de l'autre.

## 2. Ce qui N'EST PAS ainsi (corrections mesurées)

- **Une transaction ne débite PAS le wallet.** Seuls `ad_spend`, `bonus_spend`, `buyer_pro_spend`,
  `facility_pro_spend`, `slot_spend` débitent. Le prix de l'achat circule **en externe** (FedaPay ou
  remise en main propre, déclarée puis confirmée). Le contrat 2026-09-16 disait « expire → rembourse
  le wallet » : **c'était inexact** — il n'y a rien à rembourser. Le seul actif retenu est la
  **réservation de stock**.
- **Il n'y a pas d'« annulation » après le verrou.** Une fois `qr_verified`, on **avance** ou on
  **stagne** — jamais on n'annule. C'est le contrat voulu (FF-1 : le bouton « Annuler » mensonger a
  été retiré).

## 3. Ce qui restait incomplet — et l'état après cette session

Le registre `omni-transaction-gaps-register-2026-10-15.md` listait **8 gaps**. État réel aujourd'hui :

| Gap | Nature | État |
|---|---|---|
| GAP-1 | transaction expirée **invisible** dans l'historique | **CORRIGÉ** (TXN-G1) |
| GAP-2 | **le verrouillé stagnait pour toujours** (stock gelé) | **CORRIGÉ** (TXN-G2, cette session) |
| GAP-3 | `expired` absent du type domaine | **CORRIGÉ** (TXN-G3) |
| GAP-4 | QR perdu à la réouverture de la Room | **CORRIGÉ** (TXN-G4 — en fait **par conception** : le token en clair n'est jamais stocké) |
| GAP-5 | vendeur non notifié de l'intention | **FAUX** — déjà livré (`caf18e5`) ; le registre initial avait été écrit par grep et avait raté le producteur |
| GAP-6 | fenêtre 15 min invisible | **CORRIGÉ** (TXN-G6) |
| GAP-7 | expiration silencieuse | **CORRIGÉ** (TXN-G7) |
| GAP-8 | `failed` dans `AvailabilityStatus` | **tranché** (T-G8) — gardé, aligné sur le CHECK DB |

**Donc : les 8 gaps de la sous-file transaction sont fermés ou démasqués faux.**

## 4. Ce qui reste réellement indisponible (mesuré, honnête)

1. **Escalade des verrous AVANCÉS abandonnés** (paiement déclaré/confirmé, puis silence).
   TXN-G2 n'expire **que** l'état exactement `qr_verified` : dès qu'une étape ultérieure existe, de
   l'argent ou une remise est en jeu, et **rien** ne se déclenche automatiquement. Aujourd'hui, une
   telle transaction reste ouverte **sans issue automatique** — il faut un humain (opérateur). **La
   surface d'escalade opérateur n'existe pas.** C'est la vraie dette restante, et elle est
   **volontairement hors** TXN-G2 (ce serait une fondation neuve).
2. **Preuve navigateur authentifiée** (session acheteur/vendeur réelle de bout en bout) : non
   exécutée en sandbox ; c'est le **spot-check fondateur** qui la fournit.
3. **Guidage vocal sur appareil Android réel** : `speechSynthesis` est câblé côté client, mais la
   disponibilité d'une voix FR sur un Android réel n'est **pas prouvée** (essai manuel requis).

## 5. Plan pour fermer ce qui reste

| Tranche | Contenu | Dépend de | Risque |
|---|---|---|---|
| **TXN-H1** | **Escalade opérateur** : un verrou avancé sans mouvement depuis N jours remonte dans une file opérateur (la file `review`/`runs` existe) → l'opérateur tranche (clôturer / remettre en route). **Ne rembourse rien** (aucun débit Omni). | décision fondateur (seuil N) | fondation neuve **surface opérateur** — hors durcissement |
| **TXN-H2** | **Spot-check authentifié** du parcours complet (acheteur → vendeur) aux 2 largeurs | session fondateur | aucun (preuve seule) |
| **TXN-H3** | **Guidage vocal** : essai Android réel ; si la voix FR manque, **itinéraire consultable avant de partir** (jamais un guidage muet) | appareil réel | aucun |

**Rien de TXN-H1…H3 ne s'ouvre sans décision fondateur** (H1 = nouvelle surface ; H2/H3 = preuves).

## 6. Résidu honnête

- Le parcours est **complet de bout en bout** pour le cas nominal ; ce qui manque est le **cas
  d'exception** (verrou avancé abandonné) et les **preuves sur appareil/session réels**.
- Aucune preuve navigateur **authentifiée** n'a été exécutée ici (sandbox sans session) : le parcours
  est prouvé par les requêtes réelles + la suite (1309/1309) + les preuves SQL jetables.
