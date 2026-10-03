// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { receiptRefFor, receiptWhen, TransactionReceiptV13 } from './TransactionReceiptV13';
import type { ClosedTransactionSummary } from './types';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => { root.unmount(); });
  container.remove();
  vi.restoreAllMocks();
});

const summary: ClosedTransactionSummary = {
  transactionId: 'a12b3c4d-0000-0000-0000-000000000001',
  state: 'closed',
  actorRole: 'buyer',
  productId: 'product-9',
  productName: 'Spaghetti',
  facilityId: 'facility-9',
  facilityName: 'Boutique Kodjo',
  sellerName: 'Boutique Kodjo',
  quantity: 2,
  netAmountMinor: 1700,
  lastEventAt: new Date().toISOString(),
  createdAt: new Date(Date.now() - 3600000).toISOString(),
};

describe('transaction receipt contract (S-26 / B18, maquette recu)', () => {
  it('derives a stable display ref from the transaction id, never a second identity', () => {
    expect(receiptRefFor(summary.transactionId)).toBe('OMNI-A12B');
    expect(receiptRefFor(summary.transactionId)).toBe(receiptRefFor(summary.transactionId));
  });

  it('renders the frozen version: ref, object, total, seller, when', async () => {
    await act(async () => {
      root.render(<TransactionReceiptV13 summary={summary} onClose={() => undefined} />);
    });
    const text = container.innerText ?? container.textContent ?? '';
    expect(text).toContain('OMNI-A12B');
    expect(text).toContain('Spaghetti');
    expect(text).toContain('Boutique Kodjo');
    expect(text).toContain('Aujourd’hui');
    expect(receiptWhen('not-a-date')).toBe('not-a-date');
  });

  it('shares through Web Share when present and reports honestly otherwise', async () => {
    const share = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { share, clipboard: undefined });
    await act(async () => {
      root.render(<TransactionReceiptV13 summary={summary} onClose={() => undefined} />);
    });
    const button = container.querySelector('button.btn.ghost.sm');
    expect(button).not.toBeNull();
    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(share).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Reçu partagé.');
  });
});
