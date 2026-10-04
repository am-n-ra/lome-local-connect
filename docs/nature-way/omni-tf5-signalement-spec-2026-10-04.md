# TF-5 Signalement — spec (pas de code)

> **Statut :** spec écrite 2026-10-04 (`HO-OMNI-26`, `/nature-way`). Aucune ligne
> de produit modifiée. Implémentation gated sur les décisions `D-SIG-1…5` (HQ/fondateur).
> **Porte :** Trunk, tranche TF-5 (« Signaler un contenu + file intel admin »).

## 1. Mini-seed — ce que cette tranche doit faire, pour qui, pourquoi

Un acheteur qui voit une offre mensongère (prix, visuel, disponibilité) doit pouvoir
le dire **sans écrire au vendeur et sans justice privée**. Son signalement arrive à
l'équipe, un opérateur le **constate sur le terrain**, et quelqu'un d'autre tranche.
Le vendeur est présumé honnête jusqu'au constat — pas de badge retiré sur un clic.

## 2. Ce que la maquette dit déjà (lu, pas inféré)

| Écran maquette | Contenu réel |
|---|---|
| `signal` (fiche offre + suivi) | Titre « Signaler « Huile 1 L » » ; 3 motifs chips : **Prix trompeur / Visuel ne correspond pas / Indisponible en réalité** ; texte libre **optionnel** (« Précisez (optionnel)… ») ; envoi → toast « Signalement envoyé à l'opérateur ». Lead : « Alimente la **réputation de l'offre** (S-32) et la file de contrôle terrain. » |
| `op-queue` (terrain) | Cardbox « Signalement · « Huile 1 L » — **À contrôler** » parmi la tournée. Lead : « L'opérateur agit **sur le terrain** : il constate, il documente, **il ne décide pas du badge final**. » |
| `admin-console` | Compteurs « Signalements d'offre : 0 » + « Disponibilités incohérentes : 1 » (compteurs, pas la file). |
| `admin-signal` | **N'est PAS la modération** : c'est l'intel demande (« Ce que les gens cherchent sans trouver », « jamais une vente de données », « En faire un objectif d'acquisition »). **Déjà construit par TF-2** (`listDemandSignals` + cardbox « Demande du marché »). Deltas restants : affichage zone (« · Adawlato »), compte « N recherches · M résultats », action « objectif d'acquisition » (toast en maquette). |

## 3. Mesure du sol (2026-10-04)

- **0 table** `v2_report/signal/moderation/flag` en migrations ; **0 occurrence**
  `signalement`/`moderation` dans `src/` hors tests : TF-5 est greenfield.
- `computeIntegrity` (`src/trunk/offer-existence.ts:155`) est **automatique** (4 contrôles
  dérivés, invariant R-F « dérivé, jamais stocké »). Un clic acheteur ne doit donc
  **jamais** faire basculer l'intégrité en silence — voir §5.

## 4. Contrat proposé (à implémenter après décisions)

**Table `v2_offer_reports`** (migration MCP apply, additive) : `id`, `product_id` FK CASCADE,
`reporter_account_id` FK, `motif` CHECK (`prix_trompeur`/`visuel_non_conforme`/`indisponible`),
`detail` text nullable ≤ 500, `state` CHECK
(`nouveau`/`constate_infirme`/`constate_confirme`/`traite`), `created_at`,
`decided_by`/`decided_at`/`decision_note` nullables. Audit via `v2_audit_events`
(comme les files sœurs), jamais de DELETE.

**Transitions** : `nouveau` (acheteur, authentifié requis — D-05) → constat opérateur
(`constate_infirme` / `constate_confirme`) → `traite` (décideur, voir D-SIG-1).
Un acheteur = **1 signalement `nouveau` actif par offre** (re-clic = no-op honnête,
même garde d'idempotence que les intents).

**Surfaces** : fiche offre → bouton « Signaler cette offre » (sheet `signal` 1:1 :
3 chips + texte optionnel + envoi) ; `op-queue` → cardbox « À contrôler » ; console
admin → compteurs « Signalements d'offre » (réels, plus le 0 en dur).

**Règles serveur** : auth exigée ; le vendeur visé ne voit ni le signalement ni le
signaleur (pas de représailles) ; le signaleur n'est jamais notifié du détail de la
décision (pas de boucle de vengeance) — seul un état honnête « reçu / en contrôle /
clos » sur SON signalement.

## 5. Interaction S-32 (point de conception, pas un détail)

L'intégrité est automatique et dérivée. Trois options :
- (a) **recommandé** : les signalements alimentent un **flag de modération séparé**,
  visible équipe uniquement ; l'intégrité affichée ne bouge que si le flag est
  `constate_confirme` ET que le vendeur ne corrige pas (délai) ;
- (b) un signalement confirmé devient un **5ᵉ contrôle nommé** d'intégrité ;
- (c) les signalements ne touchent que la **réputation** (avis), jamais l'intégrité.
Voir D-SIG-2. Dans tous les cas : **aucun effet automatique d'un `nouveau` non constaté.**

## 6. Décisions requises (HQ/fondateur — la spec ne les prend pas)

| ID | Question | Recommandation (pas une décision) |
|---|---|---|
| D-SIG-1 | Qui tranche le badge final après constat opérateur ? | Reviewer/admin (la maquette interdit à l'opérateur de décider) |
| D-SIG-2 | Effet sur S-32 ? | (a) flag séparé (voir §5) |
| D-SIG-3 | Anti-abus ? | 1 actif/offre/acheteur (garde) ; signalements abusifs répétés = à définir (pas de sanction auto sans décision) |
| D-SIG-4 | « Objectif d'acquisition » (`admin-signal`) : vrai objet ou reporté ? | Reporté — le toast maquette reste un toast ; TF-2 mesure déjà, l'action vient avec TF-6/terrain |
| D-SIG-5 | Vendeur notifié du signalement ? | Non avant constat (présomption d'honnêteté) ; notifié à `traite` si confirmé, avec motif |

## 7. Preuve prévue (implémentation, plus tard)

Tests dépôt falsifiés (garde auth, idempotence re-clic, non-propriétaire aveugle comme
RH-02) ; preuve MCP sur jetable (cycle `nouveau`→`constate_confirme`→`traite`,
re-clic no-op, vendeur aveugle) ; T-07d. Estimation : tranche M (migration + serveur
+ 3 surfaces), ~1 session après décisions.

## 8. Non-goals

Pas de sanction automatique, pas de score public du vendeur, pas de boucle de
contestation vendeur (phase ultérieure), pas de modération d'avis clients (autre objet).
