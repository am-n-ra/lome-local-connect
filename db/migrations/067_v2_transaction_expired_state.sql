-- Omni V2 — TRUNK-X1 : l'expiration d'une intention d'achat est un ÉTAT canonique.
--
-- Défaut mesuré (2026-10-07) : `sweepExpiredIntents` libérait le stock et marquait la
-- DEMANDE `expired`, mais n'écrivait AUCUN événement de transaction. Or « l'état courant »
-- d'une transaction est le dernier événement de `v2_transaction_events` (D-TXN-11) :
-- une intention jamais scannée n'ayant aucun événement, son état retombait sur le défaut
-- `'intent_created'` et restait affichée « en cours » POUR TOUJOURS (« zombie »).
--
-- `expired` devient un état de plein droit de la timeline transactionnelle. Il n'a PAS
-- de `state_rank` métier (il n'appartient à aucune séquence d'avancement) : le CASE de
-- 056 le laisse à `else 0`. La distinction « expirée avant verrou » vs « étape qui a
-- dépassé son échéance mais reste vivante » se fait sur `state` (expired vs autre), pas
-- sur une prolongation d'une étape vivante.
--
-- Additive + idempotente. Aucune ligne réécrite (les zombies actuels sont traités par le
-- code : `listOpenTransactions` joint désormais `v2_purchase_intents.state`).

do $$
declare
  con record;
begin
  -- Retrouve le CHECK de la colonne `state` par sa DÉFINITION, pas par son nom
  -- supposé : Postgres l'a nommé automatiquement en 001, et un nom deviné faux
  -- laisserait l'ancienne contrainte en place (elle continuerait de REJETER 'expired').
  for con in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'v2_transaction_events'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%state%'
  loop
    execute format('alter table v2_transaction_events drop constraint %I', con.conname);
  end loop;

  alter table v2_transaction_events add constraint v2_transaction_events_state_check
    check (state in ('intent_created', 'qr_ready', 'qr_verified', 'payment_declared',
                     'payment_confirmed', 'fulfilment_pending', 'fulfilled', 'received',
                     'rated', 'closed', 'expired'));
end $$;

comment on column v2_transaction_events.state is
  'Étapes du cycle de vie + ''expired'' (TRUNK-X1 : une intention non verrouillée expire sans mentir ; ce n''est ni annulé ni clôturé).';
