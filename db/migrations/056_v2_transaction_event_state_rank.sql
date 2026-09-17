-- Omni V2 — D-TXN-11 : ordre canonique des états de transaction.
--
-- « L'état courant » d'une transaction est le dernier événement de
-- `v2_transaction_events`. Or plusieurs événements peuvent être écrits dans la
-- même instruction (ex. `qr_ready` puis `closed`, chacun avec `now()` dans son
-- `created_at` fermé sur l'horloge de transaction) : leurs `created_at` sont
-- ALORS IDENTIQUES. Le départage historique `order by created_at desc, id desc`
-- portait sur `id`, un uuid aléatoire (`gen_random_uuid()`), donc l'état courant
-- était NON DÉTERMINISTE — au point qu'après une notation, `intent_created`
-- pouvait être relu comme état courant et rouvrir un flux verrouillé.
--
-- `state_rank` donne l'ordre canonique du cycle de vie (intent_created → closed)
-- pour départager de façon déterministe. Colonne GÉNÉRÉE (stored) : toujours
-- calculée, jamais fournie par un INSERT, donc aucune écriture à modifier.
-- Additive + idempotente.

alter table v2_transaction_events
  add column if not exists state_rank smallint
  generated always as (
    case state
      when 'intent_created' then 1
      when 'qr_ready' then 2
      when 'qr_verified' then 3
      when 'payment_declared' then 4
      when 'payment_confirmed' then 5
      when 'fulfilment_pending' then 6
      when 'fulfilled' then 7
      when 'received' then 8
      when 'rated' then 9
      when 'closed' then 10
      else 0
    end
  ) stored;

comment on column v2_transaction_events.state_rank is
  'Ordre canonique du cycle de vie (D-TXN-11). Départage déterministe des événements écrits dans la même instruction (created_at identiques).';

create index if not exists v2_transaction_events_latest_idx
  on v2_transaction_events (transaction_id, created_at desc, state_rank desc);
