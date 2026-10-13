// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
  it('acheteur : comparateur 1 contre 5, bulk 3 contre 100', () => {
    act(() => { root.render(<PlansCompareV13 role="buyer" currency={currency} />); });
    const text = container.textContent || '';
    expect(text).toContain('1 établissement');
    expect(text).toContain('5 établissements');
    expect(text).toMatch(/3\s*·\s*100|3.*100/);
  });

  it('vendeur : 20 max contre illimitées, dispo en direct et campagnes côté Pro', () => {
    act(() => { root.render(<PlansCompareV13 role="seller" currency={currency} />); });
    const text = container.textContent || '';
    expect(text).toContain('20 max');
    expect(text).toContain('Illimitées');
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

  it('ne gate rien : aucun bouton d’achat ni verrou dans le tableau', () => {
    act(() => { root.render(<PlansCompareV13 role="buyer" currency={currency} />); });
    const labels = [...container.querySelectorAll('button')].map((b) => b.textContent || '');
    expect(labels.length).toBe(0);
  });
});
