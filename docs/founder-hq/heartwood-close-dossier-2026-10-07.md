# Dossier de clôture — Heartwood (2026-10-07)

> **Porte :** `TRUNK_CLOSED_HEARTWOOD_OPEN`. **Objet :** durcir/fermer le tronc (pas de nouvelle fondation).
> **Règle :** *livrer ne clôt pas* — seule une **décision fondateur enregistrée** clôt la porte.
> Ce dossier est le paquet de preuves soumis au fondateur ; il ne prononce **pas** la clôture.

## 1. Les 5 items de fermeture mesurés le 2026-10-07 — état

| # | Item | Mesure initiale | Résolution | Preuve |
|---|---|---|---|---|
| 1 | **QR réel** | `qrStyle()` dessinait des blocs `█/▓` (décor), pas un QR | **`S1` LIVRÉ** (`dbec13a`) — `OmniQr` partagé, vrai QR ; **`S1b` LIVRÉ** (`d9c6e13`, option a) — QR public d'entité (S-21) | décodage réel `jsqr` **3/3** → `txn:token` ; S1b `jsqr` → `parseEntityIdFromQr` → `getPublicEntity` « Omni Demo Seller Hub » **−10 %** ; gardes falsifiés ; prod === local |
| 2 | **Argent réel E2E** | aucun parcours prod réel *dans cette session* | **Re-classé `candidate`** — fondateur : **FedaPay déjà prouvé par le passé** (txn `113034942` créditée, ledger `fedapay:*`) | code présent (webhook + `extractFedaPayTransaction` + `reconcileWalletRecharge`) ; **pas un manque** ; « re-prouver » = geste fondateur optionnel |
| 3 | **Téléphone gratuit** | S-16 tranché ; seul code = e-mail+mdp | **`S3-a` LIVRÉ** (`4c2d69c`+`00c954f`) — numéro Togo **déclaré** (jamais « vérifié ») + `wa.me` gratuit, **à l'inscription et dans le Compte** | migration `069` (canonique, `e3c60c62…`) ; preuve Postgres réel **6/6** ; bug réel corrigé (snapshot) ; 2 gardes falsifiés |
| 4 | **Ambulants** | type `mobile` existe, non exposé, filtre `soon` | **`S4` LIVRÉ** (`db71847`) — `facilityType`/`rayonKm` exposés (carte+fiche), chip `Transport (mobile)` activée, marqueur ambre | SQL réel **33/33** ; gardes falsifiés ; prod sert `facilityType` ; **données 0 `mobile`** (honnête : rien déclaré) |
| 5 | **OSM Togo** | borné Lomé (`west > 0`), décision Neon free | **Décision close** — pas un écart | — |

**Aucun des 5 items ne reste ouvert comme dette de code.** Les deux « decisions » (2 et 5) sont closes ;
les trois écarts réels (1, 3, 4) sont corrigés et prouvés.

### 1 bis. Dette trouvée par le spot-check occlusion X5 — `DOCK-DUP` : **CLOS**

Le spot-check `f5f9749` avait nommé `DOCK-DUP` (jumeaux `.navpill` empilés) en laissant la **cause à
localiser en code**. Localisée et corrigée (`fb9dc2d`) : la div du dock portait `key={role}`, or c'est
un **enfant unique non keyé** de la scène — changer sa clé fait **fuir** le nœud DOM au lieu de le
réconcilier (1 → 2 → 3 jumeaux, labels a11y dupliqués). **Preuve A/B** (`scripts/probe-dock-dup.mjs`,
1280px) : `key={role}` → `menu=2 role-buyer=3` ; clé **constante** ou **absente** → 1 partout. Correctif :
clé retirée + garde `dock-dup-guard.test.ts` (falsifié). Probe **FAIL** sur build buggé / **PASS** sur
corrigé, **local et prod** ; prod `index-BVdehrpJ.js` === local (T-07d ✅). Détail : `handoff-receipt-HO-OMNI-35.md`.

## 2. Ce qui est prouvé (prod, T-07d)

- **`S1`** (`dbec13a`), **`S1b`** (`d9c6e13`), **`S4`** (`db71847`) : prod === build local, routes en
  ligne, chaînes présentes dans le bundle servi.
- **`S3-a`** (`4c2d69c` puis `00c954f`) : prod `index-GEXQxan9.js` === local (**T-07d ✅**) ; déploiement
  GitHub Production confirmé ; `POST /api/v2/account/phone` → **401** anonyme ; chaînes d'honnêteté
  (« Téléphone (optionnel) », « Déclaré · non confirmé », « Omni ne vérifie pas ce numéro ») servies.
- **Batterie** : **910/910** tests, `tsc` 0, 7 gardes vertes (`state`/`docs`/`coherence`/`live-surface`/
  `boundary`/`dead-css`/`maquette`).

## 3. Résidus honnêtes (à ne pas cacher)

- **`S2` (argent réel E2E)** : non exercé **dans cette session** — exige une session fondateur
  (credentials). FedaPay a été prouvé par le passé ; le parcours complet « recharge → Pro seller →
  Pro buyer → packs → bonus » en prod n'est pas re-montré ici. **Geste fondateur, pas un manque de code.**
- **Preuve navigateur** des formulaires (S3-a inscription/Compte) non capturée — sandbox sans session
  réelle. Contrat prouvé unitairement + en base + au niveau bundle.
- **Données `mobile`** : 0 vendeur de type `mobile` déclaré (S4 expose la capacité, la donnée est vide —
  c'est un **acte vendeur**, pas un manque de code).
- **Slices hors périmètre Heartwood** (non bloquantes, jamais ouvertes) : Branches/Canopy/Ring ;
  terrain (`TT-1`/`TT-2`/Gate 7) **en dernier** par décision fondateur.

## 4. Décision demandée

**Le fondateur peut-il clore Heartwood ?**

- Si **oui** → porte suivante **Branches** (ou Canopy) s'ouvre ; je n'ouvre **rien** avant la décision.
- Si **non** → dire **quel item** reste, et il devient la prochaine slice (pas de slice inventée).
- **`S2`** : si le fondateur veut re-prouver FedaPay en session, c'est le seul geste restant.

> **Note de méthode :** ce dossier est un **paquet de preuves**, pas une auto-clôture. `check:state`
> exige que `current-state.md`, le board et le master plan restent d'accord avec la porte
> `TRUNK_CLOSED_HEARTWOOD_OPEN` tant que le verdict n'est pas rendu.
