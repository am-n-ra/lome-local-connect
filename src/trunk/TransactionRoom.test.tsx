// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * X3 (S-27) — preuve de RENDU (pas seulement de source) : la Room affiche l'étape, le
 * fil complet et les actions selon le rôle et l'état. On mocke la frontière réseau
 * (`../auth`, `./api`) — aucune logique métier n'est mockée : les libellés viennent de
 * `transaction-time` (module réel) et l'état de la transaction mockée.
 */
vi.mock('../auth', () => ({ getAuthToken: async () => 'test-token' }));
vi.mock('./api', () => ({
  getTransaction: vi.fn(),
  getTransactionMessages: vi.fn(),
  sendTransactionMessage: vi.fn(),
  transitionTransaction: vi.fn(),
  declareExternalPayment: vi.fn(),
  confirmExternalPayment: vi.fn(),
  submitTransactionRating: vi.fn(),
  issueBuyerQrToken: vi.fn(),
  revokeQrToken: vi.fn(),
  qrPayload: (transactionId: string, token: string) => `${transactionId}:${token}`,
}));

import { confirmExternalPayment, getTransaction, getTransactionMessages, transitionTransaction } from './api';
import { TransactionRoom } from './TransactionRoom';
import type { TransactionSnapshotResult } from './types';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

const snapshot = (state: TransactionSnapshotResult['state']): TransactionSnapshotResult => ({
  transactionId: '11111111-2222-3333-4444-555555555555',
  state,
  actorRole: 'buyer',
  productId: 'p-1',
  facilityId: 'f-1',
  quantity: 2,
  unitPriceMinor: 1000,
  couponCode: null,
  netAmountMinor: 2000,
  sellerContactPhone: null,
  sellerContactWhatsapp: null,
  sellerFacilityName: 'Épicerie Chez Afi',
});

const messages = [
  { id: 'm1', transactionId: 't', senderRole: 'buyer' as const, body: 'Bonjour, toujours dispo ?', createdAt: '2026-10-07T09:00:00Z', seenAt: null },
  { id: 'm2', transactionId: 't', senderRole: 'seller' as const, body: 'Oui, je prépare.', createdAt: '2026-10-07T09:02:00Z', seenAt: null },
  { id: 'm3', transactionId: 't', senderRole: 'buyer' as const, body: 'Merci !', createdAt: '2026-10-07T09:03:00Z', seenAt: null },
  { id: 'm4', transactionId: 't', senderRole: 'seller' as const, body: 'À tout de suite.', createdAt: '2026-10-07T09:05:00Z', seenAt: null },
  { id: 'm5', transactionId: 't', senderRole: 'buyer' as const, body: 'Cinquième message', createdAt: '2026-10-07T09:07:00Z', seenAt: null },
];

async function renderRoom(actorRole: 'buyer' | 'seller', state: TransactionSnapshotResult['state']) {
  (getTransaction as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, data: snapshot(state) });
  (getTransactionMessages as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, data: { transactionId: 't', messages } });
  await act(async () => {
    root.render(
      <TransactionRoom
        transactionId="11111111-2222-3333-4444-555555555555"
        token="test-token"
        actorRole={actorRole}
        counterparty={actorRole === 'buyer' ? 'Épicerie Chez Afi' : 'Acheteur'}
        onClose={() => {}}
      />,
    );
  });
}

const text = () => container.textContent ?? '';

describe('TransactionRoom — S-27, surface symétrique acheteur/vendeur', () => {
  it("affiche le fil COMPLET — le premier message, que le plafond à 4 du flux coupait", async () => {
    await renderRoom('buyer', 'qr_ready');
    // `slice(-4)` sur 5 messages laisse m2..m5 et perd m1 : c'est m1 qui prouve le fil complet.
    expect(text()).toContain('Bonjour, toujours dispo ?');
    expect(text()).toContain('Cinquième message');
    expect(text()).toContain('Conversation de cette transaction');
  });

  it('côté VENDEUR avec un paiement déclaré : bouton « Confirmer le paiement »', async () => {
    await renderRoom('seller', 'payment_declared');
    expect(text()).toContain('Confirmer le paiement');
    // l'acheteur ne confirme jamais son propre paiement
    expect(text()).not.toContain('Votre QR de transaction');
  });

  it("côté VENDEUR à l'exécution : bouton « Marquer la remise »", async () => {
    await renderRoom('seller', 'fulfilment_pending');
    expect(text()).toContain('Marquer la remise');
  });

  it("côté ACHETEUR à la réception : bouton « Confirmer la réception »", async () => {
    await renderRoom('buyer', 'fulfilled');
    expect(text()).toContain('Confirmer la réception');
  });

  it('transaction clôturée : signaler un problème désactivé honnête, aucune action', async () => {
    await renderRoom('buyer', 'closed');
    expect(text()).toContain('Signaler un problème · bientôt');
    expect(text()).not.toContain('Confirmer la réception');
  });

  it('un refus serveur honnête est affiché, pas un succès silencieux', async () => {
    (getTransaction as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, data: snapshot('payment_declared') });
    (getTransactionMessages as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, data: { transactionId: 't', messages: [] } });
    (confirmExternalPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, data: { confirmed: true } });
    (transitionTransaction as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, error: { message: 'Transition refusée.' } });
    await act(async () => {
      root.render(
        <TransactionRoom transactionId="11111111-2222-3333-4444-555555555555" token="test-token" actorRole="seller" counterparty="Acheteur" onClose={() => {}} />,
      );
    });
    const button = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Confirmer le paiement'));
    await act(async () => { button?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(text()).toContain('Transition refusée.');
  });
});
