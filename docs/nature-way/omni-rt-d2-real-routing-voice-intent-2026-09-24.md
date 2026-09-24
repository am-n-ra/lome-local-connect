# Omni — `RT-D2` (décision fondateur) : vrai itinéraire, guidage vocal, débloqué après intention réelle

> **Décision fondateur (2026-09-24) :** *« pas de vol d'oiseau — usons ce qui doit être pour avoir un vrai
> itinéraire avec même peut-être un guidage vocal, peut-être juste comme j'avais dit on va rendre ça
> accessible uniquement après intent réel d'achat. »*
>
> **Statut : DÉCISION ACTÉE.** Elle clôt `RT-D1` (fournisseur) **et** la contradiction `D-ROUTE-3`
> (l'itinéraire est-il ouvert sur la fiche, ou verrouillé jusqu'à l'intention ?).
> **La maquette Species (S11/S22/S23/S25/S33) avait raison** — elle disait verrouillé jusqu'à
> l'intention. La correction du 2026-09-14 (itinéraire ouvert) est **remplacée** par cette décision.

---

## 1. Ce qui est décidé — trois choses, pas une

| # | Décision | Conséquence |
|---|---|---|
| **1** | **Vrai itinéraire routier** — turn-by-turn, plus jamais la ligne droite | un **fournisseur** de routage est requis (les tuiles ne le fournissent pas) |
| **2** | **Guidage vocal** | le fournisseur doit produire des **instructions** ; la voix se joue côté client |
| **3** | **Débloqué UNIQUEMENT après intention réelle d'achat** | le verrou d'intention devient **le** mode d'accès — plus d'aperçu anonyme |

## 2. « Usons ce qui doit être » — l'état exact du code (vérifié, pas supposé)

**Le routage réel existe déjà. Il est éteint par configuration, pas par manque de code.**

`src/server/routing-adapter.ts` supporte **deux** fournisseurs :
- **Mapbox** — instructions `language=fr` (localisées par le fournisseur), TTL de cache, etc.
- **OSRM** (auto-hébergeable) — `OSRM_BASE_URL`

`activeRoutingProvider()` : **Mapbox gagne si `MAPBOX_ACCESS_TOKEN` est posé**, sinon OSRM.

**Les trois variables qui réalisent votre décision — ce sont des actions de configuration, pas du code :**

| Variable | Ce qu'elle fait | Pourquoi |
|---|---|---|
| `MAPBOX_ACCESS_TOKEN` | active le fournisseur réel | sans elle : `PROVIDER_NOT_CONFIGURED` (ligne droite honnête) |
| `MAPBOX_DRIVING_PROFILE=driving-traffic` | active le **trafic réel** | `driving` par défaut — le trafic est un palier facturé supérieur, donc opt-in explicite |
| `ROUTING_REQUIRE_INTENT=1` | **le verrou d'intention** (votre point 3) | sans elle, le verrou retombe sur « identité seule » |

**Jeton à utiliser (rappel) :** un **jeton public dédié (`pk.`)**, **pas** le jeton par défaut du compte,
**pas** un jeton secret. **Aucune restriction d'URL** — nos appels partent d'une fonction serverless
**sans Referer de navigateur**, une restriction d'URL casserait tout en 403. Le jeton ne doit **jamais**
atteindre le navigateur (vérifié : 0 occurrence dans le bundle client).

## 3. Le guidage vocal — où il vit

- **Les instructions** viennent du **fournisseur** (Mapbox `language=fr` produit *« Tournez à droite sur
  Boulevard du 13 Janvier »*). Le code les expose déjà (`steps`).
- **La voix** se joue **côté client** — `speechSynthesis` (Web Speech API), **coût 0**, aucun service tiers.
- **Limite honnête à vérifier :** la disponibilité de la voix française sur les **Android réels** du
  pilote n'est **pas** prouvée. Le repli est propre (texte seul), mais avant de promettre *« guidage
  vocal »*, il faut **un essai sur un appareil réel** — sinon on promet une fonction qui peut manquer.
- **Note de conduite :** on ne peut pas demander à quelqu'un de lire l'écran en conduisant. Si la voix
  manque, l'itinéraire reste **consultable avant de partir**, jamais un guidage en mouvement.

## 4. ✅ `RT-1` CORRIGÉ (2026-09-24) — le verrou fermait la porte à tout le monde

**Le critère était faux, et il fermait la fonction au moment utile.**

`hasLivePurchaseIntent` exigeait un **jeton QR vivant** :

```sql
pi.state = 'active' AND q.expires_at > now()   -- TTL du QR : 10 MINUTES
```

Or le TTL du jeton QR est de **10 minutes**. Un acheteur qui a choisi, payé, scanné — mais dont le
QR a plus de 10 minutes — était **refusé au moment précis où il a besoin de se rendre sur place**.
C'est-à-dire : **presque toujours**. État mesuré en base : **12 jetons QR, 0 vivant**.

### Le modèle réel (vérifié dans le code, et il corrige une erreur de ce document)

| Élément | Durée de vie réelle |
|---|---|
| **Intention d'achat** (`v2_purchase_intents.state='active'`) | **60 min d'inactivité** (balayage `sweepExpiredIntents`), puis `expired` |
| Intention **vérifiée par QR** | **n'expire JAMAIS** — reste `active` jusqu'à la clôture (`completed`) |
| **Jeton QR** (`v2_qr_tokens.expires_at`) | **10 minutes** |

⚠️ **Correction de ce document :** la version précédente disait *« l'intention (~24 h) »*. **C'est faux.**
Il n'y a **pas** d'`expires_at` sur `v2_purchase_intents` : sa durée de vie **est** son `state`
(60 min d'inactivité → `expired` ; `active` jusqu'à la clôture une fois vérifiée).

### La correction livrée

Le critère est désormais **`pi.state = 'active'`**, et rien d'autre. On penche volontairement du côté
de l'acheteur : mieux vaut servir un itinéraire à une intention légèrement périmée que d'en refuser un
à un acheteur engagé — même philosophie que « une panne de base ne doit pas fermer un itinéraire ».

**Règle : l'intention est une décision d'achat ; le QR est un geste de vérification. Les confondre
ferme la fonction au moment où elle devient utile.**

### Preuve (et elle échoue sur l'ancien code — sinon elle ne prouverait rien)

| État | Résultat |
|---|---|
| Test sur l'**ancien** code (avec le join QR) | ❌ **1 échec** — `expect(query).not.toContain('v2_qr_tokens')` |
| Test sur le code **corrigé** | ✅ **146/146** |
| Suite complète | ✅ **588/588** |
| Bundle serverless régénéré | ✅ `hasLivePurchaseIntent` ne joint plus `v2_qr_tokens` (vérifié dans `api/v2/availability.js`) |
| `tsc` · `check:boundary` | ✅ propres |

## 5. Le coût — garde `S-15`

Mapbox Directions : quota gratuit généreux (~100 000 requêtes/mois ≈ **3 300/jour**), puis **~2 $/1 000**.
Aucun plafond de dépense côté Mapbox → **alerte de budget obligatoire** sur le compte.

Le verrou d'intention est **aussi** un garde de coût : sans aperçu anonyme, seuls les acheteurs engagés
consomment. C'est cohérent avec votre décision — et ça répond à `S-15` (« coût marginal fondateur = 0 »)
**par le comportement**, pas par le retrait de la fonction.

**Le quota par acheteur (`057_v2_route_requests`) borne en plus la facture** — migration à appliquer
sur la branche canonique (vérifié : absente).

## 6. L'ordre d'exécution (pour ne pas casser la prod)

| # | Étape | Nature |
|---|---|---|
| **RT-1** | corriger le verrou : « intention active » ≠ « QR vivant » | **code** |
| **RT-2** | poser `MAPBOX_ACCESS_TOKEN` + `MAPBOX_DRIVING_PROFILE=driving-traffic` | **configuration** |
| **RT-3** | poser `ROUTING_REQUIRE_INTENT=1` (**après** RT-1, jamais avant) | **configuration** |
| **RT-4** | guidage vocal client (`speechSynthesis`) + essai sur Android réel | **code + essai** |
| **RT-5** | alerte de budget Mapbox + appliquer la migration `057` | **configuration + DB** |
| **RT-6** | maquette : itinéraire verrouillé jusqu'à l'intention, guidage vocal montré | **maquette** |

**Si on posait `ROUTING_REQUIRE_INTENT=1` avant `RT-1`**, on fermerait l'itinéraire à **tous** les
acheteurs engagés — exactement le piège du §4. **L'ordre n'est pas négociable.**

## 7. Ce que ça change dans Species

- **S-08 / S-12** : l'itinéraire n'est plus un « soutien » ouvert — il est **verrouillé jusqu'à
  l'intention**, avec **guidage vocal**. La maquette doit le montrer ainsi (S11/S22/S23/S25/S33
  redeviennent la référence).
- **La fiche `lieu-connaitre`** (livrée hier) reste correcte : un lieu non revendiqué n'a **pas**
  d'itinéraire, par définition.
- **Le bouton « Itinéraire » des fiches publiques** doit dire **« Requis : votre intention d'achat »**
  au lieu de tracer une ligne droite — honnête, et c'est le point d'entrée du verrou.
