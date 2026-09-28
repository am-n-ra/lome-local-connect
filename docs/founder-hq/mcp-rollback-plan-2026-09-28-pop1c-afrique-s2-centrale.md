# POP-1c-A S2 Centrale — Rollback plan (écrit AVANT exécution canonique)

> **Écrit le 2026-09-28 AVANT les runs canoniques S2** (exigence du handoff §5).
> **NON EXÉCUTÉ** sans ordre fondateur séparé. Procédure uniquement.

## Fenêtre

Début de fenêtre S2 = **`2026-09-28T12:27:29.966Z`** (= `max(created_at)` canonique avant S2 ;
c'est la fin de la fenêtre S1). Tout lieu S2 a `created_at > 2026-09-28T12:27:29.966Z`.

## Périmètre par pays

Les 8 pays S2 sont créés par `createPublicFacilityImport` avec une `correlation_id` de la forme
`pop1c-s2-<pays>-<type>-<id>` (le même canal livré que vague 0 / Ouest / S1). Comme les vagues
précédentes ne stockent pas le pays sur la ligne, le rollback distingue le pays par **bbox Geofabrik**
documentée, mais l'unité de sécurité reste **la fenêtre entière** (un seul run global couvre les 8).

## Suppression (par pays ET/OU fenêtre entière)

Supprimer les `v2_facilities` **créées dans la fenêtre S2** :
`created_at > '2026-09-28T12:27:29.966Z'`
**ET** `account_id is null`
**ET** `source_kind = 'public_import'`
**ET** `trust_state = 'unclaimed'`.

Puis supprimer les `v2_operator_runs` de la fenêtre (`finished_at > '2026-09-28T12:27:29.966Z'`)
et les `v2_facility_source_refs` orphelines.

**Ne PAS toucher :**
- les **52** lignes `existing` (44 intra-S2 frontières + 2 canoniques + 6 *refresh* — déjà présentes
  avant S2, possiblement rafraîchies : elles ne sont pas des créations) ;
- les **3** facilités `owned` (revendiquées — jamais touchées) ;
- tout lieu `created_at <= 2026-09-28T12:27:29.966Z`.

## Ce que le rollback NE répare PAS

Le **budget de crédits** et les **événements stock** ne sont pas concernés (imports = lieux
`unclaimed`, aucun flux monétaire ni transaction). Aucune donnée utilisateur touchée.

## Détail « refresh »

Le canal `createPublicFacilityImport` rafraîchit un lieu **encore unclaimed** s'il existe déjà
(`on conflict (source_id, source_ref)`). Ces rafraîchissements sont **comptés dans `existing`**, pas
dans `created` — le rollback ne les inverse pas (le contenu rafraîchi = mêmes coordonnées/nom OSM).

---

**Plan écrit le 2026-09-28 avant exécution.** Les chiffres définitifs (`created`/`existing` par pays)
sont dans le rapport `mcp-report-2026-09-28-pop1c-afrique-s2-centrale.md`.
