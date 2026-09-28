# Plan de rollback — POP-1c-A S4 (Afrique du Nord) — ÉCRIT, **NON EXÉCUTÉ** (2026-09-28)

> Filet de sécurité si un run canonique S4 est jugé mauvais. **Aucune exécution sans ordre
> fondateur séparé.** Même classe que les plans S1/S2/S3, restés procédure (DEC-V2-18…20).

## Périmètre

Runs canoniques S4 sur `br-dawn-hill-am5amy22` (canonique, identifiée par ses données : **278 997**
facilités au départ). Chaque import crée une ligne `v2_facilities` + `v2_facility_source_refs`
+ `v2_operator_runs`. Source `openstreetmap`, `source_ref` = `node/<id>`.

## Critère d'inclusion du rollback

Les lignes créées par S4 sont **exactement** celles `created_at >= '<horodatage du 1er run S4>'`
**ET** `account_id IS NULL` **ET** `trust_state IN ('unclaimed','verification_draft','needs_more_evidence')`
**ET** `source_ref` appartient aux extraits S4. On ne touche **jamais** une facilité revendiquée
(`account_id NOT NULL`) ni une revendication en cours d'un tiers.

## Procédure (si autorisée)

1. **Fenêtre temporelle** : relever `min(created_at)` des runs S4 `operator_runs` (label `s4-*`).
2. **Sélection** : `select id from v2_facilities where created_at >= <t0> and account_id is null
   and trust_state in ('unclaimed','verification_draft','needs_more_evidence')`.
3. **Garde** : compter séparément les revendiquées de la fenêtre — **doit être 0**. Sinon STOP et
   remonter au fondateur. ⚠️ **les 18 nœuds « existing » (15 canoniques S3 frontière +
   3 intra-S4) appartiennent à des lignes ANCIENNES** — ils ne sont **pas** dans la fenêtre S4 et
   ne doivent **pas** être supprimés (ils restent légitimement rattachés à leur 1er run).
4. **Suppression** (append-only respecté par transaction) : désactiver les triggers append-only le
   temps de la transaction, supprimer `v2_facility_source_refs`, `v2_operator_runs`,
   `v2_facilities` de la fenêtre, puis ré-armer les triggers et **asserter le count supprimé**.
5. **Vérification** : facilités canoniques == **278 997** ; source_refs == **278 994** ; owned == **3** ;
   produits == **16** ; entités == **3**.
6. **Branche** : opérer depuis une branche jetable d'abord, confirmer, puis canonique.

## Interdits

- Pas de suppression d'une facilité revendiquée ou d'une revendication tierce.
- Pas d'écriture hors de la fenêtre S4 exacte (ne jamais « nettoyer » S1/S2/S3).
- Ne pas retirer les 18 nœuds frontaliers pré-existants (ils ne sont pas des doublons de S4).
- Pas d'exécution dans cette session.

**Statut : ÉCRIT AVANT N3. NON EXÉCUTÉ.** Rollbacks S1/S2/S3 déclinés par le fondateur
(DEC-V2-18/20) — celui-ci emprunte la même voie par défaut.
