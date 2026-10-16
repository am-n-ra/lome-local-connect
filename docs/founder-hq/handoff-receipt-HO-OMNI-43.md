# Handoff receipt — HO-OMNI-43 (Founder HQ ↔ Nature Way)

> **Objet :** `TXN-G2` / **D-TXN-3b** — l'expiration d'une transaction **verrouillée mais jamais
> engagée**. Décision fondateur `ok` sur les options (A1 + B3). Porte courante
> **`HEARTWOOD_CLOSED_BRANCHES_OPEN`** (Branches OPEN). **Livré et prouvé** (SQL réel, branche
> jetable). Ferme **GAP-2**, le dernier gap de la sous-file transaction.

## Dispatch Record (Founder HQ)

| Champ | Champ valeur |
|---|---|
| Objectif | Trancher et livrer l'expiration du verrouillé (dernier gap transaction mesuré) |
| Skill primaire | **`/nature-way`** — durcissement Branches, une fonctionnalité |
| Skill secondaire | aucun |
| Reversibilité | **réversible** — nouveau sweep séparé (n'altère pas le pré-verrou) ; fenêtre paramétrée ; aucun schéma modifié |
| Gate de premier niveau | Source autorité : Seed (S-06) + contrat transaction 2026-09-16 (D-TXN-3) + décision fondateur 2026-10-15 |
| Invocation | `/nature-way-founder-hq` puis `/nature-way` — activés |

## Activation Receipt

| Champ | Valeur |
|---|---|
| Entrée | fondateur `ok` → approbation des options **A1 + B3** présentées dans `omni-d-txn-3-locked-expiry-options-2026-10-15.md` |
| Lecture de l'état | `docs/founder-hq/current-state.md` → porte **`HEARTWOOD_CLOSED_BRANCHES_OPEN`** (Branches OPEN) |
| Portée tenue | **Branches = durcissement, pas de fondation neuve.** Le sweep est un ajout à une mécanique existante (TXN-G7) ; l'escalade opérateur (nouvelle surface) est **laissée hors** |

## Résultat (evidence)

| Item | Statut | Preuve |
|---|---|---|
| `T-G1`…`T-G8` | **tous livrés/vérifiés** | registre `omni-transaction-gaps-register-2026-10-15.md` ; plan `intra-skill-plan-NW-PROD-OMNI-TXN-02.md` |
| **`T-G2` (GAP-2)** | **`verified`** | `scripts/prove-tg2-locked-expiry.mjs` **4/4** sur branche jetable `br-damp-forest-amviasxa` (supprimée) — SQL réel, code livré |
| Falsification | **2 échecs obtenus** | élargir la règle à `payment_declared` → T2 échoue ; retirer le rendu → garde de surface échoue |
| Suite | **1309/1309**, tsc 0 | boundary · live-surface · dead-css · state · docs · coherence — **6 gardes verts** |
| Bundles serverless | **12 régénérés** | `sweepStalledLockedTransactions` présent dans `api/v2/availability.js` |

## Ce qui a changé (fond)

- **Prémisse du contrat corrigée.** Le contrat 2026-09-16 disait « expire → rembourse le wallet ».
  **Mesure** : une transaction **ne débite jamais le wallet** (achat externe FedaPay) ; le seul actif
  retenu est la **réservation de stock**. Il n'y avait **rien à rembourser**.
- **Défaut réel mesuré.** `sweepExpiredIntents` exclut le verrouillé → après le verrou, le stock
  n'est libéré **que par la clôture**. Canonique : **5 transactions verrouillées d'août/septembre
  jamais clôturées** + **une `qr_ready` d'aujourd'hui tenant 1 unité sur un produit alloué à 1**.
- **Règle livrée (B3 resserrée).** Expire **uniquement** l'état **exactement `qr_verified`** (> 72 h)
  : jamais avancé = rien d'engagé. Toute étape ultérieure (argent/remise) → **jamais expirée**
  (escalade opérateur = tranche séparée). Libération du stock + événement + audit + notification des
  deux parties.
- **Surface.** La reprise d'une demande expirée/annulée le **dit** et **arrête le poll**.

## Resource Receipt

| Ressource | État |
|---|---|
| `references/ecosystem-activation-manifest.md` | **Loaded** |
| `references/intra-skill-execution-controller.md` | **Loaded** |
| `references/founder-hq-board.md` | **Loaded** |
| `docs/founder-hq/current-state.md` | **Loaded** (lu avant toute affirmation de porte) |
| `templates/intra-skill-plan.md` | **instancié** (plan local `NW-PROD-OMNI-TXN-02` existant, réconcilié) |
| `references/portability-protocol.md` | **Not loaded** — aucun export/transfert |
| `references/ecosystem-orchestration-protocol.md` | **Not loaded** — pas de nouveau venture |

## Return handoff to Founder HQ

- **HQ plan ID :** `HQ-OMNI-2026-09-02` · **Local plan ID :** `NW-PROD-OMNI-TXN-02`
- **Active gate :** Branches (`HEARTWOOD_CLOSED_BRANCHES_OPEN`)
- **Closed :** `T-G1 · T-G2 · T-G3 · T-G4 · T-G5 · T-G6 · T-G7 · T-G8 · W-01`
- **Open/blocked :** aucun dans cette sous-file
- **Residual gap :** escalade des verrous **avancés** abandonnés (surface opérateur) = tranche
  séparée, **non ouverte** ; preuve navigateur **authentifiée** (session réelle) au prochain
  spot-check fondateur
- **Decision :** `D-TXN-3a = A1`, `D-TXN-3b = B3` (72 h) — **tranchées**
- **Owner :** Nature Way (agent) — prochaine tranche Branches = décision fondateur
- **Next smallest action :** aucune dans `W-01`. Le fondateur choisit la prochaine branche
  (p. ex. ouvrir l'escalade opérateur, ou un autre gap).
- **Re-plan trigger :** une mesure qui contredit le contrat, ou un nouveau gap fondateur
