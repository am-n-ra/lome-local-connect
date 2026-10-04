// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RecoveryCartRow, RecoverySearchRow, RecoveryTxnsRow } from './RecoveryV13';
import type { OpenTransactionSummary, PublicFacility } from './types';

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

const facility = { id: 'facility-1', name: 'Boutique Kodjo' } as PublicFacility;

const openTx: OpenTransactionSummary = {
  transactionId: 'txn-1', state: 'qr_verified', actorRole: 'buyer', productId: 'product-1',
  productName: 'Spaghetti', facilityId: 'facility-1', facilityName: 'Boutique Kodjo',
  quantity: 2, netAmountMinor: 1700, lastEventAt: new Date().toISOString(),
  createdAt: new Date(Date.now() - 3600000).toISOString(),
};

describe('recovery sheet contract (maquette recovery)', () => {
  it('states an empty cart, search and transaction list honestly', async () => {
    await act(async () => {
      root.render(
        <>
          <RecoveryCartRow carts={{}} facilities={[]} onOpenFacility={() => undefined} />
          <RecoverySearchRow lastQuery="" onResume={() => undefined} />
          <RecoveryTxnsRow transactions={[]} state="idle" onResume={() => undefined} />
        </>,
      );
    });
    const text = container.textContent ?? '';
    expect(text).toContain('Vide');
    expect(text).toContain('Aucune');
  });

  it('reopens a vendor cart, the last search and a live transaction', async () => {
    const onOpenFacility = vi.fn();
    const onResumeSearch = vi.fn();
    const onResumeTxn = vi.fn();
    await act(async () => {
      root.render(
        <>
          <RecoveryCartRow carts={{ 'facility-1': ['product-1', 'product-2'] }} facilities={[facility]} onOpenFacility={onOpenFacility} />
          <RecoverySearchRow lastQuery="boulangerie" onResume={onResumeSearch} />
          <RecoveryTxnsRow transactions={[openTx]} state="idle" onResume={onResumeTxn} />
        </>,
      );
    });
    const text = container.textContent ?? '';
    expect(text).toContain('Conservé (2 produits)');
    expect(text).toContain('Boutique Kodjo');
    expect(text).toContain('boulangerie');
    expect(text).toContain('Revenir à ma recherche');
    const buttons = [...container.querySelectorAll('button')];
    await act(async () => {
      buttons.find((b) => b.textContent?.includes('Revoir'))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onOpenFacility).toHaveBeenCalledTimes(1);
    await act(async () => {
      buttons.find((b) => b.textContent?.includes('Revenir'))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onResumeSearch).toHaveBeenCalledWith('boulangerie');
    await act(async () => {
      buttons.find((b) => b.textContent?.includes('Reprendre'))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onResumeTxn).toHaveBeenCalledTimes(1);
  });

  it('names an off-view vendor without inventing a tap target', async () => {
    await act(async () => {
      root.render(
        <RecoveryCartRow carts={{ 'facility-9': ['product-1'] }} facilities={[facility]} onOpenFacility={() => undefined} />,
      );
    });
    const text = container.textContent ?? '';
    expect(text).toContain('Vendeur hors vue');
    expect(container.querySelectorAll('button').length).toBe(0);
  });
});
