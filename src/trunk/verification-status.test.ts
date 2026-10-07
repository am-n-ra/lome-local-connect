import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sellerVerificationBadge, sellerVerificationStep, verificationBadgeLabel, verificationStepLabel } from './verification-status';

/**
 * DS-14 `seller-verif` — deux contrats, l'un pur (fonctions), l'autre une
 * décision d'interface qu'un garde de source doit empêcher de régresser :
 *  1. le badge/étape se DÉRIVENT (aucun stockage), et `certified` (palier interne
 *     S-31) ne peint jamais un badge public plus fort que « confirmée » ;
 *  2. la surface vendeur est LECTURE SEULE (D-OPS-5/3) — la lecture ne touche
 *     aucun badge et n'expose jamais un contact acheteur ni un message.
 *
 * Pourquoi un garde de source : `getSellerVerification` ne peut pas être exercé
 * sans Postgres ici ; le monter pour vérifier une absence coûterait plus qu'il ne
 * prouve. On vérifie la seule chose qui compte — l'absence du geste d'écriture.
 */

describe('sellerVerificationBadge — le badge public dérive de l’état interne', () => {
  it('un badge gagné se lit « confirmée » (certified inclus : palier INTERNE)', () => {
    expect(sellerVerificationBadge('confirmed')).toBe('confirmed');
    expect(sellerVerificationBadge('certified')).toBe('confirmed');
  });

  it('ne peint jamais une confiance non acquise : états transitoires restent « non revendiquée »', () => {
    for (const state of ['unclaimed', 'verification_draft', 'verification_submitted', 'admin_review', 'needs_more_evidence', 'rejected', 'suspended']) {
      expect(sellerVerificationBadge(state)).toBe('unclaimed');
    }
    expect(sellerVerificationBadge('unconfirmed')).toBe('unconfirmed');
  });

  it('les libellés publics sont exactement ceux de la maquette', () => {
    expect(verificationBadgeLabel('confirmed')).toBe('Confirmée');
    expect(verificationBadgeLabel('unconfirmed')).toBe('Non confirmée');
    expect(verificationBadgeLabel('unclaimed')).toBe('Non revendiquée');
  });
});

describe('sellerVerificationStep — l’étape vraie, jamais inventée', () => {
  it('un badge gagné domine tout le reste', () => {
    expect(sellerVerificationStep({ trustState: 'confirmed', requestState: 'draft', visitState: 'a_visiter' })).toBe('badge_settled');
  });

  it('une visite vivante domine une demande en revue', () => {
    expect(sellerVerificationStep({ trustState: 'unconfirmed', requestState: 'admin_review', visitState: 'en_cours' })).toBe('visit_scheduled');
  });

  it('une demande soumise/en revue = « en revue par l’équipe »', () => {
    expect(sellerVerificationStep({ trustState: 'verification_submitted', requestState: 'submitted', visitState: null })).toBe('in_review');
    expect(sellerVerificationStep({ trustState: 'verification_submitted', requestState: 'admin_review', visitState: null })).toBe('in_review');
  });

  it('preuves à compléter ou entité unconfirmed = preuves en cours', () => {
    expect(sellerVerificationStep({ trustState: 'verification_draft', requestState: 'needs_more_evidence', visitState: null })).toBe('evidence_pending');
    expect(sellerVerificationStep({ trustState: 'unconfirmed', requestState: null, visitState: null })).toBe('evidence_pending');
  });

  it('rien de demandé = pas encore demandée', () => {
    expect(sellerVerificationStep({ trustState: 'unclaimed', requestState: null, visitState: null })).toBe('not_requested');
  });

  it('le seuil par nature apparaît : commerce 3, particulier sans compteur', () => {
    expect(verificationStepLabel('evidence_pending', { qualifyingSales: 1, requiredCount: 3 }, false)).toContain('1/3');
    expect(verificationStepLabel('evidence_pending', { qualifyingSales: 0, requiredCount: 1 }, false)).toBe('Preuves en cours');
  });
});

const repoSource = readFileSync(new URL('../server/trunk-repository.ts', import.meta.url), 'utf8');
const sheetSource = readFileSync(new URL('./SellerVerificationV13.tsx', import.meta.url), 'utf8');

function sellerVerificationRead(): string {
  const start = repoSource.indexOf('async getSellerVerification');
  const end = repoSource.indexOf('async getTransaction', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return repoSource.slice(start, end);
}

describe('DS-14 — la surface vendeur de vérification est LECTURE SEULE (D-OPS-5/3)', () => {
  it('la lecture ne contient aucune écriture (pas de badge, pas de visite touchés)', () => {
    const read = sellerVerificationRead().toLowerCase();
    expect(read).not.toMatch(/\binsert into\b/);
    expect(read).not.toMatch(/\bupdate\s/);
    expect(read).not.toMatch(/\bdelete from\b/);
  });

  it('n’expose jamais un contact acheteur ni un message', () => {
    const read = sellerVerificationRead();
    expect(read).not.toContain('contact_phone');
    expect(read).not.toContain('contact_whatsapp');
    expect(read).not.toContain('v2_transaction_messages');
    expect(sheetSource).not.toContain('contactPhone');
    expect(sheetSource).not.toContain('contactWhatsapp');
  });
});
