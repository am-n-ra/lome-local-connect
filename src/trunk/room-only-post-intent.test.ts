import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * POINTS 1 & 3 (2026-10-16) — la Room est la SEULE surface post-intention.
 *
 * Point 1 : `BuyerFlowV13` dupliquait le suivi (chat tronqué `.slice(-4)`, QR,
 * paiement, avis) alors que `TransactionRoom` porte déjà tout cela, en mieux (fil
 * complet, actions acteur). Le flux s'arrête désormais à l'INTENTION : ces gardes
 * échouent si une étape transactionnelle réapparaît dans le flux.
 *
 * Point 3 : la reprise d'une transaction ouverte (`resumeTransaction`) ouvrait le
 * suivi court du flux ; elle doit ouvrir la ROOM — et LIRE le rôle (acheteur OU
 * vendeur) dans le snapshot, jamais le supposer.
 */

const FLOW = readFileSync(new URL('./BuyerFlowV13.tsx', import.meta.url), 'utf8');
const APP = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');

describe('POINT 1 — le flux d’achat s’arrête à l’intention', () => {
  it('ne connaît plus les étapes transactionnelles (txn/qr/pay/rate)', () => {
    // La ligne de type `Stage` est la source de vérité du périmètre du flux.
    expect(FLOW).toMatch(/type Stage = 'avail' \| 'pending' \| 'result' \| 'intent';/);
    for (const dead of ["'txn'", "'qr'", "'pay'", "'rate'"]) {
      expect(FLOW, `l'étape ${dead} ne doit plus exister dans la définition du flux`).not.toContain(`| ${dead}`);
    }
  });

  it('n’importe plus les appels de transaction (chat, QR, paiement, avis)', () => {
    for (const dead of ['sendTransactionMessage', 'issueBuyerQrToken', 'revokeQrToken', 'verifyQrToken', 'declareExternalPayment', 'confirmExternalPayment', 'submitTransactionRating']) {
      expect(FLOW, `${dead} ne doit plus être importé par le flux`).not.toContain(dead);
    }
  });

  it('n’a plus de chat tronqué (le fil complet vit dans la Room)', () => {
    expect(FLOW, 'aucun message ne doit être tronqué dans le flux').not.toContain('slice(-4)');
    expect(FLOW).not.toContain('chatDraft');
  });

  it('ouvre la Room à la confirmation de l’intention, sans repli silencieux', () => {
    expect(FLOW).toContain('if (onRoom) { onRoom(intent.data.transactionId); return; }');
    // Le repli qui simule un suivi dans le flux a disparu : sans Room, on le DIT.
    expect(FLOW).not.toContain("setStage('qr')");
    expect(FLOW).not.toContain('setQrToken(');
  });
});

describe('POINT 3 — la reprise ouvre la Room, jamais le flux', () => {
  it('resumeTransaction ouvre la Room et lit le rôle dans le snapshot', () => {
    // Le corps doit appeler openRoom (et non setSheet('flow') + setPendingResumeTxnId).
    expect(APP).toMatch(/await openRoom\(\{[\s\S]*?actorRole: result\.data\.actorRole/);
    expect(APP).not.toContain('setPendingResumeTxnId');
  });

  it('le flux n’a plus de prop de reprise de transaction (`resumeTxnId`)', () => {
    expect(FLOW).not.toContain('resumeTxnId');
    expect(APP).not.toMatch(/<BuyerFlowV13[^>]*resumeTxnId/);
  });
});
