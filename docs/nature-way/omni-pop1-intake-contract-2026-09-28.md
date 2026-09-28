# POP-1a — Contrat données : peuplement unclaimed du monde (Root, sans écriture canonique)

> **Décisions :** DEC-V2-10 (peuplement unclaimed, gardes) · DEC-V2-11 (portée monde, fin du staging pilote).
> **Porte :** Root System. **Ce contrat n'écrit RIEN au canonique** — POP-1b (relais MCP) prouve sur
> jetable puis canonique. Aucune nouvelle colonne en POP-1a.

## 1. Source de vérité (acquisition)

- **Source :** données de lieux par défaut des cartes, provider `openstreetmap`, **attribution
  obligatoire** (contrat existant du endpoint, inchangé).
- **Déduplication :** `(source_id, source_ref)` unique — existe (`v2_facility_source_refs`).
  Rejeu = refresh si encore `unclaimed` + `account_id null`, jamais d'écrasement d'un lieu revendiqué.
- **Fraîcheur :** `last_seen_at` sur `source_refs` — existe. Pas de promesse de stock sur l'unclaimed (S-05).
- **Fetcheur automatisé : HORS POP-1a** (dépendance externe, volume, coût — tranche dédiée POP-1b/c).
  POP-1a couvre le **contrat + la classification + le stockage du tier**, alimentés par les endpoints
  existants (opérateur) et, plus tard, par le fetcheur.

## 2. Sémantique des tiers (le cœur de la tranche)

| Tier | Prédicat | Comportement |
|---|---|---|
| `pilot` | dans la zone pilote (`isInsidePilotZone`, bbox existante) | comportement actuel **inchangé** : admis, visible, transactable après claim |
| `world` | coordonnées saines, hors zone pilote | **visible unclaimed** (S-05 : sans promesse de stock, bouton Revendiquer) ; transactabilité **inchangée** (claim → entité → publication, gates existantes) ; **aucune promesse de routage nouvelle** (les gates existantes gouvernent) |
| `quarantine` | (0,0) · non-fini/hors-plage · sans nom ET sans adresse · placeholder (`unnamed…`) sans adresse | **jamais admis** : refusé et **compté** (même honnêteté que `skippedOutOfZone`) ; file de revue = futur, pas ce contrat |

- **Règle d'or :** un lieu n'est jamais une impasse silencieuse — admis (pilot/world) ou refusé-compté (quarantine).
- **S-18 intact :** le claim exige preuve + arbitrage avant transfert, quel que soit le tier. Le tier ne
  donne aucun droit ; il décrit la provenance et la qualité.
- **Sans nom + avec adresse → `world`** (adressable, honnête). **Sans nom + sans adresse → `quarantine`**
  (rien à afficher, rien à router — le précédent des 8 « Unnamed public place » du Ghana).

## 3. Schéma (zéro migration en POP-1a)

- **Aucune colonne ajoutée.** Le tier voyage dans `raw_metadata.intake_tier` (JSONB existant).
- Paramètre optionnel `intakeTier?` sur `createPublicFacilityImport` — absent = comportement historique
  exact (aucune clé ajoutée). L'admission (filtre pilote + 400) est **inchangée** en POP-1a.
- L'admission monde (scope `world`, quarantaine refusée-comptée) = **POP-1b**, avec preuve sur jetable.

## 4. Compatibilités vérifiées (lues, pas supposées)

- Claim : `account_id is null + source_kind='public_import'` — agnostique au tier, inchangé.
- Confiance : `unclaimed` à l'écriture, badge gagné ensuite (S-17/S-31) — inchangé.
- S-05 : unclaimed visible sans promesse — étendu au monde, pas réécrit.
- Monnaie/avis/QR : hors périmètre (aucun flux monétaire dans l'intake).

## 5. Dry-run spec POP-1b (relais MCP — pas exécuté ici)

Sur branche **jetable**, bbox échantillon : distribution des tiers (pilot/world/quarantine) comptée,
zéro écriture canonique ; puis preuve claim spot-check ; puis rapport + prompt retour.
Écritures canoniques = relais MCP uniquement, jamais cette passe.

## 6. Non-goals POP-1a

Fetcheur Overpass/extrait · backfill canonique · enrichissement d'adresses · file de revue
quarantine · exposition UI des tiers (la fiche n'affiche rien de nouveau) · changement d'admission.

## 7. Amendement POP-1b — admission monde (scope param, quarantine dans les deux scopes)

- **`?scope=world`, défaut `pilot`.** Défaut = gate legacy exacte (seul le pilot admis, reste refusé-compté).
- **Quarantine refusée-comptée dans les DEUX scopes** (`skippedQuarantine`, même honnêteté que
  `skippedOutOfZone`). Seul changement de comportement pilote : un placeholder-sans-adresse dans la
  zone (admis avant, vide et inroutable) est désormais refusé-compté — documenté, pas silencieux.
- **Réponse batch** : `+ skippedQuarantine` (additif, clients existants insensibles).
- **Route unitaire** : quarantine → `400 QUARANTINED` + raisons ; monde hors zone en scope monde → admis
  avec tier ; scope pilote hors zone → `400 OUT_OF_PILOT_ZONE` inchangé.
- **Preuve** : `admitIntakeBatch`/`parseIntakeScope` unitaires falsifiés (POP-1b) ; câblage route couvert
  par tsc + revue (pas de harness de route — résidu assumé, preuve DB au relais MCP).
