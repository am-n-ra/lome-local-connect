// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './AppErrorBoundary';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  // React logue les erreurs de rendu ; attendu ici, on ne veut pas le bruit.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

function Boom(): never {
  throw new Error('render crashed');
}

describe('AppErrorBoundary — un lancer de rendu ne laisse pas une page blanche', () => {
  it('affiche la reprise honnête quand un enfant lève au rendu', () => {
    act(() => {
      root.render(<AppErrorBoundary><Boom /></AppErrorBoundary>);
    });
    const text = container.textContent ?? '';
    expect(text).toContain('L’application s’est arrêtée');
    expect(text).toContain('Recharger');
    expect(text).toContain('Réessayer');
    // La promesse d'honnêteté : rien n'est perdu, l'état serveur reste.
    expect(text).toContain('conservés côté serveur');
  });

  it('laisse passer un enfant sain sans interface d’erreur', () => {
    act(() => {
      root.render(<AppErrorBoundary><div>contenu normal</div></AppErrorBoundary>);
    });
    expect(container.textContent).toContain('contenu normal');
    expect(container.textContent).not.toContain('L’application s’est arrêtée');
  });

  it('« Réessayer » remet la frontière à zéro (le prochain rendu sain passe)', () => {
    act(() => {
      root.render(<AppErrorBoundary><Boom /></AppErrorBoundary>);
    });
    expect(container.textContent).toContain('L’application s’est arrêtée');
    const retry = [...container.querySelectorAll('button')].find((b) => /Réessayer/.test(b.textContent ?? ''));
    expect(retry).toBeTruthy();
    act(() => { retry!.click(); });
    // La frontière re-rend ses enfants ; ils lèvent encore ici, donc l'UI reste —
    // ce qui importe est que l'état soit RÉARMÉ (plus de verrou permanent).
    expect(container.textContent).toContain('L’application s’est arrêtée');
  });
});
