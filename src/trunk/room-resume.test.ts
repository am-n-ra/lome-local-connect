import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * GR-2 (suite) — la Room d'une transaction en cours doit survivre au rechargement.
 *
 * Défaut mesuré : `room` n'était pas dans `RESTORABLE_SHEETS`, donc recharger au milieu
 * d'une transaction retombait sur la carte nue (`sanitizeNavSheet('room') === 'none'`).
 * L'utilisateur perdait le fil de son achat.
 *
 * Le garde lit la source (monter `TrunkAppV13` coûterait une carte + l'API) et vérifie
 * le contrat de bout en bout : la feuille est restaurable, la transaction voyage avec
 * elle, et la restauration REJOUE la Room par `resumeTransaction` (rôle relu serveur).
 */
const navState = readFileSync(new URL('./nav-state.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');

describe('GR-2 (suite) — la Room en cours est restaurable', () => {
  it('`room` fait partie des feuilles restaurables', () => {
    const set = navState.slice(navState.indexOf('const RESTORABLE_SHEETS'), navState.indexOf(']);', navState.indexOf('const RESTORABLE_SHEETS')));
    expect(set).toContain("'room'");
  });

  it('la transaction ne voyage qu’avec la Room, et une Room vide n’est pas restaurée', () => {
    expect(navState).toMatch(/sheet === 'room' \? safeId\(state\.roomTransactionId\)/);
    expect(navState).toMatch(/if \(sheet === 'room' && !roomTransactionId\) return null;/);
  });

  it('la persistance n’attache la transaction que sur la feuille `room`', () => {
    expect(app).toMatch(/roomTransactionId: sheet === 'room' \? roomTxn\?\.transactionId : undefined/);
  });

  it('la restauration REJOUE la Room par `resumeTransaction` (rôle relu côté serveur)', () => {
    const block = app.slice(app.indexOf("restored.sheet === 'room'"));
    expect(block.slice(0, 500)).toMatch(/resumeTransaction\(\{ transactionId: restored\.roomTransactionId \}\)/);
  });

  it('la Room RETIENT sa transaction si la session n’est pas prête (jamais `home`)', () => {
    // Même classe que AUTH-RESUME : un rechargement à froid sans session prête ne doit pas
    // perdre la transaction en renvoyant sur l'accueil.
    const open = app.slice(app.indexOf('const openRoom = useCallback'));
    expect(open.slice(0, 700)).toMatch(/requireAuth\(\{ kind: 'room', returnTo: 'room', transactionId: transaction\.transactionId \}\)/);
    const resume = app.slice(app.indexOf('const resumeTransaction = useCallback'));
    expect(resume.slice(0, 500)).toMatch(/requireAuth\(\{ kind: 'room', returnTo: 'room', transactionId: transaction\.transactionId \}\)/);
  });

  it('le tap d’une notification de transaction relit le rôle côté serveur', () => {
    const pending = app.slice(app.indexOf("case 'room':"));
    expect(pending.slice(0, 500)).toMatch(/resumeTransaction\(\{ transactionId: resume\.transactionId \}\)/);
  });
});
