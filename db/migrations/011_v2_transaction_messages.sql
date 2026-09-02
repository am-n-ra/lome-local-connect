-- Transactional chat: messages are private to the Buyer/Seller members of one transaction.
create table if not exists v2_transaction_messages (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references v2_transaction_snapshots(transaction_id) on delete cascade,
  sender_account_id uuid not null references v2_accounts(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  seen_at timestamptz
);

create index if not exists v2_transaction_messages_thread_idx
  on v2_transaction_messages(transaction_id, created_at, id);

create unique index if not exists v2_transaction_messages_idempotency_idx
  on v2_transaction_messages(transaction_id, sender_account_id, id)
  where id is not null;
