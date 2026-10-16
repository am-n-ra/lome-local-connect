# D-TXN-3a / D-TXN-3b — Expiration d'une transaction verrouillée : options pour décision fondateur

Date : 2026-10-15 · Branche `omni-v2-rebuild` · Porte **BRANCHES** · Plan `NW-PROD-OMNI-TXN-02` (T-G2)
Statut : **décision requise** — aucune ligne de code écrite avant l'arbitrage.

> Le contrat du 2026-09-16 (`omni-transaction-flow-state-contract-2026-09-16.md`, §3 D-TXN-3)
> proposait « intention non verrouillée : 48 h ; transaction verrouillée stagnante : 72 h →
> libère la réservation / **rembourse le wallet** ». **Cette formulation n'est pas vérifiée par le
> code** : il n'y a **rien à rembourser dans le wallet**. Les options ci-dessous partent des faits
> mesurés, pas de la proposition d'origine.

## 1. Vérité mesurée (2026-10-15) — ce qui est réellement « engagé »

| Fait | Évidence |
|---|---|
| **Une transaction ne débite PAS le wallet.** Les seuls débits de ledger sont `ad_spend`, `bonus_spend`, `buyer_pro_spend`, `facility_pro_spend`, `slot_spend` | `grep "_spend"` sur `trunk-repository.ts` → 5 kinds, **aucun** lié à l'achat |
| **L'argent circule en externe**, déclaré puis confirmé (FedaPay) | `declareExternalPayment` / `confirmExternalPayment` — `v2_external_payment_declarations` |
| **Le seul actif serveur retenu** par une transaction = **la réservation de stock** (`quantity_reserved_omni`) | incrément `6682` (intention), libération au sweep `8131` (pré-verrou) et à la notation `4576` (`closed`) |
| **Le sweep EXCLUT le verrouillé** : `and not exists (… e.state = 'qr_verified')` | `trunk-repository.ts:8106-8111` |
| **Donc, après `qr_verified`, le stock n'est plus jamais libéré que par la clôture.** Abandonner une transaction verrouillée retient la réservation **pour toujours** | conséquence directe de la ligne précédente |
| **Zombies réels en base** : 5 transactions verrouillées (août/septembre : `payment_confirmed`, `fulfilled`×2, `received`) **jamais clôturées**, `intent.state = 'active'` | mesure canonique `br-dawn-hill-am5amy22` |
| **Aujourd'hui, une transaction `qr_ready` tient `quantity_reserved_omni = 1`** sur un produit alloué à 1 | mesure canonique (2026-10-15) |

**Ce que ça change :** la question n'est **pas** « qui est remboursé » (personne — le wallet est intact)
mais **« combien de temps un verrou abandonné retient-il le stock de quelqu'un d'autre »**.

## 2. D-TXN-3a — avant le verrou (Phase A)

**Déjà en place, rien à décider :** la demande de disponibilité meurt à **`expires_at` (15 min)** ;
le sweep expire les intentions inactives au-delà de **60 min** (`windowMinutes`), libère le stock,
écrit l'événement `expired` et **notifie les deux parties** (TXN-G7).

**Option A1 — garder tel quel (recommandé).** 15 min de demande / 60 min d'intention. Fenêtres
courtes = l'acheteur sait, le vendeur est notifié, l'échelle pilote (Lomé, commerce de rue) valorise
une réponse rapide. **Coût : aucun.** Trade-off : un vendeur lent perd la demande (mais il est notifié).

**Option A2 — allonger l'intention à 24-48 h** (proposition d'origine). Favorise les vendeurs qui ne
sont pas devant leur téléphone. **Coût :** un stock réservé plus longtemps sur une intention jamais
confirmée. À retenir seulement si le terrain montre des vendeurs qui répondent tard.

## 3. D-TXN-3b — après le verrou (Phase B) : le cœur de la décision

**Trois options.** Le critère de partage n'est pas l'horloge seule, c'est **l'engagement réel**.

### Option B1 — Ne jamais expirer automatiquement (le verrou est sacré)
- Conforme à **D-TXN-1** (« le verrouillé doit aller au bout »).
- Une transaction verrouillée stagnante est **signalée** (surface opérateur / journal), jamais mutée
  par la machine.
- **Contre :** le stock reste réservé **indéfiniment** (mesuré : 5 zombies depuis août). Le vendeur
  ne peut plus vendre son unité parce qu'un acheteur a scanné puis disparu. **C'est le défaut réel
  le plus coûteux pour un vendeur.**
- **Coût :** surface opérateur (nouvelle) + une politique d'escalade humaine.

### Option B2 — Expirer symétriquement après verrou (libérer le stock)
- Le sweep étend sa règle au verrouillé : après N jours d'inactivité, `expired` + libération.
- **Faux :** si l'acheteur **a payé** (externe) et que le vendeur n'a pas confirmé, expirer
  **déclarerait morte une transaction payée** et libérerait un stock déjà vendu. Contredit D-TXN-1.
  **Non recommandée.**

### Option B3 — Expirer **seulement si aucun argent n'a bougé** (recommandée)
La règle se lit sur un **fait**, pas sur une durée seule :

- **Verrouillé + AUCUNE déclaration de paiement** (`v2_external_payment_declarations` vide) + N jours
  d'inactivité → **expiration serveur** : événement `expired`, **libération du stock**, notification
  des deux parties (même mécanique que TXN-G7). Justification : rien n'est engagé côté argent ;
  retenir le stock d'un vendeur est injustifié.
- **Verrouillé + paiement déclaré/confirmé** → **jamais d'expiration automatique**. On **escalade**
  (surface opérateur / journal), parce qu'un humain doit trancher (litige = D-TXN-5, hors V1).
- **La fenêtre N est ta décision** (proposer **72 h** comme défaut, aligné sur le contrat).
- **Coût :** une branche de plus dans le sweep + notification + (au choix) une liste opérateur.
- **Trade-off honnête :** si un acheteur a scanné, s'est engagé, mais paie hors ligne sans déclarer,
  il perd sa réservation au bout de N jours. Acceptable : il n'a rien déclaré, et le vendeur est
  prévenu avant.

## 4. Ce qui ne se décide PAS ici (frontières)

- **Litige / cancel mutuel** = **D-TXN-5**, opérateur, **hors V1** (Gate 7). B3 n'ouvre pas le litige.
- **Aucune écriture de code** tant que B1/B2/B3 n'est pas tranchée.
- **Le stock libéré n'est jamais « rendu » à un wallet** : il n'y a pas de débit wallet à annuler.

## 5. Recommandation de l'agent

**D-TXN-3a = A1** (garder 15 min / 60 min) · **D-TXN-3b = B3** (expirer le verrouillé **sans argent**,
escalader dès qu'un paiement est déclaré), fenêtre **72 h**.

Raison : c'est la **seule** option qui libère le vrai actif retenu (le stock) **sans** commettre
l'erreur de tuer une transaction payée, et qui respecte D-TXN-1 pour tout ce qui est réellement
engagé. C'est aussi la moins chère : elle réutilise la mécanique TXN-G7 déjà prouvée.

## 6. Si tu valides

Séquence : (1) tu tranches B1/B2/B3 + la fenêtre ; (2) tranche `T-G2` code le sweep + la
notification + un test SQL réel sur branche jetable (+ falsification) ; (3) si escalade retenue, une
tranche séparée pour la liste opérateur (nouvelle surface → ordre séparé).
