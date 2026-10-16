import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// TXN-G6 (GAP-6) — l'échéance de 15 min de la demande de disponibilité était exposée
// par l'API mais rendue NULLE PART : l'acheteur voyait « En attente » sans savoir qu'un
// compte tournait, et le vendeur ignorait le délai. Ce garde verrouille le RENDU des
// deux côtés — un délai qu'on subit sans le savoir est une disparition, pas un délai.

const BUYER = readFileSync(new URL('./BuyerFlowV13.tsx', import.meta.url), 'utf8');
const SELLER = readFileSync(new URL('./SellerReplyV13.tsx', import.meta.url), 'utf8');

describe('TXN-G6 — le délai de la demande est visible des deux côtés', () => {
  it('l’acheteur voit le temps restant (jamais un « En attente » muet)', () => {
    expect(BUYER).toContain('requestCountdownLabel');
    expect(BUYER).toContain('requestExpiresAt');
    // L'échéance vient de la réponse réelle, jamais inventée.
    expect(BUYER).toContain('result.data.expiresAt');
  });

  it('le vendeur voit le temps restant pour répondre', () => {
    expect(SELLER).toContain('requestCountdownLabel');
    expect(SELLER).toContain('request.expiresAt');
  });

  it('le compte à rebours se rafraîchit (un chiffre figé mentirait)', () => {
    expect(BUYER).toContain('nowTick');
    expect(BUYER).toContain('setInterval');
    expect(BUYER).toContain('30_000');
  });
});
