# BRANCHES — Préparation juridique d'Omni (risque « être poursuivi »)

Date : 2026-10-07 · Porte : **BRANCHES** (`HEARTWOOD_CLOSED_BRANCHES_OPEN`)
Branche : `omni-v2-rebuild` · Prod : `https://omni.sparkafrika.online`

## 1. La question du fondateur

> « Je ne veux pas être poursuivi pour l'app — qu'est-ce qui est nécessaire et manque
> encore qu'on pourrait ajouter ? »

Ce document répond par **ce qui est mesuré**, pas par une opinion. Il sépare ce qui est
**déjà là** (et suffit), ce qui **manquait et a été livré**, et ce qui **relève d'un conseil
qualifié** — ce qu'aucun agent ne peut remplacer.

## 2. Cadre juridique applicable (recherché, non extrapolé)

| Source | Ce qu'elle impose à Omni |
|---|---|
| **Loi togolaise n° 2019-014** (protection des données, IPDCP) | Consentement explicite au traitement, information préalable, droits d'accès / rectification / suppression, sécurité des données. Autorité : IPDCP. |
| **Directive UEMOA n° 01/2023** (protection du consommateur) | Information loyale et vérifiable sur le service et le vendeur ; pas de promesse non tenue. |
| **Acte additionnel CEDEAO** (transactions électroniques) | Traçabilité des transactions, identification des parties. |
| **Licence OSM (ODbL)** | Attribution « © OpenStreetMap contributors ». |
| **Prestataire de paiement** | Le portefeuille passe par **FedaPay**, PSP agréé — Omni ne détient pas les fonds. |

Omni est un **service de mise en relation** : il ne vend pas les biens, ne livre pas,
n'encaisse pas le prix des biens. Cette position réduit le risque mais **ne le supprime pas** :
dès qu'Omni traite des données personnelles et trace des transactions, il a des obligations.

## 3. Ce qui existait déjà (mesuré, suffisant)

- **Attribution carte** : `© OpenStreetMap contributors` rendu sur la carte (`TrunkMap.tsx`).
- **Base légale du paiement** : recharge via **FedaPay**, PSP agréé (pas de collecte de carte bancaire).
- **Traçabilité** : ledger v2 append-only, snapshots transactionnels, QR signés.
- **Sécurité minimale** : mots de passe gérés par Neon Auth (jamais stockés en clair par Omni).
- **Honnêteté produit déjà en place** : la disponibilité n'apparaît qu'une fois confirmée
  (pas de fausse promesse), le statut « déclaré » du téléphone n'est jamais présenté comme vérifié.

## 4. Ce qui manquait — et a été livré (commit BRANCHES-LEGAL)

Mesure de départ : **aucune** page confidentialité, **aucun** consentement au traitement,
**aucun** moyen d'exercer les droits (accès / suppression). C'était le premier risque réel.

| Élément | Avant | Après |
|---|---|---|
| Consentement explicite à la création de compte | absent | **case à cocher obligatoire** (bloque la création tant qu'elle n'est pas cochée) |
| Politique de confidentialité | absente | section **Confidentialité** (données, finalité, base, durée, destinataires) |
| Conditions d'utilisation | absentes | section **Conditions** (ce qu'Omni fait / ne fait pas) |
| Mentions légales | absentes | section **Mentions** (éditeur, hébergement, attribution OSM, signalement) |
| Droits (accès / rectification / suppression) | absents | section **Vos données** + accès depuis Compte |
| Accès public à l'information | inexistant | entrée menu **Informations légales** visible **sans compte** |
| Prénom à l'inscription | optionnel (mensonge fondateur) | **requis** |

Fichiers : `src/trunk/LegalSheetV13.tsx` (nouveau), `src/trunk/AuthSheetV13.tsx` (consentement
+ liens), `src/trunk/TrunkAppV13.tsx` (feuille `legal`, entrées menu + Compte).

## 5. Ce qui reste — et qui exige un humain qualifié (non bloquant pour le pilote)

Ces points **ne peuvent pas** être « codés » par un agent. Ils sont listés pour que le
fondateur sache exactement où le risque restant se situe.

1. **Validation par un conseil qualifié (Togo)** des textes livrés. Ce qui est en ligne est
   honnête et vérifiable, mais **n'est pas** un avis juridique. Tant qu'un conseil ne les a
   pas relus, ils restent « version pilote ».
2. **Déclaration / enregistrement auprès de l'IPDCP** si le volume ou la nature des données
   le requiert (à confirmer avec le conseil).
3. **Suppression de compte automatisée.** Aujourd'hui, la suppression est **demandée par
   e-mail** et traitée manuellement. Une suppression en un tap nécessite de définir la
   **rétention des transactions** (obligation comptable) et de câbler une route serveur avec
   une politique de conservation explicite. **Ne pas câbler un DELETE naïf** : plusieurs
   références `v2_accounts` sont `ON DELETE RESTRICT` (transactions) et **le feront échouer**.
4. **Politique de rétention chiffrée** (combien de temps chaque catégorie est conservée),
   à écrire avec le conseil.
5. **Vérification d'âge / contenus sensibles** si le catalogue s'ouvre à des catégories
   réglementées (santé, alimentaire, alcool). À trancher avant d'ouvrir ces catégories.
6. **Conformité vendeur** : Omni n'est pas responsable des biens, mais les **Conditions**
   doivent le dire clairement au vendeur (fait) et Omni doit pouvoir **retirer un contenu**
   signalé (le signalement est prévu ; le retrait admin existe via la file de revue).

## 6. Preuve

- `npm run proof:branches-legal` — navigateur réel, largeurs 390 et 1280 :
  - création : **Prénom requis** (bouton bloqué sans), **consentement requis** (bloqué sans) ;
  - lien Confidentialité ouvre une **vraie feuille légale** contenant les droits et l'attribution OSM ;
  - entrée menu **Informations légales** présente **sans compte** ;
  - **0 pageerror**.
- `npm test` — 1017/1017.
- Gardes : `check:live-surface`, `check:dock-search`, `check:state`, `check:docs`,
  `check:boundary`, `check:coherence`, `check:maquette`, `check:dead-css` — tous verts.

## 7. Position honnête

Le fondateur a raison de poser la question : **avant ce commit, Omni collectait des données
personnelles sans consentement ni politique — c'était le vrai risque.** Ce risque est
**réduit** : l'utilisateur est informé, consent, et sait exercer ses droits.

Il n'est **pas supprimé** : la version opposable doit être **validée par un conseil qualifié**,
et la **suppression automatisée** reste à construire avec une politique de rétention.
Dire le contraire serait exactement le genre de promesse non tenue que le produit refuse.
