import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * BRANCHES-NOTIF-1 — the notification loop is only honest if BOTH producers exist:
 * a buyer's request notifies the SELLER, and the seller's response notifies the BUYER.
 * Removing either one silently breaks the loop (the seller would be invited to enable
 * notifications with nothing to receive; the buyer would wait with no signal).
 *
 * The repository tests use a stubbed `sql` that never executes, so they cannot see the
 * INSERTs vanish. This guard is the static half; the real-SQL half lives in
 * `scripts/prove-branches-notif-1.mjs`.
 */
const source = readFileSync(new URL('../server/trunk-repository.ts', import.meta.url), 'utf8');

function block(fnName: string, nextName: string): string {
  const start = source.indexOf(`async ${fnName}`);
  const end = source.indexOf(`async ${nextName}`, start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('BRANCHES-NOTIF-1 — les deux producteurs existent', () => {
  it('createAvailabilityRequest notifie le VENDEUR', () => {
    const body = block('createAvailabilityRequest', 'createBulkAvailabilityRequest');
    expect(body).toContain("'availability_request_created'");
    expect(body).toContain('v2_notification_events');
    expect(body).toContain('v2_notification_deliveries');
    // Web push only when the recipient actually holds a granted subscription.
    expect(body).toContain("permission_state = 'granted'");
  });

  it('createBulkAvailabilityRequest notifie aussi le VENDEUR (chaque lieu visé)', () => {
    const start = source.indexOf('async createBulkAvailabilityRequest');
    expect(start).toBeGreaterThan(-1);
    // C'est la DERNIÈRE méthode du dépôt : elle se termine par la fermeture de l'objet.
    const body = source.slice(start, source.indexOf('\n  };', start));
    expect(body).toContain("'availability_request_created'");
    expect(body).toContain('unnest(ri.facility_scope)');
  });

  it('respondAvailability notifie l’ACHETEUR', () => {
    const body = block('respondAvailability', 'createPurchaseIntent');
    expect(body).toContain("'availability_response_created'");
    expect(body).toContain('v2_notification_events');
    expect(body).toContain('v2_notification_deliveries');
  });

  it('chaque producteur dédoublonne par dedupe_key (le rejeu ne re-notifie pas)', () => {
    const request = block('createAvailabilityRequest', 'createBulkAvailabilityRequest');
    const response = block('respondAvailability', 'createPurchaseIntent');
    expect(request).toContain('on conflict (recipient_account_id, dedupe_key) do nothing');
    expect(response).toContain('on conflict (recipient_account_id, dedupe_key) do nothing');
  });
});
