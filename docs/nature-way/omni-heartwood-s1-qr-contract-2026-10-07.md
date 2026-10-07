# Contrat Heartwood S1 — QR réel (scannable) · `NW-PROD-OMNI-HEARTWOOD-01`

> **Porte :** Heartwood OPEN (`TRUNK_CLOSED_HEARTWOOD_OPEN`) · **Autorité :** `/nature-way` · **Owner :** Nature Way (relais).
> **As of :** 2026-10-07 · **Loi :** contrat avant code.

## 1. Problème mesuré (pas supposé)

| Surface | Rendu actuel | Fichier |
|---|---|---|
| `BuyerFlowV13` (stage `qr`) | `qrStyle(payload)` = **blocs `█/▓`** (décor) — pas un QR | `BuyerFlowV13.tsx:504` |
| `TransactionRoom` (buyer) | le **payload en texte brut** — pas un QR | `TransactionRoom.tsx:191` |

Or le vendeur scanne avec `html5-qrcode` (`SellerQrScannerSheet`) qui attend un **vrai QR** décodant
`transactionId:token`. Aucune des deux surfaces ne produit d'image scannable → **le vendeur ne peut que
coller le code à la main**. Le cœur du verrou transactionnel (scan QR = verrou) est donc **contourné**.

Le payload lui-même est **correct** : `qrPayload(transactionId, token)` = `"<uuid>:<base64url(32o)>"`
(≈ 80 caractères) — largement scannable (version QR faible densité). Il ne manque que **le rendu**.

## 2. Décisions de contrat

- **S1-C1 — Rendu scannable.** Toute surface QR rend `QRCodeSVG` de `qrcode.react@4.2.0` (déjà en
  dépendance) sur `qrPayload(transactionId, token)`. Pas de dépendance nouvelle.
- **S1-C2 — Corriger les DEUX surfaces cassées** (`BuyerFlowV13` + `TransactionRoom`). La Room
  n'omettait pas seulement l'encodage : elle affichait le secret en clair **en plus** — le QR remplace
  ce bloc.
- **S1-C3 — Garder le payload en texte sous le QR** (`.tiny.muted`, copiable) en **fallback** : si la
  caméra échoue, le collage manuel reste possible. On ne *retire* pas le filet, on *ajoute* le chemin
  nominal.
- **S1-C4 — Contraste = contrat de scannabilité.** Le QR doit être **modules sombres sur fond clair**.
  Le conteneur `BuyerFlowV13` actuel est `background: var(--ink)` (encre) → **inversé** ; corrigé en
  **blanc** avec modules `--ink` `#0f0f0f`. Un QR clair-sur-sombre se lit mal ou pas du tout.
- **S1-C5 — Monochrome (design.md §30).** QR en `--ink` sur blanc, **jamais** l'accent `#2E8B6F`
  (réservé à la confiance). Aucun nouveau jeton.
- **S1-C6 — Un seul composant `OmniQr`.** `src/trunk/OmniQr.tsx` encapsule l'encodage, la taille, la
  quiet-zone et le `aria-label="QR Omni"` ; importé par les deux surfaces → **une seule définition**,
  impossible qu'elles divergent (même règle que `qrPayload`, déjà centralisé dans `api.ts`).
- **S1-C7 — Niveau de correction `M`** explicite (robuste au flou main-à-main ; payload court donc
  densité faible de toute façon).
- **S1-C8 — Hors périmètre de S1 (slice suivante) :** le QR **public de l'entité** (S-21, « Afficher
  mon QR public » côté vendeur) est une **capacité neuve**, pas une surface cassée. S1 = rendre
  **scannable ce qui existe**. S1b = le QR public.

## 3. Preuve exigée

- **Garde falsifié** (`omni-qr.test.tsx`) : le rendu contient un `<svg>` QR et **plus** les blocs
  `█/▓` ; `OmniQr` est importé par **les deux** surfaces. Falsifier : réintroduire `qrStyle` → échec.
- **Preuve navigateur** : le QR acheteur est un `<svg>` de > 100 modules, contraste sombre-sur-clair.
- **Décodage** : décoder le SVG produit doit redonner `transactionId:token` (preuve que le payload
  encodé est celui que le scanner attend).

## 4. Non-goals

- Pas de QR public entité (S1b), pas de changement de payload/format, pas de changement de TTL,
  pas de refonte du scanner vendeur (il est correct).
