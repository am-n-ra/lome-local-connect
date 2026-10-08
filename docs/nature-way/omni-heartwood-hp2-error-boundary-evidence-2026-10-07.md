# Heartwood `HP-2` — un lancer de rendu ne laisse plus une page blanche (2026-10-07)

> **Porte :** `TRUNK_CLOSED_HEARTWOOD_OPEN` (durcissement/fermeture — pas de nouvelle fondation).
> **Origine :** l'app portait un écran **« Reprendre où j'en étais »** (panier, recherche,
> transactions), mais **aucune frontière d'erreur React**. Un lancer de rendu — la classe
> `r.on2 is not a function` déjà vue en prod — démontait **tout** l'arbre : page blanche, et
> la reprise **inatteignable** au moment précis où elle sert.

## 1. Le trou

`src/main.tsx` montait `<TrunkAppV13 />` nu. React démonte l'arbre entier sur une exception de
rendu non rattrapée. Aucun `ErrorBoundary` (`grep componentDidCatch` = 0), aucun filet
`unhandledrejection`. Une panne de rendu = écran blanc définitif, obligeant l'utilisateur à
recharger à la main — sans message, sans promesse tenue sur l'état conservé.

## 2. Le correctif (localisé)

- **`src/trunk/AppErrorBoundary.tsx`** (neuf) : `getDerivedStateFromError` bascule sur une UI de
  reprise — **« L'application s'est arrêtée »**, phrase d'honnêteté (« rien n'est perdu, l'état est
  conservé côté serveur »), boutons **Recharger** (onglet propre) et **Réessayer** (réarme la
  frontière sans perdre la session). `componentDidCatch` **journalise** le défaut (une frontière
  masque l'écran blanc, jamais le défaut). Vocabulaire de design only (`body`/`.cardbox`/`.btn`/
  `.eyebrow`/`.sub`), monochrome, accent réservé à la confiance.
- **`src/main.tsx`** : l'app est enveloppée `<AppErrorBoundary><TrunkAppV13 /></AppErrorBoundary>`,
  et un listener `unhandledrejection` journalise les promesses rejetées non gérées (elles
  n'arrêtent pas l'app, mais restent un défaut à corréler).

## 3. Preuves

- **Comportement (jsdom réel)** `src/trunk/AppErrorBoundary.test.tsx` (3) : un enfant qui lève →
  l'UI de reprise s'affiche (et **pas** le contenu normal) ; un enfant sain → **pas** d'UI d'erreur ;
  « Réessayer » réarme. Rendus par `createRoot` réel, pas de mock.
- **Câblage (source)** `src/trunk/app-error-boundary-wiring.test.ts` (2) : `main.tsx` monte bien
  l'app **sous** la frontière, et journalise `unhandledrejection`. **Falsifié** : frontière retirée
  de `main.tsx` → **1 échec** ; restaurée → 5/5. *Une frontière jamais montée serait une couche
  orpheline.*
- **Intégration (navigateur A/B)** `scripts/prove-error-boundary.mjs` (`npm run proof:error-boundary`) :
  - **P1** : l'app démarre normalement **avec** la frontière (dock rendu, 0 `pageerror`).
  - **P2** : le bundle servi contient la copie de reprise.
  - **LOCAL** (frontière livrée) → **PASS** ; **PROD** (bundle sans frontière) → **P2 FAIL**. La
    preuve **peut échouer** : elle prouve le correctif, pas sa propre cohérence.
- **Batterie** : **994/994** tests, `tsc` 0, 5 gardes vertes. Le garde `copy-no-emdash` a **attrapé
  une vraie faute** (un tiret cadratin dans un log) pendant la rédaction — corrigé, pas contourné.

## 4. Résidu honnête

- La frontière couvre les **exceptions de rendu** et **journalise** les rejets de promesse ; elle ne
  **prévient pas** les pannes (elle change une page blanche en reprise honnête). Aucune remontée
  distante (Sentry) : `console.error` seulement — pas de nouvelle dépendance en Heartwood.
- La **reproduction naturelle** d'un lancer de rendu en prod n'a pas été capturée (la classe
  `r.on2` a été corrigée) : la preuve porte sur le mécanisme installé + le bundle livré.
- **`T-07d`** non franchi tant que le push est bloqué (jeton GitHub expiré en session).
