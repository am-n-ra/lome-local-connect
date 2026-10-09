// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Console d'import admin — preuve de RENDU (pas seulement de source) : l'historique des runs
 * se charge, la saisie est validée côté client, et l'import appelle la vraie fonction batch.
 * On mocke la frontière réseau (`../auth`, `./api`) — la validation JSON est le code réel.
 */
vi.mock('../auth', () => ({ getAuthToken: async () => 'test-token' }));
vi.mock('./api', () => ({
  getOperatorRuns: vi.fn(),
  importPublicFacilityBatch: vi.fn(),
}));

import { getOperatorRuns, importPublicFacilityBatch } from './api';
import { AdminImportConsole } from './AdminImportConsole';

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

// React lit la valeur via son tracker : il faut passer par le setter natif, sinon
// l'événement  est ignoré (le state ne voit pas la nouvelle valeur).
function setValue(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('AdminImportConsole — l’import public est visible et traçable', () => {
  it('charge l’historique des runs et l’affiche', async () => {
    (getOperatorRuns as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      data: { authorized: true, runs: [{ id: 'r1', operation: 'public-facility-import', provider: 'openstreetmap', outcome: 'success', resultCount: 12, errorClass: null, startedAt: '2026-10-07T00:00:00Z', finishedAt: '2026-10-07T00:01:00Z' }] },
    });
    await act(async () => { root.render(<AdminImportConsole />); });
    expect(getOperatorRuns).toHaveBeenCalledWith({ token: 'test-token' });
    expect(text()).toContain('public-facility-import');
    expect(text()).toContain('12 résultat');
  });

  it('refuse un JSON invalide sans appeler le serveur', async () => {
    (getOperatorRuns as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, data: { authorized: true, runs: [] } });
    await act(async () => { root.render(<AdminImportConsole />); });
    const textarea = container.querySelector('textarea')!;
    await act(async () => { setValue(textarea, '{not json'); });
    const button = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Importer'))!;
    await act(async () => { button.click(); });
    expect(importPublicFacilityBatch).not.toHaveBeenCalled();
    expect(text()).toContain('JSON est invalide');
  });

  it('importe un tableau valide et affiche le compte rendu', async () => {
    (getOperatorRuns as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, data: { authorized: true, runs: [] } });
    (importPublicFacilityBatch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      data: { imported: 1, created: 1, existing: 0, results: [{ runId: 'run1', facilityId: 'fac-new', sourceRef: 'osm:node/1', created: true, trust: 'unclaimed' }] },
    });
    await act(async () => { root.render(<AdminImportConsole />); });
    const textarea = container.querySelector('textarea')!;
    await act(async () => { setValue(textarea, JSON.stringify([{ sourceRef: 'osm:node/1', name: 'Boutique Kodjo', latitude: 6.13, longitude: 1.22 }])); });
    const button = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Importer'))!;
    await act(async () => { button.click(); });
    expect(importPublicFacilityBatch).toHaveBeenCalledTimes(1);
    const call = (importPublicFacilityBatch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.items).toHaveLength(1);
    expect(call.items[0].sourceRef).toBe('osm:node/1');
    expect(text()).toContain('créé');
  });
});
