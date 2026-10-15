// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * NOTIF-REPLY (fondateur 2026-10-15) — « le vendeur répond mais rien ne se passe ».
 *
 * Défaut mesuré : la carte d'une demande DÉJÀ répondue gardait le MÊME formulaire
 * (« Envoyer la réponse ») que la demande neuve — `SellerReplyV13` ne lisait JAMAIS
 * `responseStatus` (0 occurrence). Le vendeur ne voyait donc aucun changement après
 * avoir répondu : son geste semblait ne rien produire.
 *
 * Ce garde verrouille : une demande répondue DIT qu'elle est répondue (et avec quel
 * statut), et ne re-propose plus le formulaire d'envoi.
 */
vi.mock('../auth', () => ({ getAuthToken: async () => 'test-token' }));
vi.mock('./api', () => ({
  getSellerAvailabilityQueue: vi.fn(),
  requestSellerAvailabilityResponse: vi.fn(),
}));

import { getSellerAvailabilityQueue } from './api';
import { SellerReplyV13 } from './SellerReplyV13';
import type { SellerAvailabilityRequest } from './types';

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

const text = () => container.textContent ?? '';

function baseRequest(over: Partial<SellerAvailabilityRequest>): SellerAvailabilityRequest {
  return {
    id: 'req-1', facilityId: 'fac-1', facilityName: 'Boutique A', facilityCategory: 'Marché',
    facilityTrust: 'confirmed', facilityPlan: 'free', productId: 'prod-1', productName: 'Riz au soja',
    availableStock: 5, listedPriceMinor: 100000,
    requestedQuantity: 1, budgetMode: 'unlimited', budgetMinor: null, proposedPriceMinor: null,
    likelierPriceKind: 'fixe', deliveryMode: 'retrait', requestNote: null,
    requestStatus: 'submitted', createdAt: '2026-10-15T14:05:23Z', expiresAt: '2026-10-15T14:20:23Z',
    responseStatus: null, responseObservedAt: null, freshness: 'fresh',
    ...over,
  };
}

async function renderWith(requests: SellerAvailabilityRequest[]) {
  (getSellerAvailabilityQueue as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, data: { authorized: true, requests } });
  await act(async () => { root.render(<SellerReplyV13 onClose={() => {}} />); });
  await act(async () => { await Promise.resolve(); });
}

describe('SellerReplyV13 — une demande répondue le DIT', () => {
  it('une demande NEUVE propose le formulaire d’envoi', async () => {
    await renderWith([baseRequest({ id: 'new', responseStatus: null })]);
    expect(text()).toContain('Envoyer la réponse');
  });

  it('REGRESSION : une demande déjà répondue dit « Répondu » et n’a plus le formulaire', async () => {
    await renderWith([baseRequest({ id: 'done', responseStatus: 'available', responseObservedAt: '2026-10-15T14:21:51Z' })]);
    expect(text()).toContain('Répondu');
    expect(text()).toContain('Disponible'); // le statut donné
    expect(text()).not.toContain('Envoyer la réponse');
  });

  it('une demande répondue « indisponible » le nomme', async () => {
    await renderWith([baseRequest({ id: 'no', responseStatus: 'unavailable', responseObservedAt: '2026-10-15T14:21:51Z' })]);
    expect(text()).toContain('Indisponible');
    expect(text()).not.toContain('Envoyer la réponse');
  });
});

/**
 * NOTIF-REPLY-2 — « le vendeur ne peut TOUJOURS pas répondre » (fondateur 2026-10-15).
 *
 * Défaut mesuré sur la canonique : demande de 3 « Riz au soja », stock réel **1**.
 * Le formulaire partait avec quantité/prix VIDES → le serveur refusait (« requires a
 * positive quantity and non-negative price »), et une quantité de 3 (la demande) était
 * refusée au nom du stock sous le message trompeur « not authorized ».
 */
describe('SellerReplyV13 — la réponse part d’un état réellement envoyable', () => {
  it('pré-remplit la quantité au plus offertable et le prix affiché (stock < demande)', async () => {
    await renderWith([baseRequest({ id: 'partial', requestedQuantity: 3, availableStock: 1, listedPriceMinor: 100000 })]);
    const qty = container.querySelector('input[placeholder="Qté dispo"]') as HTMLInputElement;
    const price = container.querySelector('input[placeholder="Prix (FCFA)"]') as HTMLInputElement;
    expect(qty.value).toBe('1'); // jamais 3 : le stock ne le permet pas
    expect(price.value).toBe('1000'); // 100000 minor / 100
    expect(text()).toContain('Stock offertable');
  });

  it('stock suffisant ⇒ quantité = demande, statut Disponible', async () => {
    await renderWith([baseRequest({ id: 'full', requestedQuantity: 2, availableStock: 5, listedPriceMinor: 50000 })]);
    const qty = container.querySelector('input[placeholder="Qté dispo"]') as HTMLInputElement;
    expect(qty.value).toBe('2');
  });

  it('stock nul ⇒ seule « Indispo » est proposée (aucune quantité mensongère)', async () => {
    await renderWith([baseRequest({ id: 'zero', requestedQuantity: 2, availableStock: 0, listedPriceMinor: 50000 })]);
    // Le champ quantité n'est pas rendu en mode Indispo.
    expect(container.querySelector('input[placeholder="Qté dispo"]')).toBeNull();
    expect(text()).toContain('0');
  });
});
