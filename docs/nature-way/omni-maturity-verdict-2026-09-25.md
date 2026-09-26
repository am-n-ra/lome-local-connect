# Verdict de maturité — Omni (scopé)

> **ID :** `MATURITY-OMNI-2026-09-25` · **As of :** 2026-09-25 · **Porte :** `SPECIES_CLOSED_ROOT_OPEN`
> **Autorité :** `/nature-way` · **Handoff :** `HO-OMNI-20`

**Pourquoi ce document existe.** `pilot-ready` est l'objectif déclaré depuis le SDM du 2026-09-23,
mais **aucun** document ne portait le **verdict** avec sa date, sa base de preuve, ses limites et son
trigger de révision. Sans verdict scopé, « où en est Omni ? » se répond **de mémoire** — et la
mémoire dérive (voir `AGENTS.md`).

---

## Verdict

> ## `prototype` — **pas** `pilot-ready`
>
> **Scopé à :** l'**application déployée** `omni.sparkafrika.online`, sur la **boucle V2**.
> **Base de preuve :** `docs/nature-way/omni-proof-register-v2-2026-09-25.md`.
> **Date :** 2026-09-25. **Owner :** Nature Way. **Trigger de révision :** fin de `R-B` + alignement app.

**Ce verdict est plus BAS que l'objectif, et c'est volontaire.** La maquette est `pilot-ready` ; **l'app
ne l'est pas**, parce que le **fond** et l'**alignement** manquent. Confondre les deux serait
exactement le défaut que Nature Way interdit : *« ne jamais utiliser un libellé plus élevé parce que
l'interface a l'air complète »*.

---

## Ce qui soutient le verdict — par maillon

| Maillon | Niveau | Preuve |
|---|---|---|
| **Seed** | ✅ solide | 32 décisions `S-01…S-32`, `founder-confirmed` |
| **Species (maquette)** | ✅ **`pilot-ready`** | 74 écrans, **27/27 conforme**, 26 rendues, `NON MESURÉ = 0` (`PF-20`, `PF-21`) |
| **Root (socle)** | ⚠️ **partiel** | modèle entité **exécuté** (`058`→`061`) ; découverte **2 niveaux livrée** (`R-E`/S-11, `27a1661`) ; **caractéristiques d'offre : code livré (`bfc3b7c`), usage non exercé** (`PF-08` — 0/16 en données), chemins Pro/`individu` **non exercés** (`PF-07`) |
| **Trunk (boucle cœur)** | ✅ **reproduit** | cycle transactionnel complet (`PF-01`), stock (`PF-02`), intégré (`PF-03`) |
| **Heartwood (durcissement)** | ✅ bon | 600/600 tests, gardes falsifiés, append-only, idempotence |
| **App alignée sur maquette** | ❌ **non** | seuils figés, devise en dur, `public.markets` absente |
| **Canopy** | ⏸️ non ouvert | — |
| **Ring** | ⏸️ non ouvert | — |

---

## Pourquoi **pas** `pilot-ready` sur l'app

Quatre conditions **mesurées** non satisfaites :

1. **Le vendeur ne peut pas déclarer son offre** — les 4 caractéristiques (`uniqueness_kind`,
   `handover_kind`, `price_kind`, `condition_kind`) ont **0 écriture** en code. Le modèle Seed existe ;
   **l'usage non**. Un pilote réel expose des vendeurs qui ne peuvent pas décrire ce qu'ils vendent.
2. **La devise est en dur** — `OMNI_DEFAULT_LOCAL_CURRENCY`, alors que le contrat `D-LOC` (approuvé)
   exige qu'elle suive la **localisation**. Un pilote multi-zone afficherait des prix faux.
3. **9 produits sur 16 sont tarifés dans la mauvaise devise** (`USD` + montants en francs) — dette de
   données qui fausse la recherche par budget.
4. **Le filtre budget serveur compare sans devise ni conversion** — bug identifié.

**Aucune de ces quatre n'est un défaut d'interface.** Ce sont des **racines** — et c'est pourquoi le
verdict est `prototype` malgré une maquette acceptée.

---

## Limites d'exposition

| Limite | Valeur |
|---|---|
| **Public** | pilote Lomé uniquement |
| **Prod === local** | **NON** (`T-07d`) — prod sert `index-BUMFRcnb.js` |
| **Fournisseur d'itinéraire** | `MAPBOX_ACCESS_TOKEN` **non posé** → `PROVIDER_NOT_CONFIGURED`, repli honnête « à vol d'oiseau » |
| **Données** | 206 facilités, dont **203** `public_import` sans entité (fond de carte, **pas** des vendeurs) |
| **Chemin `individu`** | **jamais exercé** |

---

## Ce que ce verdict **n'est pas**

- Ce n'est **pas** un `No-go` : le socle et la boucle cœur sont **prouvés**.
- Ce n'est **pas** un jugement sur la maquette : elle est **acceptée**.
- Ce n'est **pas** une mesure du travail restant en heures : non estimé.

## Révision

**Trigger :** `R-B` livré **et** app alignée sur la maquette (seuils + devise).
**Alors :** re-verdict — viser `pilot-ready` **sur l'app**, avec preuve navigateur 4 largeurs.
