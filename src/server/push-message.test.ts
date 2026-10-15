import { describe, expect, it } from 'vitest';
import { pushMessageFor } from './web-push';

/**
 * NR-8 — le TAP d'une notification ouvre la FEUILLE de l'événement.
 *
 * Défaut corrigé : `pushMessageFor` ne produisait que `/?notifs=1` (Inbox générique),
 * donc un vendeur prévenu d'une intention ne pouvait pas atteindre la transaction.
 * Et il ne connaissait que les états de transaction : une intention poussait
 * « une nouvelle étape de transaction » — faux sur ce qui venait d'arriver.
 */
describe('NR-8 — la cible du tap et le message', () => {
  it('ouvre la Room de la transaction quand l’événement en porte une', () => {
    const message = pushMessageFor({ kind: 'transaction_intent_created' }, { entityType: 'transaction', entityId: 'txn-7' });
    expect(message.url).toBe('/?notifs=1&txn=txn-7');
  });

  it('ouvre le suivi de la demande pour une réponse de disponibilité', () => {
    const message = pushMessageFor({ kind: 'availability_response_created' }, { entityType: 'availability_request', entityId: 'req-3' });
    expect(message.url).toBe('/?notifs=1&request=req-3');
  });

  it('retombe sur l’Inbox quand l’entité est inconnue', () => {
    expect(pushMessageFor({ kind: 'transaction_intent_created' }, {}).url).toBe('/?notifs=1');
    expect(pushMessageFor({ kind: 'transaction_intent_created' }, { entityType: 'account', entityId: 'acc-1' }).url).toBe('/?notifs=1');
  });

  it('dit ce qui vient d’arriver, pas « une étape de transaction »', () => {
    const intent = pushMessageFor({ kind: 'transaction_intent_created' }, { entityType: 'transaction', entityId: 'txn-7' });
    expect(intent.title).toContain('intention');
    expect(intent.body).not.toMatch(/étape de transaction/i);

    const request = pushMessageFor({ kind: 'availability_request_created' }, { entityType: 'availability_request', entityId: 'req-3' });
    expect(request.title).toContain('demande');
    expect(request.body).not.toMatch(/étape de transaction/i);

    const response = pushMessageFor({ kind: 'availability_response_created' }, { entityType: 'availability_request', entityId: 'req-3' });
    expect(response.title).toContain('réponse');
    expect(response.body).not.toMatch(/étape de transaction/i);
  });

  it('garde les messages d’étape de transaction (régression)', () => {
    const message = pushMessageFor({ state: 'qr_verified' }, { entityType: 'transaction', entityId: 'txn-7' });
    expect(message.body).toMatch(/scanné votre QR/i);
    expect(message.url).toBe('/?notifs=1&txn=txn-7');
  });

  it('encode un identifiant qui contient des caractères réservés', () => {
    expect(pushMessageFor({ kind: 'transaction_intent_created' }, { entityType: 'transaction', entityId: 'a&b' }).url)
      .toBe('/?notifs=1&txn=a%26b');
  });
});
