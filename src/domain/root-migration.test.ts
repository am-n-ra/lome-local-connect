import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve(process.cwd(), 'db/migrations/003_v2_root_guardrails.sql'), 'utf8');
const eventIdempotencyMigration = readFileSync(resolve(process.cwd(), 'db/migrations/004_v2_event_idempotency.sql'), 'utf8');
const sellerResponseMigration = readFileSync(resolve(process.cwd(), 'db/migrations/005_v2_seller_response_idempotency.sql'), 'utf8');
const reviewedMigrations = `${migration}\n${eventIdempotencyMigration}\n${sellerResponseMigration}`;

describe('Root guardrail migration review', () => {
  it('contains no destructive schema or data operation', () => {
    expect(reviewedMigrations).not.toMatch(/\b(drop\s+(table|schema|database)|truncate\b|delete\s+from)\b/i);
    expect(reviewedMigrations).not.toMatch(/\bupdate\s+[^\n]+\s+set\s+[^\n]+\s+where\s*;\s*$/im);
  });

  it('defines the reviewed ownership, append-only and QR primitives', () => {
    expect(migration).toContain('v2_facilities_company_owner_guard');
    expect(migration).toContain('v2_availability_scope_product_guard');
    expect(migration).toContain('v2_availability_response_scope_guard');
    expect(migration).toContain('v2_purchase_intent_authority_guard');
    expect(migration).toContain('v2_wallet_ledger_append_only_guard');
    expect(migration).toContain('v2_transaction_events_append_only_guard');
    expect(migration).toContain('v2_verify_qr_token');
    expect(eventIdempotencyMigration).toContain('v2_transaction_event_state_unique');
    expect(eventIdempotencyMigration).toContain('v2_audit_action_idempotency_unique');
    expect(sellerResponseMigration).toContain('v2_availability_response_idempotency_unique');
    expect(sellerResponseMigration).toContain('v2_qr_transaction_unique');
    expect(sellerResponseMigration).toContain('ADD COLUMN IF NOT EXISTS idempotency_key');
    expect(migration).toContain('verified_at IS NULL');
    expect(migration).toContain('expires_at > p_now');
  });

  it('does not claim to repair existing rows silently', () => {
    expect(migration).toContain('CHECK ((verified_at IS NULL AND replay_count = 0) OR (verified_at IS NOT NULL AND replay_count > 0)) NOT VALID');
    expect(migration).toContain('apply first on a disposable branch');
    expect(eventIdempotencyMigration).toContain('Apply after migration 003 on a disposable branch');
    expect(sellerResponseMigration).toContain('no destructive operation is used');
    expect(sellerResponseMigration).toContain('no existing rows are rewritten');
  });
});
