# Heartwood S1b — QR public d'entité (S-21), périmètre (a) — contrat

> **Porte :** Heartwood OPEN (`TRUNK_CLOSED_HEARTWOOD_OPEN`) · **Local Plan :** `NW-PROD-OMNI-HEARTWOOD-01`
> **Décisions fondateur (2026-10-07) :** « a » (périmètre complet) ; FedaPay **déjà prouvé** (S2) ;
> téléphone = **gratuit** (S3, méthode à confirmer). **Aucune nouvelle fondation** ici : l'avantage
> Omni (`discount_percent` + trigger `enforce_product_discount`, Seed **S-19**) **existe déjà**.

## 1. Ce que le Seed engage (S-21)

> « Un client **déjà en boutique** scanne le **QR public de l'entité** → la transaction passe par
> Omni → **remise appliquée**. Le monde physique devient un point d'entrée Omni. »

Trois exigences : **(1)** un QR public **par entité** existe et est **affiché en boutique** ;
**(2)** l'acheteur le **scanne** (caméra ou saisie) ; **(3)** la page ouverte annonce **l'avantage
Omni** (la remise) — et **payer via Omni l'applique**. Le cœur est **la remise au scan**.

## 2. Décisions de contrat

- **S1b-C1 — Un seul QR public, encodé par entité.** Payload `https://omni.sparkafrika.online/?entity=<uuid>`
  (même origine que `retour`/routes ; paramètre **`entity`**, distinct du paramètre **`facility`** de
  `PublicQrScannerSheet`). `entityQrPayload(id)` est **partagé** avec le scanner (comme `OmniQr` pour S1)
  pour que le rendu et le décodeur ne divergent jamais.
- **S1b-C2 — Un scanner, deux cibles.** `PublicQrScannerSheet` gagne `target: 'facility' | 'entity'`
  (défaut `facility`, comportement inchangé). La cible `entity` décode `?entity=` / uuid brut via un
  `extractEntityId` **calqué** sur `extractFacilityId`. Le dock acheteur « Scanner une entité » ouvre
  la cible `entity` ; la sheet `qr` historique reste `facility`.
- **S1b-C3 — Le choix in-store : entité ou lieu.** Une entité peut avoir **plusieurs lieux** ; le QR public
  encode **l'entité** (le Seed le dit). Scanner ouvre donc la **page d'entité** (`openEntity`), qui liste
  **ses offres** ; toucher une offre ouvre sa fiche (route existante). Aucune nouvelle route.
- **S1b-C4 — « Vos avantages Omni ici » = la remise RÉELLE.** La page d'entité lit le **meilleur
  avantage Omni** parmi les offres publiées de l'entité (`max` des `discount_value` **pourcentage**),
  et l'affiche (`−15 %`). Si l'entité n'a **aucun** avantage : la zone **se tait** honnêtement
  (pas de faux « −15 % »). Monochrome ; l'accent `#2E8B6F/#EEF4F1` reste **réservé** au pourcentage
  affiché (design.md §30 — c'est le seul « gain » montré, même règle que la maquette `entity-from-qr`).
- **S1b-C5 — Le vendeur affiche son QR public.** `CompanyV13` groupe **déjà** par `entityId` : chaque
  carte d'entité gagne un bloc **« QR public — affichez-le en boutique »** (`OmniQr` + l'URL + le
  geste attendu). Aucune surface maquette « impression » : on ne l'invente pas (l'impression est
  un geste navigateur, hors app). **Honnêteté :** le QR encode l'entité ; le vendeur multi-lieux
  n'a **qu'un** QR (la remise est au niveau offre/entité, cohérent Seed).
- **S1b-C6 — L'entrée existe aussi au menu.** Le menu acheteur gagne **« Scanner un QR »** (maquette
  L1559), qui ouvre le même scanner (cible entité). Le dock garde son item existant.

## 3. Preuve exigée

- **Garde falsifié** `entity-qr.test.ts` : `entityQrPayload`/`parseEntityIdFromQr` round-trip ;
  un payload **facility** ne doit **pas** être lu comme une entité (et vice-versa) ; falsification
  (casser le paramètre `entity` → échec).
- **Garde falsifié** `entity-benefits.test.ts` : la page dit l'avantage réel quand il existe, et
  **se tait** quand il n'y en a pas (jsdom sur le rendu réel).
- **Garde falsifié** `company-qr.test.tsx` (jsdom) : `CompanyV13` rend un `svg` de QR par entité ;
  falsification (retirer le bloc → échec).
- **Preuve navigateur/dom** `scripts/prove-heartwood-s1b.mjs` : décoder le SVG vendeur (`jsqr`) →
  relecture du payload → `parseEntityIdFromQr` → **l'entité obtenue par `getPublicEntity`** et son
  avantage. (Même méthode que S1 : mesurer un QR par **sa lisibilité par un décodeur**, pas par sa forme.)

## 4. Hors périmètre (dit, pas caché)

- **Application de la remise au paiement** : elle vit dans le flux transactionnel (l'offre porte
  déjà `prixReduit`/`pourcentageReduction` ; le paiement enregistre un moyen déclaré). S1b **expose**
  l'avantage et **route** vers l'offre remisée — il ne réécrit pas le moteur de prix.
- **QR par lieu** : non modélisé (le Seed nomme le QR **de l'entité**).
- **Impression PDF** : geste navigateur, hors app.
