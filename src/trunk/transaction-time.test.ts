import { describe, expect, it } from 'vitest';
import { deadlineLabel, deadlineState, isMyTurn, relativeAge, requestCountdownLabel, transactionStateLabel, transactionStateResponsible } from './transaction-time';

describe('transaction-time', () => {
  it('labels every transaction state in FR', () => {
    expect(transactionStateLabel('qr_verified')).toContain('verrouillée');
    expect(transactionStateLabel('intent_created')).toBe('Intention posée');
    expect(transactionStateLabel('closed')).toBe('Clôturée');
  });

  // TRUNK-X1 : une intention non verrouillée expirée ne doit PAS lire « En cours ».
  it('TRUNK-X1: expired is a labelled terminal state, not "En cours"', () => {
    expect(transactionStateLabel('expired')).toBe('Expirée');
    expect(transactionStateResponsible('expired')).toBe('system');
  });

  it('assigns responsibility per state', () => {
    expect(transactionStateResponsible('qr_ready')).toBe('buyer');
    expect(transactionStateResponsible('qr_verified')).toBe('seller');
    expect(transactionStateResponsible('fulfilled')).toBe('buyer');
    expect(transactionStateResponsible('closed')).toBe('system');
  });

  it('isMyTurn follows responsibility', () => {
    expect(isMyTurn('qr_ready', 'buyer')).toBe(true);
    expect(isMyTurn('qr_ready', 'seller')).toBe(false);
    expect(isMyTurn('payment_confirmed', 'seller')).toBe(true);
    expect(isMyTurn('received', 'buyer')).toBe(true);
  });

  it('relativeAge formats minutes, hours and days', () => {
    const now = Date.UTC(2026, 8, 16, 12, 0, 0);
    expect(relativeAge(new Date(now - 30 * 1000).toISOString(), now)).toBe("à l'instant");
    expect(relativeAge(new Date(now - 12 * 60000).toISOString(), now)).toBe('il y a 12 min');
    expect(relativeAge(new Date(now - 3 * 3600000).toISOString(), now)).toBe('il y a 3 h');
    expect(relativeAge(new Date(now - 2 * 86400000).toISOString(), now)).toBe('il y a 2 j');
  });

  it('relativeAge never returns negative ages', () => {
    const now = Date.UTC(2026, 8, 16, 12, 0, 0);
    expect(relativeAge(new Date(now + 60000).toISOString(), now)).toBe("à l'instant");
  });

  it('deadlineState computes remaining time and overdue', () => {
    const now = Date.UTC(2026, 8, 16, 12, 0, 0);
    const started = new Date(now - 3 * 60000).toISOString();
    const fresh = deadlineState('qr_ready', started, now);
    expect(fresh).not.toBeNull();
    expect(fresh!.minutesLeft).toBe(7);
    expect(fresh!.overdue).toBe(false);
    const stale = deadlineState('qr_ready', new Date(now - 40 * 60000).toISOString(), now);
    expect(stale!.overdue).toBe(true);
  });

  it('deadlineState returns null for states without a deadline or missing timestamp', () => {
    expect(deadlineState('closed', new Date().toISOString())).toBeNull();
    expect(deadlineState('qr_ready', null)).toBeNull();
  });

  it('deadlineLabel renders remaining and overdue text', () => {
    expect(deadlineLabel(8)).toBe('8 min restant');
    expect(deadlineLabel(80)).toBe('1 h 20 min restant');
    expect(deadlineLabel(-120)).toBe('dépassé de 2 h');
    expect(deadlineLabel(2880)).toBe('2 j restant');
  });

  // TXN-G6 (GAP-6) — l'échéance de la demande de dispo était invisible.
  it('TXN-G6: requestCountdownLabel says the real time left, never a fake zero', () => {
    const now = Date.parse('2026-10-15T12:00:00.000Z');
    expect(requestCountdownLabel('2026-10-15T12:15:00.000Z', now)).toBe('15 min pour répondre');
    expect(requestCountdownLabel('2026-10-15T13:30:00.000Z', now)).toBe('1 h 30 min pour répondre');
    expect(requestCountdownLabel('2026-10-15T11:59:00.000Z', now)).toBe('délai écoulé');
    // Une échéance illisible rend null — jamais « 0 min ».
    expect(requestCountdownLabel(null, now)).toBeNull();
    expect(requestCountdownLabel('not-a-date', now)).toBeNull();
  });
});