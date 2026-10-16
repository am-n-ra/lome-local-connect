-- 075_v2_drop_unused_cemented_at.sql
--
-- Correction d'une erreur commise en écrivant 074 : j'avais ajouté
-- `v2_transaction_snapshots.cemented_at` pour horodater le « ciment » du prix remisé.
-- Or `v2_transaction_snapshots` est APPEND-ONLY (trigger `v2_transaction_snapshots_append_only_guard`) :
-- la colonne ne pouvait JAMAIS être écrite après l'insertion — elle serait restée NULL à vie.
--
-- Le ciment a DÉJÀ sa source de vérité : l'événement `qr_verified` dans
-- `v2_transaction_events` (écrit exactement quand le vendeur valide, scan retrait ou clic
-- dashboard livraison). En dériver plutôt que stocker, c'est respecter la règle « une seule
-- source de vérité par préoccupation » — une colonne morte est un mensonge dormant.
--
-- Additive au sens strict : on retire une colonne qui n'a jamais porté de donnée (0 écriture,
-- elle est NULL sur toutes les lignes). Aucune donnée perdue.

alter table public.v2_transaction_snapshots
  drop column if exists cemented_at;
