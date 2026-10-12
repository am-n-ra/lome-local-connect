// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WelcomeV13 } from './WelcomeV13';

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
});

function render(props: Parameters<typeof WelcomeV13>[0]) {
  act(() => {
    root.render(<WelcomeV13 {...props} />);
  });
}

describe('WelcomeV13 — accueil après création (BRANCHES onboarding)', () => {
  it('salue par le prénom quand il est fourni', () => {
    render({ firstName: 'Ama', onExplore: () => {}, onPublish: () => {}, onClose: () => {} });
    expect(container.textContent).toContain('Bienvenue, Ama.');
  });

  it('reste honnête sans prénom (jamais un « Bienvenue, undefined »)', () => {
    render({ firstName: null, onExplore: () => {}, onPublish: () => {}, onClose: () => {} });
    expect(container.textContent).toContain('Bienvenue sur Omni.');
    expect(container.textContent).not.toContain('undefined');
  });

  it('offre les deux gestes réels : explorer et publier', () => {
    render({ firstName: null, onExplore: () => {}, onPublish: () => {}, onClose: () => {} });
    const labels = [...container.querySelectorAll('button')].map((b) => b.textContent || '');
    expect(labels.some((t) => /Explorer la carte/.test(t))).toBe(true);
    expect(labels.some((t) => /Publier ce que je vends/.test(t))).toBe(true);
  });

  it('ne propose AUCUN choix de plan (S-31 : on publie tôt, le Pro se paie quand on en a besoin)', () => {
    render({ firstName: null, onExplore: () => {}, onPublish: () => {}, onClose: () => {} });
    expect(container.textContent).not.toMatch(/Pro\b|plan|abonnement/i);
  });

  it('« Publier » déclenche le geste réel, pas une promesse', () => {
    let published = false;
    render({ firstName: null, onExplore: () => {}, onPublish: () => { published = true; }, onClose: () => {} });
    const btn = [...container.querySelectorAll('button')].find((b) => /Publier ce que je vends/.test(b.textContent || ''));
    act(() => btn?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(published).toBe(true);
  });
});
