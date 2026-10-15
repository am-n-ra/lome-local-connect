# GUIDE-1c — le guide ne s'arrête plus au dock (2026-10-15)

**Gate :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`). **Branche :** `omni-v2-rebuild`.
**Commit :** `091104e`. **Plan :** `intra-skill-plan-NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01.md`.

## Les 4 sujets du fondateur, mesurés

Le fondateur a posé **quatre sujets distincts**. Réponse mesurée, pas supposée :

| Sujet | Vérité mesurée | Statut |
|---|---|---|
| Guide **une seule fois**, option ensuite | Accueil (`WelcomeV13`, 5 étapes) montré **seulement après CRÉATION**, jamais à la connexion. « Comment ça marche » **toujours** dans le menu (même sans compte). Spotlight carte une fois (`omni-map-guide-seen`). **Pas de drapeau « accueil déjà vu »** → recréer un compte revoit l'accueil. | **PARTIEL** → décision |
| Guide **ne s'arrête pas au dock** | **BUG RÉEL, corrigé ici.** | **CORRIGÉ** |
| **Reprise PWA** (sort/revient sans fermer) | `nav-state.ts` persiste `{role, sheet, selectedId, selVisitId}` (localStorage). **Deux trous** : le guide n'est pas restaurable ; pas de reprise « recherche/flow en cours ». | **PARTIEL** → décision |
| **Manifestation notification** | Web Push réel, contenu FR par étape ; **aucun `sound`/`vibrate`** → son **du système**. | **RÉPONSE** |

## Le bug (mesuré, 390×844)

Le spotlight carte (`MapSpotlightV13`) met en évidence, à la **3ᵉ et dernière étape**, le
**dock de navigation**. Sa bulle était placée **sous** l'anneau : `top = ring.bottom + 10`.

Or le dock est **collé au bas de l'écran** (`bottom: 14px`) : l'anneau va de `766` à `836`, la
bulle tombait à **`840px`** sur un écran de **`844px`** → **4 px visibles sur 128**.
`cardOffscreenBottom: true` ; **« Terminer » et « Passer » inaccessibles**. Le guide
**s'arrêtait en route au dock** — exactement le mot du fondateur. Les étapes 1 et 2 (anneau en
haut) étaient correctes.

## Le correctif

`src/trunk/spotlight-placement.ts` — helper **pur** `placeSpotlightCard` : la bulle va **sous**
l'anneau si ça tient, sinon **au-dessus**, sinon **ancrée en bas** ; toujours bornée à la
fenêtre. La hauteur de la bulle est **mesurée** (`cardRef`), jamais supposée.

**Preuve navigateur (rejouée)** — étape dock : `placement: "above"`, **128/128 px visibles**,
`offscreen: false`, à **844 ET 667**.

## Garde falsifiable

`src/trunk/spotlight-placement.test.ts` (5). **Falsifié** : `below` forcé partout → **2 FAIL**
(« REGRESSION : l'étape dock garde la bulle entièrement visible » + « borne toujours dans la
fenêtre ») ; restauré → **5 PASS**.

## Preuves

**1226/1226** (149 fichiers), `tsc` 0, 5 gardes verts, build `index-DQAjcGEA.js`.

## Décisions ouvertes (une à la fois)

1. **Reprise PWA** : ajouter le guide aux surfaces restaurables, et **retenir une recherche/flow
   en cours** (contrat léger : quelle étape on mémorise). Recommandé.
2. **Guide « une fois »** : drapeau « accueil déjà vu » par compte (aujourd'hui : montré à chaque
   création). Le fondateur veut « une seule fois ».
3. **Notification** : aucun réglage app tant que le fondateur n'a pas dit s'il veut un son ou
   une vibration **propres** (aujourd'hui : son du système OS).
