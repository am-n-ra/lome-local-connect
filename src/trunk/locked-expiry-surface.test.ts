import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// T-G2 / D-TXN-3b (B3, décision fondateur 2026-10-15) — l'expiration du VERROUILLÉ.
//
// Deux vérités à verrouiller :
//  1. RÈGLE (serveur) : le sweep n'expire QUE l'état exactement `qr_verified`. Dès qu'une
//     étape ultérieure existe (`payment_declared`+), de l'argent ou une remise est en jeu :
//     expirer tuerait une transaction payée (c'est B2, écartée). Le garde lit le SQL LIVRÉ.
//  2. SURFACE (client) : une demande expirée le DIT et arrête d'attendre — un « En attente »
//     éternel sur une demande morte est le mensonge que T-G2 corrige.

const REPO = readFileSync(new URL('../server/trunk-repository.ts', import.meta.url), 'utf8');
const BUYER = readFileSync(new URL('./BuyerFlowV13.tsx', import.meta.url), 'utf8');

function sweepBody(): string {
  const start = REPO.indexOf('async sweepStalledLockedTransactions');
  expect(start).toBeGreaterThan(-1);
  return REPO.slice(start, start + 6000);
}

describe('T-G2 (B3) — expiration du verrouillé jamais engagé', () => {
  it('le sweep existe et n’expire QUE l’état exactement qr_verified', () => {
    const body = sweepBody();
    // La règle porteuse : l'égalité stricte, jamais un IN qui engloberait payment_declared.
    expect(body).toContain("l.current_state = 'qr_verified'");
    expect(body).not.toContain("l.current_state in (");
    // Et le garde d'avancée : aucune étape ultérieure n'est expirée.
    expect(body).not.toContain('payment_declared');
  });

  it('il libère le stock et notifie les deux parties (même mécanique que TXN-G7)', () => {
    const body = sweepBody();
    expect(body).toContain('quantity_reserved_omni = greatest');
    expect(body).toContain("'availability_request_expired'");
    expect(body).toContain("'availability_response_lapsed'");
    // Clé de dédup distincte de TXN-G7 (natures différentes).
    expect(body).toContain("':locked:'");
  });

  it('la fenêtre par défaut est 72 h (décision fondateur), jamais une valeur inventée', () => {
    const body = sweepBody();
    expect(body).toContain('72 * 60');
  });

  it('la demande expirée est DITE et n’attend plus (plus de « En attente » éternel)', () => {
    expect(BUYER).toContain('requestClosed');
    expect(BUYER).toContain('Demande expirée');
    expect(BUYER).toContain("requestStatus === 'expired'");
    // Le compte à rebours ne s'affiche plus une fois la demande close.
    expect(BUYER).toContain('!requestClosed && requestCountdownLabel');
  });
});
