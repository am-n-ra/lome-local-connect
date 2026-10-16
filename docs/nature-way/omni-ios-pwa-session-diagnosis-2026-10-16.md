# Session perdue sur iPhone **en PWA** — diagnostic mesuré

> Porte : `HEARTWOOD_CLOSED_BRANCHES_OPEN` (Branches). Classe : **auth/session cross-site**.
> Rapport fondateur : « dans le navigateur PC ou mobile ou même PWA sur PC je me connecte et
> j'accède à mes demandes/historique ; **sur mon iPhone dans la PWA, ça me redemande de me
> connecter**. »

## Ce n'est PAS le bug P3 (déjà corrigé)

`P3` (2026-10-16) traitait le **rebouclage UI** : `requireAuth` re-demandait la connexion à un
utilisateur dont `sessionUser` existait déjà, parce que l'échange de jeton échouait de façon
transitoire. Corrigé par réessai + garde `if (sessionUser) return null`.

Ici, `sessionUser` est **réellement absent** au démarrage : la session n'est jamais restaurée.
Le symptôme se ressemble, la cause est **différente**. Chasser le même correctif aurait été une
erreur de classe.

## Cause racine (mesurée)

**L'auth vit sur un domaine TIERS.** Le bundle prod appelle :

```
https://ep-plain-butterfly-amn21o8h.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth
```

depuis l'app sur `https://omni.sparkafrika.online`. Ce sont **deux domaines enregistrables
différents** → toute requête vers l'auth (connexion, `get-session`, `/token`) est **cross-site**,
et le cookie de session est un **cookie tiers**.

Preuves :
- `src/auth.ts` : `fetch(authUrl + '/token', { credentials: 'include' })` — cookie cross-site.
- Les harnais de preuve (`scripts/prove-*.mjs`) **injectent** la session avec `sameSite: 'None'` —
  l'auteur a donc observé un cookie tiers `SameSite=None`. ⚠️ **Valeur exacte non re-mesurée ici** :
  un `Set-Cookie` réel exige un login réussi (credentials non disponibles au sandbox). Le fait
  **mesuré** est l'**origine tierce** ; `SameSite=None` en est la conséquence cross-site attendue.
- CORS répond `Access-Control-Allow-Origin: https://omni.sparkafrika.online` +
  `Allow-Credentials: true` — donc le serveur **attend** un cookie tiers.

**WebKit (Safari/iPhone) bloque les cookies tiers via ITP.** Et en **PWA standalone**, le contexte
est le plus strict : il n'y a **aucune navigation de premier niveau** vers le domaine d'auth (pas de
barre d'adresse, pas de visite « directe » du domaine) qui pourrait donner une exemption ITP. D'où :

| Contexte | Cookie tiers | Résultat |
|---|---|---|
| Navigateur desktop Chrome/Firefox | toléré (ou partitionné mais accepté) | session OK |
| Navigateur mobile Android | toléré | session OK |
| PWA desktop (Chrome) | toléré | session OK |
| **Safari iPhone (onglet)** | souvent toléré si interaction récente | **non mesuré ici** (hypothèse) |
| **PWA iPhone (standalone)** | **bloqué (ITP, zéro exemption)** | **session jamais restaurée → « se connecter »** |

⚠️ **Honnêteté** : la seule ligne **rapportée par le fondateur** est la PWA iPhone. Les autres
lignes sont la conséquence attendue de l'origine tierce, pas des mesures faites sur ses appareils.
S'y ajoute un fait WebKit connu : la PWA ajoutée à l'écran d'accueil a historiquement un
**conteneur de stockage distinct** de Safari — ce qui aggrave l'effet sans le créer.

La différence **iOS navigateur vs iOS PWA** s'explique par ce point précis : l'onglet Safari a une
relation de premier niveau avec le domaine ; la PWA standalone, non.

## Pourquoi ce n'est pas corrigeable côté app seule

Aucun code client ne peut lire un cookie que le navigateur refuse de poser. Réessayer `get-session`
(ce que fait P3) ne sert à rien quand il n'existe aucune session à lire. Le remède doit rendre
l'auth **same-site**.

## Deux remèdes, par ordre de préférence

### Option A — domaine personnalisé Neon sur un sous-domaine de `sparkafrika.online` (RECOMMANDÉ)

Faire servir l'auth depuis **`auth.sparkafrika.online`** au lieu de `*.neon.tech`. Le cookie devient
`Domain=.sparkafrika.online` = **même site** (même eTLD+1) → **plus de cookie tiers**, ITP ne le
bloque pas. Ensuite poser `VITE_NEON_AUTH_URL=https://auth.sparkafrika.online/...`.

- **Avantages** : correct pour toutes les plateformes, aucune réécriture de cookie, aucun code
  serveur d'auth à maintenir, garde `HttpOnly`.
- **Coût** : action plateforme fondateur (Neon Console → domaine personnalisé + DNS CNAME).
  Aucun `NEON_API_KEY` dans l'env sandbox → non automatisable d'ici.
- **Risque** : faible. Réversible (revenir à l'URL `neon.tech`).

### Option B — proxy same-origin dans l'app (fallback, plus de code)

Une fonction serverless en `/api/v2/auth/*` qui relaie vers le host Neon et **réécrit les en-têtes
`Set-Cookie`** (retirer `Domain=`, forcer `SameSite=Lax` + `Secure`, garder `HttpOnly`). Le
navigateur voit alors un cookie **first-party** sur `omni.sparkafrika.online`.

- **Avantages** : aucun DNS, entièrement dans le dépôt.
- **Inconvénients** : il faut proxifier **toutes** les routes d'auth (sign-in, sign-up, token,
  get-session, otp, reset…), et **ne jamais casser `HttpOnly`** ni la vérification de signature. Un
  `rewrite` Vercel seul **ne suffit pas** (il ne réécrit pas `Set-Cookie` → le `Domain=…neon.tech`
  serait rejeté). C'est un **chemin d'auth sécurité-sensible** : il exige sa propre tranche avec
  preuve navigateur réelle sur iPhone.
- **Risque** : plus élevé (surface d'authentification réécrite à la main).

## Décision requise

**A** (domaine personnalisé, recommandé — le fondateur le pose, l'app change une variable) ou
**B** (proxy same-origin, tranche de code sécurité-sensible) ?

Aucune des deux n'est un « quick fix » : la première est une **action plateforme**, la seconde une
**tranche dédiée**. Ne pas empiler sur P3.

## Ce que ce diagnostic a écarté (mesuré)

- **Service worker** : ignore le cross-origin (`sw.js` L24 : `origin !== self.location.origin`) →
  n'entre pas en jeu.
- **Manifest PWA** : correct (`display: standalone`, `scope: /`, icônes). Pas la cause.
- **Le jeton** : jamais persisté sur disque (`setAuthToken` = state mémoire) — par conception,
  le cookie `HttpOnly` est la seule source. Confirme que sans cookie, il n'y a rien à restaurer.
