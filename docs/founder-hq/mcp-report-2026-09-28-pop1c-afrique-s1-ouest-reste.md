# Rapport MCP — POP-1c-A sous-vague 1 : **Ouest restante** (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :** `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-afrique-backfill.md`.
> **Branche :** `omni-v2-rebuild`, HEAD au départ **`bad3dca`**. **Porte :** `SPECIES_CLOSED_ROOT_OPEN`.
> **Aucun secret. Aucun redeploy. Aucune variable.** Canonique identifiée **par ses données** (`br-dawn-hill-am5amy22`).

---

## A0 — Re-vérification hash prod (T-07d)

- Entrée `deployments` pour `bad3dca` : **`6708913238`** (Production, 2026-09-28T11:37:36Z) ; antérieurs `fd12e1c 6708741924` (11:28Z), `866aef4 6708619999` (11:21Z).
- **Hash prod === build local** : `index-BGUSIwRj.js` + `index-CBsJf68R.css`.
- `/api/v2/public/facilities` → **200** (250 = plafond). Routing anonyme → **401 AUTH_REQUIRED**. Route batch `POST /api/v2/public/facilities?action=operator-import-batch&scope=world` → **401**.

## A1 — FORECAST (écrit AVANT tout run canonique)

**Sous-vague 1 = « Ouest restante »** (11 extraits Geofabrik, tous Last-Modified 2026-09-27) :
Nigeria · Sénégal+Gambie · Mali · Guinée · Côte d'Ivoire · Sierra Leone · Liberia · Guinée-Bissau · Cap-Vert · Mauritanie · Niger.

| Pays | matched | importable | pré-filtrés (nom vide) | pilot | world | quarantine |
|---|---|---|---|---|---|---|
| nigeria | 30 121 | 6 536 | 23 585 | 0 | 6 605 | 23 516 |
| senegal-and-gambia | 14 825 | 10 305 | 4 520 | 0 | 10 396 | 4 429 |
| mali | 12 102 | 10 013 | 2 089 | 0 | 10 246 | 1 856 |
| guinea | 5 233 | 4 592 | 641 | 0 | 4 706 | 527 |
| ivory-coast | 46 204 | 34 666 | 11 538 | 0 | 34 711 | 11 493 |
| sierra-leone | 2 036 | 1 633 | 403 | 0 | 1 850 | 186 |
| liberia | 5 543 | 3 127 | 2 416 | 0 | 5 448 | 95 |
| guinea-bissau | 374 | 275 | 99 | 0 | 277 | 97 |
| cape-verde | 2 320 | 1 945 | 375 | 0 | 1 948 | 372 |
| mauritania | 2 903 | 1 352 | 1 551 | 0 | 1 473 | 1 430 |
| niger | 4 909 | 3 891 | 1 018 | 0 | 3 921 | 988 |
| **TOTAL** | **126 570** | **78 335** | **48 235** | **0** | **81 581** | **44 989** |

**Lecture du forecast :** ~78 335 lieux **importables** (nom non vide), **2,75×** la vague Ouest (28 479).
`pilot = 0` partout (aucun point dans la boîte 1.0–2.45 E / 5.85–6.5 N — cohérent). Quarantine dominée par
les **sans-nom** ; le pré-filtre du transform les écarte du payload (le 400 batch-reject reste le contrat API).
**Attendu canonique :** `created ≈ importable − existing`, soit **~78 000** nouvelles facilités → canonique
39 730 → **~118 000**. Perf attendue : p95 ~100 ms en écriture, lecture plafonnée 250 lignes (réf. 166 ms).

**Forecast figé le 2026-09-28 avant A2/A3** (ce commit est la preuve qu'il précède les runs).
