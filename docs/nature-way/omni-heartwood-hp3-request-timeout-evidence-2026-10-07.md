# Heartwood `HP-3` — un réseau qui ne répond jamais ne pend plus l'écran (2026-10-07)

> **Porte :** `TRUNK_CLOSED_HEARTWOOD_OPEN` (durcissement — pas de nouvelle fondation).
> **Origine :** Omni est mobile-first à Lomé, sur un réseau instable. `fetchWithRecovery`
> ré-essayait une fois les 5xx **mais ne bornait pas l'attente** : un `fetch` qui ne récupère
> jamais (réseau mort, trou de couverture) laissait l'utilisateur devant « Chargement… »
> **indéfiniment** — ni erreur, ni reprise.

## 1. Le trou

`src/trunk/api.ts` : `await fetch(input, init)` sans `AbortSignal` ni délai. Le seul filet
existait en aval (`runSearch`/`loadPublic` attrapent une erreur **lancée**) — mais rien ne
lançait jamais d'erreur, car `fetch` ne se règle pas. Les écrans `lent`/`erreur` de la maquette
**simulaient** le cas (`setTimeout`) ; le chemin réel n'avait pas de borne.

## 2. Le correctif (localisé, sans changer la forme des requêtes)

- **`src/trunk/request-timeout.ts`** (neuf, pur) : `raceWithTimeout(promise, ms)` — rend la
  promesse si elle se règle avant le délai, sinon lève **`RequestTimeoutError`**
  (`code: 'REQUEST_TIMEOUT'`, `retryable: true`, message français « Le réseau ne répond pas… »).
  Le minuteur est **toujours nettoyé** (`.finally`), un délai ≤ 0 rend la promesse **inchangée**.
- **`api.ts`** : les **deux** tentatives de `fetchWithRecovery` passent par `raceWithTimeout`.
  Toute la couche client (recherche, catalogue, wallet, admin, etc.) hérite du délai.

**Trade-off assumé et documenté :** on borne l'**attente**, on n'**annule** pas la requête (le
fournisseur reste payé une fois). Annuler exigerait d'injecter un `signal` dans chaque `init`,
ce qui changerait la forme des requêtes existantes (et leurs assertions exactes) pour un gain
marginal sur un fetch déjà parti. Choix conservateur, réversible.

## 3. Preuves

- **Unitaire (fake timers)** `src/trunk/request-timeout.test.ts` (6) : rend la valeur si rapide ;
  lève `RequestTimeoutError` si jamais résolue ; nettoie le minuteur ; délai ≤ 0 = inchangé ;
  message/`code`/`retryable` ; `isRequestTimeoutError`.
- **Intégration (le vrai appel client)** `src/trunk/api.test.ts` (2 neufs) : un `fetch` qui
  **pend** → `listPublicFacilities` **rejette** avec `/réseau/i` (au lieu d'attendre sans fin) ;
  une réponse normale **n'est pas retardée**.
- **Garde source** (dans `request-timeout.test.ts`) : `fetchWithRecovery` borne bien ses **deux**
  tentatives (`raceWithTimeout(fetch(` ×2, plus aucun `await fetch(input, init)` nu).
- **Falsification** : délai neutralisé (`REQUEST_TIMEOUT_MS = 999999`) → le test d'intégration
  **expire à 5 s** (`Test timed out`) ; restauré → 52/52. La preuve **dépend réellement** du délai.
- **Batterie** : **1003/1003**, `tsc` 0, 5 gardes vertes.

## 4. Résidu honnête

- **Pas de preuve navigateur dédiée** : un harnais de bout en bout a été écrit puis **retiré** —
  il était **fragile** (l'erreur de recherche partage l'état `error` avec la découverte, qui
  échoue aussi sans backend dans le preview) et aurait produit un **faux échec**. Le contrat est
  prouvé **à la couche API** (où vit le délai) : décision honnête, pas un raccourci.
- Le délai **ne couvre pas** l'upload Blob (`@vercel/blob/client`) ni les `fetch` hors
  `fetchWithRecovery` — aucun n'existe dans `src/`, vérifié.
- **`T-07d`** : à confirmer après push (le bundle client change).
