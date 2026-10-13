// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PlansCompareV13 } from './PlansCompareV13';

let container: HTMLDivElement;
let root: Root;

const currency = { currency: 'XOF', ratePerUsdMinor: 500, locale: 'fr-TG', decimals: 0, symbol: 'F' } as never;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('PlansCompareV13 — comparatif Free vs Pro adossé au réel', () => {
  it('acheteur : comparateur 3 contre 10 (Seed V2), bulk 3 contre 100', () => {
    act(() => { root.render(<PlansCompareV13 role="buyer" currency={currency} />); });
    const text = container.textContent || '';
    expect(text).toContain('3 établissements');
    expect(text).toContain('10 établissements');
    const bulk = [...container.querySelectorAll('.plans-row')].find((r) => (r.textContent || '').includes('groupées'));
    expect(bulk, 'ligne bulk introuvable').toBeTruthy();
    const cells = [...(bulk as Element).querySelectorAll('.plans-cell')].map((c) => c.textContent);
    expect(cells).toEqual(['3', '100']);
  });

  it('vendeur : 20 max contre illimitées, emplacements, analytics et campagnes côté Pro', () => {
    act(() => { root.render(<PlansCompareV13 role="seller" currency={currency} />); });
    const text = container.textContent || '';
    expect(text).toContain('20 max');
    expect(text).toContain('Illimitées');
    expect(text).toContain('Emplacements');
    expect(text).toContain('Analytics');
    expect(text).toContain('Campagnes sponsorisées');
    expect(text).toContain('Bonus confiance 20 $');
  });

  it('affiche les prix depuis la source unique (sticker + local)', () => {
    act(() => { root.render(<PlansCompareV13 role="buyer" currency={currency} />); });
    expect(container.textContent).toMatch(/5\s\$US/);
    expect(container.textContent).toMatch(/2\s500/);
    act(() => { root.render(<PlansCompareV13 role="seller" currency={currency} />); });
    expect(container.textContent).toMatch(/10\s\$US/);
    expect(container.textContent).toMatch(/5\s000/);
  });

  it('deux colonnes distinctes (Gratuit | Pro) — pas une ligne `free · pro` ambiguë', () => {
    act(() => { root.render(<PlansCompareV13 role="seller" currency={currency} />); });
    const rows = [...container.querySelectorAll('.plans-row')];
    expect(rows.length).toBeGreaterThanOrEqual(5);
    // Chaque ligne a un libellé + 2 cellules séparées (une par plan).
    for (const row of rows) {
      expect(row.querySelectorAll('.plans-label').length).toBe(1);
      expect(row.querySelectorAll('.plans-cell').length).toBe(2);
    }
    expect(container.querySelectorAll('.plans-head').length).toBe(1);
  });

  it('le comparateur de l’app lit la MÊME constante que le tableau (3/10, plus de dérive)', () => {
    const app = readFileSync(resolve(__dirname, 'TrunkAppV13.tsx'), 'utf8');
    expect(app).toContain('compareQuotaFor');
    expect(app).not.toMatch(/pro_active'\s*\?\s*5\s*:\s*1/);
    const inv = readFileSync(resolve(__dirname, '../domain/invariants.ts'), 'utf8');
    expect(inv).toMatch(/COMPARE_QUOTA_FREE\s*=\s*3/);
    expect(inv).toMatch(/COMPARE_QUOTA_PRO\s*=\s*10/);
  });

  it('ne gate rien : aucun bouton d’achat ni verrou dans le tableau', () => {
    act(() => { root.render(<PlansCompareV13 role="buyer" currency={currency} />); });
    const labels = [...container.querySelectorAll('button')].map((b) => b.textContent || '');
    expect(labels.length).toBe(0);
  });

  it('chaque rôle voit SON comparatif, et l’équipe voit les deux (fondateur 2026-10-07)', () => {
    const app = readFileSync(resolve(__dirname, 'TrunkAppV13.tsx'), 'utf8');
    // Branche acheteur + branche équipe : 2 montages buyer ; branche vendeur +
    // branche équipe : 2 montages seller. Un seul ne suffit pas.
    expect(app.match(/<PlansCompareV13 role="buyer"/g)?.length ?? 0).toBe(2);
    expect(app.match(/<PlansCompareV13 role="seller"/g)?.length ?? 0).toBe(2);
    // La branche équipe monte les deux tableaux (acheteur + vendeur), pas un stub.
    const teamStart = app.indexOf('>Équipe · acheteur<');
    expect(teamStart, 'branche équipe acheteur introuvable').toBeGreaterThan(-1);
    const teamSlice = app.slice(teamStart, teamStart + 1200);
    expect(teamSlice).toContain('<PlansCompareV13 role="buyer"');
    expect(teamSlice).toContain('<PlansCompareV13 role="seller"');
  });
});
