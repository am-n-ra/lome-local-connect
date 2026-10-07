// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * DS-14 `seller-verif` — preuve de RENDU (pas seulement de source) : monté dans
 * jsdom, le sheet lit l'état réel du serveur et affiche le badge/étape dérivés.
 * On mocke la frontière réseau (`../auth`, `./api`) — pas de logique métier
 * mockée : la dérivation (badge/étape) est le module réel `verification-status`.
 */
vi.mock('../auth', () => ({ getAuthToken: async () => 'test-token' }));
vi.mock('./api', () => ({
  getSellerCatalogue: async () => ({ ok: true, data: { authorized: true, catalogReady: true, facilities: [{ id: 'fac-1', name: 'Boutique Kodjo' }], products: [] } }),
  getSellerVerification: vi.fn(),
}));

import { getSellerVerification } from './api';
import { SellerVerificationV13 } from './SellerVerificationV13';

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

async function renderUi(data: unknown) {
  (getSellerVerification as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, data });
  await act(async () => { root.render(<SellerVerificationV13 onClose={() => {}} />); });
}

const text = () => container.textContent ?? '';

describe('SellerVerificationV13 — le badge/étape viennent de l’état réel', () => {
  it('renders the three maquette facts: badge, dateable step, evidence threshold', async () => {
    await renderUi({
      facilityId: 'fac-1', facilityName: 'Boutique Kodjo', subjectType: 'verification',
      trustState: 'verification_submitted', qualifyingSales: 1, requiredCount: 3,
      requestState: 'admin_review', visitState: 'a_visiter', visitZone: 'Adawlato', visitDate: '2026-10-07T09:00:00Z',
    });
    expect(text()).toContain('État de votre vérification');
    expect(text()).toContain('Boutique Kodjo');
    expect(text()).toContain('Non revendiquée'); // verification_submitted n'est pas encore un badge gagné
    expect(text()).toContain('Visite terrain programmée');
    expect(text()).toContain('Adawlato');
    expect(text()).toContain('3 ventes');
  });

  it('a confirmed entity reads « Confirmée » and the settled step', async () => {
    await renderUi({
      facilityId: 'fac-1', facilityName: 'Boutique Kodjo', subjectType: 'verification',
      trustState: 'certified', qualifyingSales: 3, requiredCount: 3,
      requestState: null, visitState: null, visitZone: null, visitDate: null,
    });
    expect(text()).toContain('Confirmée');
    expect(text()).toContain('Vérification confirmée');
  });

  it('a read error is announced, never a fabricated badge', async () => {
    (getSellerVerification as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, error: { code: 'POLICY_REJECTED', message: 'Facility not found or not owned by the current user.' } });
    await act(async () => { root.render(<SellerVerificationV13 onClose={() => {}} />); });
    expect(text()).toContain('not owned');
    expect(text()).not.toContain('Confirmée');
  });
});
