# Skill Handoff and Activation Receipt — HO-OMNI-38

> **Request ID:** `HO-OMNI-38`
> **Founder HQ timestamp:** 2026-10-07 (UTC)
> **Primary authority:** `/nature-way`
> **Exact invocation:** `/nature-way-founder-hq /nature-way`
> **Activation status:** `activated` — porte **BRANCHES** (`HEARTWOOD_CLOSED_BRANCHES_OPEN`)

## Porte (inchangée)

Registre `HEARTWOOD_CLOSED_BRANCHES_OPEN`. Heartwood **CLOSE `founder-confirmed` 2026-10-07**,
Trunk **CLOSE `founder-confirmed` 2026-10-07**, Root/Seed/Species clos. **Porte courante =
Branches** — une fonctionnalité à la fois ; terrain **EN DERNIER**. Source de vérité :
`docs/founder-hq/current-state.md`.

## Handoff input

| Field | Value |
|---|---|
| User objective | (1) bugs fondateur (fait avant cette activation) ; (2) « je ne veux pas être poursuivi pour l'app — qu'est-ce qui est nécessaire et manque ? » + « le nom ne doit pas être optionnel » + « où est passé l'onboarding ? » + auth incohérente après création de compte |
| Current milestone and gate | Branches ouverte ; périmètre = **durcissement/clôture**, pas de nouvelle fondation |
| Structural path / venture stage | Produit : préparation juridique + cohérence auth |
| Relevant artifacts and proof | `docs/nature-way/omni-branches-legal-readiness-2026-10-07.md` ; `scripts/prove-branches-legal.mjs` ; `src/trunk/legal-readiness-guard.test.ts` ; commit `a86e891` |
| Dependencies and constraints | Playwright chromium (installé si cache vide) ; Neon Auth (`signUp.email`, `sendVerificationEmail`, `getSession`) ; prod vs local (T-07d) |
| Secondary route | Aucune |
| Expected specialist return | Éléments juridiques nécessaires identifiés + livrés ou nommés comme hors autorité d'agent ; auth cohérente ; preuve navigateur ; push + T-07d |

## Specialist resource receipt

| Resource status | Exact path or explanation |
|---|---|
| Loaded | `docs/founder-hq/current-state.md` (§Branches OPEN), `founder-hq-board.md`, plan/registres V2 |
| Template instantiated | Réconciliation sur l'état de référence existant (pas de plan concurrent) |
| Not loaded / reason | Aucun à ce stade |

## What was measured (avant d'écrire)

- **Mesuré** : `grep` sur `src/` → **aucune** page confidentialité, **aucun** consentement,
  **aucun** moyen d'exercer les droits (accès/suppression). C'est le **premier risque réel**.
- **Cadre** : loi togolaise n° 2019-014 (IPDCP), directive UEMOA n° 01/2023, acte CEDEAO
  transactions électroniques, licence OSM (ODbL), FedaPay (PSP agréé).
- **FK** : sur 38 références `v2_accounts`, **15 `ON DELETE RESTRICT`** → une suppression de
  compte naïve **échouera** (à traiter avec une politique de rétention).

## What was delivered — commit `a86e891` (poussé, prod-vérifié)

| Élément | Résultat |
|---|---|
| Consentement au traitement | **case obligatoire** à la création (bloque le bouton) — loi 2019-014 |
| `LegalSheetV13` | Confidentialité / Conditions / Mentions / Vos données (droits + attribution OSM + contact) |
| Accès sans compte | entrée menu **Informations légales** hors du bloc `sessionUser` |
| Droits depuis Compte | boutons Confidentialité / Conditions / Supprimer mes données |
| Prénom | **requis** (fondateur : le nom ne doit pas être optionnel) |
| Confirmation e-mail | **état réel** (renvoyer + « J'ai confirmé ») ; e-mail non confirmé **dit la vérité** |
| Surface morte | `OnboardV13` **retiré** (chemin jamais appelé) — fonction repliée dans `AuthSheetV13` |
| Chip Transport | **`Ambulants`** (filtre la **forme** du lieu, pas un service A→B inexistant — S-12) |

## Proof

- `npm run proof:branches-legal` — navigateur réel, 390 + 1280 : Prénom requis (bloque sans),
  consentement requis (bloque sans), feuille légale réelle (droits + OSM), entrée menu sans
  compte, **0 pageerror**. Rejoué **sur prod** : **ALL OK**.
- `npm test` → **1021/1021** ; `tsc` clean ; 8 gardes verts (`live-surface`, `dock-search`,
  `state`, `docs`, `boundary`, `coherence`, `maquette`, `dead-css`).
- **T-07d** : prod sert `index-Cwz…` === build local ; chaînes (`Ambulants`, `Informations
  légales`, `politique de confidentialité`, `J'accepte les`, `Confirmez votre e-mail`) **présentes
  dans le bundle servi** ; ancien libellé `Transport (mobile)` **absent (0)**.
  ⚠️ Entrée GitHub `deployments` **non lisible** (jeton API `401` transitoire ; le `git push` a
  réussi dans la même session) → à re-vérifier si le jeton se rafraîchit.

## Décisions fondateur requises (suite)

1. **Valider les textes** par un conseil qualifié (Togo) — ce qui est en ligne est **honnête et
   vérifiable**, **pas opposable**.
2. **Suppression de compte automatisée + rétention** — décider la politique de conservation des
   transactions (FK `ON DELETE RESTRICT`).
3. Reste hors autorité d'agent : déclaration IPDCP, rétention chiffrée, catégories réglementées.

## Dispatch result

`/nature-way` livre la branche `BRANCHES-LEGAL` (préparation juridique + cohérence auth),
prouvée en prod. **Retour vers HQ** : la branche est `verified` ; HQ attend la **sélection de la
prochaine branche** par le fondateur (liste ordonnée dans `current-state.md` §Branches OPEN).
