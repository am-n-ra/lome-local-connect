# Handoff — vérité des notifications & du plan Pro (2026-10-15)

Retour fondateur : « VAPID est configuré et les users recevaient déjà les notifications » ·
« auto availability est dans le plan pro uniquement ? » · « est-ce que onboarding et page des
plans expliquent tout ceci à nos users ? »

## 1. VAPID — le fondateur a raison, ma note était FAUSSE

| Mesure | Résultat |
|---|---|
| `GET /api/v2/notifications/push-key` **en prod** | **200**, `configured:true`, clé publique `BHJnL3-iT99…` |
| `v2_notification_deliveries` (canonique), canal `web_push` | **4 `delivered`**, dernière **2026-10-15T16:13:38Z** |

J'avais écrit « VAPID non configuré → `configured:false` ». **Faux**, et contredit par `WP-1`
— une ligne **antérieure et juste** du **même** `current-state.md` (« VAPID posé en Production,
`configured:false → true` »). **Leçon : une ligne neuve peut écraser une vérité déjà consignée.
Relire la ligne voisine du document d'état avant d'écrire un résidu de tranche.**

## 2. `in_app` reste `queued` — par conception

`listPendingPushDeliveries` filtre `channel='web_push'` : le drain ne dépile **que** le push.
Le centre in-app lit `v2_notification_events` (+ `seen_at` au tap), jamais la livraison.
5 livraisons `in_app` en `queued` avec `attempt_count=0` = **état normal** d'un canal sans file.

## 3. Auto disponibilité — OUI, Pro uniquement, gardé DES DEUX CÔTÉS

| Couche | Garde |
|---|---|
| UI | `autoEligible = facilityProducts.some(p => p.availabilityProEligible)` (`SellerV13:426`) ; sinon « Réservé aux facilités Pro actives. » |
| Serveur | `setProductAutoAvailability` exige un entitlement `facility_pro` **`state='active' and ends_at > now()`**, lié **lieu OU entité** (`trunk-repository.ts:3762`) → `FORBIDDEN_OR_PRO_REQUIRED` |

Même garde sur `refreshProductAvailability`. La bascule par produit
(« Auto ON/OFF · Activer/Désactiver · Actualiser ») est donc **Pro-gated et honnête**.

## 4. Ce que l'utilisateur lit — MESURÉ

| Surface | Dit | Manque |
|---|---|---|
| `PlansCompareV13` vendeur | « Disponibilité en direct : Manuelle / **Automatique** » · « Offres : 20 max / Illimitées » · « Analytics », « Campagnes », « Bonus 20 $ » | **aucune explication du mécanisme** : conditions (stock frais, jamais partiel, abstention si négociation), que l'interrupteur est par produit, que l'offre doit être publiée + Pro |
| `PlansCompareV13` acheteur | « Recherche, favoris & **alertes** : Illimités » · « Comparateur 3 / 10 » · « Bulk 3 / 100 » | **⚠️ « alertes » = promesse sans mécanisme** (§5) |
| `WelcomeV13` étape 5 | vendeur : « Pro : offres illimitées, **dispo en direct**, campagnes » · acheteur : « Pro : 10 comparaisons, 100 demandes bulk » | idem : les **mots** sont là, **aucune** explication de ce que « direct » veut dire ni **où** on l'active |
| `WelcomeV13` | ne mentionne **jamais** les notifications (où, comment, push) | l'utilisateur doit **découvrir** l'Inbox et la permission tout seul |

## 5. ⚠️ ÉCART RÉEL trouvé — « alertes » acheteur n'existe pas (candidat `NR-10`)

Le plan acheteur (carte **et** tableau) promet « favoris + **alertes** ». Or :
- `grep` serveur `saved_search` + (`notif`|`event`|`alert`) → **0** ;
- les types d'événements qui poussent (`pushMessageFor`) sont **limités** : états de transaction
  + `transaction_intent_created` / `availability_request_created` / `availability_response_created`.

**Aucune alerte de recherche sauvegardée n'existe.** C'est la **même classe que `NR-7`** (une
capacité **affirmée** au client sans producteur), sauf qu'ici elle vit dans la **page des plans**
— l'écran où l'on **décide de payer**. À trancher par le fondateur : **construire** l'alerte
(recherche sauvegardée → événement quand une offre correspond) **ou retirer le mot**.

## Décisions fondateur demandées

1. **`NR-10`** : « alertes » acheteur — **construire** le producteur (dépend de `NR-9`/S-21) ou
   **retirer** le mot des deux surfaces ? (Recommandé : construire, c'est une vraie promesse Pro.)
2. **Expliquer le plan** : ajouter à la page des plans une phrase par capacité Pro vendeur
   (auto = par produit, stock frais, jamais partiel, abstention si négociation) ?
3. **Onboarding notifications** : l'écran d'accueil doit-il dire **où** vivent les notifications
   et **quand** la permission est demandée ? (aujourd'hui : jamais mentionné).

## Résidus honnêtes

- Preuve navigateur sur **appareil réel** (notification native reçue, tap → bonne feuille) reste
  **manuelle** — le push est **prouvé côté serveur** (`delivered` ×4) et par le comportement de
  `push-key`, pas par une capture FCM.
- `in_app queued` : état normal, **pas** un défaut à corriger.
