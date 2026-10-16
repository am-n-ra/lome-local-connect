import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pushMessageFor } from '../server/web-push';

// TXN-G7 (GAP-7 du registre `omni-transaction-gaps-register-2026-10-15.md`)
//
// Défaut mesuré : `sweepExpiredIntents` expirait une intention et libérait le stock
// SANS notifier personne (mesuré en base : 0 événement d'expiration, 2 types seulement).
// L'acheteur croyait sa demande vivante ; le vendeur ignorait que sa réponse était morte.
// Ce garde verrouille le producteur ET la cible du tap (NR-8).

const REPO = readFileSync(new URL('../server/trunk-repository.ts', import.meta.url), 'utf8');
const SWEEP = REPO.slice(REPO.indexOf('async sweepExpiredIntents'), REPO.indexOf('async getOrCreateCreditStanding'));

describe('TXN-G7 — l’expiration notifie les deux parties', () => {
  it('le balayage écrit les deux producteurs (acheteur ET vendeur)', () => {
    expect(SWEEP).toContain("'availability_request_expired'");
    expect(SWEEP).toContain("'availability_response_lapsed'");
    expect(SWEEP).toContain('v2_notification_events');
    // Le producteur est ancré sur l'expiration réelle (idempotent) : pas un avis fantôme.
    expect(SWEEP).toContain('join intent_expired ie on ie.id = st.intent_id');
  });

  it('le push de chaque partie dit vrai et ne promet pas une alerte impossible', () => {
    const buyer = pushMessageFor({ kind: 'availability_request_expired' }, { entityType: 'availability_request', entityId: 'req-1' });
    expect(buyer.body).toContain('Rien n’a été débité');
    expect(buyer.url).toContain('request=req-1');
    const seller = pushMessageFor({ kind: 'availability_response_lapsed' }, { entityType: 'availability_request', entityId: 'req-1' });
    expect(seller.body).toContain('libéré');
    expect(seller.url).toContain('request=req-1');
  });

  it('le push web n’est créé que si un abonnement actif existe', () => {
    // La même garde que BRANCHES-NOTIF-1 : on ne crée pas de livraison zombie.
    expect(SWEEP).toContain('expiry_push');
    expect(SWEEP).toContain("s.permission_state = 'granted' and s.revoked_at is null");
  });
});
