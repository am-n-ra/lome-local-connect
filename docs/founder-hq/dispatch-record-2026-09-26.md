# Founder HQ — Dispatch Record + Start-of-Review

> **Date :** 2026-09-26 · **Venture :** Omni · **Porte courante :** `ROOT` (Species CLOSE `founder-confirmed` 2026-09-25)
> **Entrée fondateur :** « bon on peut poursuivre donc »
> **Plan HQ :** `docs/founder-hq/founder-hq-master-plan.md` · **Board :** `docs/founder-hq/founder-hq-board.md`

---

## 1. Start-of-review

| Champ | Valeur |
|---|---|
| **Milestone actif** | Boucle V2 `pilot-ready` sur Lomé, alignée sur la maquette acceptée |
| **Porte courante** | `ROOT` (ouverte) — Trunk/Branches/Canopy **non ouverts** |
| **Preuve à ce jour** | `R-F` livré et prod-vérifié (`ecdb398`, prod `index-CnHnpl0w.js` === local, 664/664) ; `R-B`/`R-C`/`R-D`/`R-E`/`ALIGN-1` livrés ; 5 gardes vertes |
| **Capacité** | 1 porte, 1 spécialiste, 1 tranche verticale (fondateur solo + IA) |
| **Décision requise** | **Oui** — la porte Root nommée par le SDM a un piège mesuré (§4) |
| **Prochain owner/action** | `/nature-way` — sélectionner et livrer la tranche Root suivante |

## 2. Dispatch Record

| Champ | Valeur |
|---|---|
| **Objectif** | Poursuivre la livraison produit sous la porte Root |
| **Skill primaire** | **`/nature-way`** — livraison produit et diagnostic de phase |
| **Raison** | Demande de continuation d'exécution produit (pas de capital, pas d'opportunité, pas de capability gap) |
| **Handoff secondaire** | aucun |
| **Artefacts connus** | SDM `omni-system-dependency-map-2026-09-23.md` §4 ; maquette `omni-species-v2-interactive.html` ; `omni-root-finishing-inventory-2026-09-25.md` ; `omni-maturity-verdict-2026-09-25.md` |
| **Première porte requise** | Root — chaîne `E-01 → E-02 → E-03 → E-04 → publication honnête` |

## 3. Re-mesure avant exécution (règle « la mesure prévaut sur la mémoire »)

L'inventaire Root (`2026-09-25`) et le verdict de maturité (`2026-09-25`) portent un **trigger de
révision** : « fin de `R-B` + alignement app ». **Ce trigger a été déclenché.** Re-mesuré ce jour :

| Condition du verdict `prototype` (2026-09-25) | Re-mesure 2026-09-26 | Statut |
|---|---|---|
| 1. Le vendeur ne peut pas déclarer son offre (4 caractéristiques, 0 écriture) | **écriture + relecture + formulaire livrés** (`bfc3b7c`) — `trunk-repository.ts:2493/2536`, `SellerV13.tsx:175` | ✅ **résolue** |
| 2. Devise en dur `OMNI_DEFAULT_LOCAL_CURRENCY` | **`resolveUserCurrency`** (D-LOC-2) branché — `TrunkAppV13.tsx:172` | ✅ **résolue** |
| 3. 9 produits `USD` tarifés en francs | **16/16 en `XOF`** (mesuré live) | ✅ **résolue** |
| 4. Filtre budget serveur aveugle à la devise | **devise-aware + conversion USD→locale** — `trunk-repository.ts:2056-2067` | ✅ **résolue** |

**Les 4 conditions qui fondaient le verdict `prototype` sont levées.** Le verdict et son trigger
doivent être **re-mesurés**, pas reconduits de mémoire. *(Reste une nuance d'usage : les 4
caractéristiques sont **écrites en code** mais **0/16 en données** — c'est un acte vendeur, pas un
défaut de code.)*

## 4. ⚠️ Le piège mesuré de la porte Root (E-03 / E-04)

Le SDM nomme la porte : **« preuve Root — migration additif + contrat d'API + refus serveur d'une
offre sans visuel/avantage »**. La maquette est explicite (`omni-species-v2-interactive.html:1107`) :

> **`Visuel de l'offre` → `1 image requise`** · **`Avantage Omni (requis)` → `−15 %`**

**Mesuré : ce refus n'existe pas.** `transitionSellerProduct` (`trunk-repository.ts:2549`) n'accepte
que la limite d'offres gratuites et la capacité Pro — **aucun contrôle de visuel ni d'avantage**.

**Le piège — et pourquoi je ne code pas forward :**

| Fait mesuré | Conséquence |
|---|---|
| `v2_products.media` : **0/16** rempli | imposer « 1 image requise » **rendrait toute offre non publiable** |
| **Aucun chemin d'écriture de visuel d'offre** n'existe — le Blob (`@vercel/blob/client`) n'est branché que pour la **preuve de revendication** (`uploadFacilityEvidence`) | un vendeur **ne peut pas** ajouter le visuel qu'on exigerait |
| Avantage Omni : **12/16** ont une remise >0 | E-04 est **partiellement** soutenu par les données |

**Donc livrer le refus seul « brique » la publication.** L'ordre correct est : **d'abord le chemin
d'upload du visuel d'offre**, **ensuite** le refus. C'est une tranche à deux moitiés, pas une ligne.

## 5. Décision remontée au fondateur

Le SDM exige « refus serveur d'une offre sans visuel/avantage ». Ce refus est **juste** (la maquette
le dit) mais **il ne peut pas être livré seul** sans rendre le catalogue impubliable. Options :

| # | Option | Effet |
|---|---|---|
| **A** | Livrer **les deux moitiés** : upload du visuel d'offre (Blob) **puis** refus E-03 + E-04 | Fidèle à la maquette ; tranche la plus large |
| **B** | Livrer **E-04 seul** (avantage requis — 12/16 soutiennent la donnée) et **différer E-03** avec trigger écrit | Plus petit ; laisse le visuel non requis |
| **C** | Refus **non bloquant** : avertissement au brouillon, publication autorisée avec badge « visuel manquant » | Honnête, mais **contredit la maquette acceptée** |

**Recommandation Nature Way (à confirmer) :** **A** — parce qu'un refus sans le moyen de le
satisfaire est une impasse, et que l'impasse est précisément ce que le fondateur reproche (`SP-V2-01`,
l'offre sans propriétaire : « une impasse qui mentait »).

## 6. Activation Receipt

| Champ | Valeur |
|---|---|
| **Skill primaire** | `/nature-way` — invocation exacte : `invoke_skill(name="nature-way")` |
| **Statut d'activation** | **`activated`** — skill présent à `.agents/skills/nature-way/SKILL.md` |
| **Input passé** | Porte Root ; SDM §4 chaîne `E-01→E-04` ; re-mesure §3 ; piège §4 ; décision §5 |
| **Autorité/gate primaire** | Root System — refus serveur d'une offre sans visuel/avantage |
| **Ressource spécialiste requise** | `references/autonomous-delivery-gates.md`, `references/execution-controller.md` |
| **Retour attendu** | Contrat + tranche livrée + preuve + registre de dette + handoff HQ |
