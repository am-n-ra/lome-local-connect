# Plan de rollback — POP-1c-A S5 (Afrique australe) — ÉCRIT, **NON EXÉCUTÉ** (2026-09-28)

> Filet de sécurité si un run canonique S5 est jugé mauvais. **Aucune exécution sans ordre
> fondateur séparé.** Même classe que les plans S1/S2/S3/S4, restés procédure (DEC-V2-18…23).

## Périmètre

Runs canoniques S5 sur `br-dawn-hill-am5amy22` (canonique, identifiée par ses données : **324 151**
facilités au départ). Chaque import crée une ligne `v2_facilities` + `v2_facility_source_refs`
+ `v2_operator_runs`. Source `openstreetmap`, `source_ref` = `node/<id>`.

## Critère d'inclusion du rollback

Les lignes créées par S5 sont **exactement** celles `created_at >= '<horodatage du 1er run S5>'`
**ET** `account_id IS NULL` **ET** `trust_state IN ('unclaimed','verification_draft','needs_more_evidence')`
**ET** `source_ref` appartient aux extraits S5. On ne touche **jamais** une facilité revendiquée
(`account_id NOT NULL`) ni une revendication en cours d'un tiers.

## Procédure (si autorisée)

1. **Fenêtre temporelle** : relever `min(created_at)` des runs S5 `operator_runs` (label `s5-*`).
2. **Sélection** : `select id from v2_facilities where created_at >= <t0> and account_id is null
   and trust_state in ('unclaimed','verification_draft','needs_more_evidence')`.
3. **Garde** : compter séparément les revendiquées de la fenêtre — **doit être 0**. Sinon STOP et
   remonter au fondateur. ⚠️ **les 535 nœuds « existing » (358 intra-S5 + 177 canoniques S2/S3
   frontière) appartiennent à des lignes ANCIENNES** — ils ne sont **pas** dans la fenêtre S5 et
   ne doivent **pas** être supprimés (ils restent légitimement rattachés à leur 1er run).
4. **Suppression** (append-only respecté par transaction) : désactiver les triggers append-only le
   temps de la transaction, supprimer `v2_facility_source_refs`, `v2_operator_runs`,
   `v2_facilities` de la fenêtre, puis ré-armer les triggers et **asserter le count supprimé**.
5. **Vérification** : facilités canoniques == **324 151** ; source_refs == **324 148** ; owned == **3** ;
   produits == **16** ; entités == **3**.
6. **Branche** : opérer depuis une branche jetable d'abord, confirmer, puis canonique.

## Interdits

- Pas de suppression d'une facilité revendiquée ou d'une revendication tierce.
- Pas d'écriture hors de la fenêtre S5 exacte (ne jamais « nettoyer » S1/S2/S3/S4).
- Ne pas retirer les 535 nœuds frontaliers pré-existants (ce ne sont pas des doublons de S5).
- Pas d'exécution dans cette session.

**Statut : ÉCRIT AVANT U3. NON EXÉCUTÉ.** Rollbacks S1/S2/S3/S4 déclinés par le fondateur
(DEC-V2-18/20/22) — celui-ci emprunte la même voie par défaut.
