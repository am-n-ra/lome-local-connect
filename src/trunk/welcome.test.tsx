// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getPublicStats = vi.fn(async () => ({ ok: true as const, data: { facilities: 13743, offers: 10 } }));
vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>();
  return { ...actual, getPublicStats: () => getPublicStats() };
});

import { WelcomeV13, WELCOME_SEARCH_EXAMPLES } from './WelcomeV13';

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

const base = {
  firstName: 'Ama',
  onChooseRole: () => {},
  onTrySearch: () => {},
  onOpenPlans: () => {},
  onShare: async () => null,
  onExplore: () => {},
  onPublish: () => {},
  onClose: () => {},
};

function buttons() {
  return [...container.querySelectorAll('button')].map((b) => b.textContent || '');
}

function click(pattern: RegExp) {
  act(() => {
    [...container.querySelectorAll('button')].find((b) => pattern.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

/** 1 → 2 (rôle) → 3 (comment ça marche) : chemin commun jusqu'au guide. */
function advanceToGuide(role: 'buyer' | 'seller') {
  click(/Continuer/);
  click(role === 'buyer' ? /Je cherche autour de moi/ : /Je propose quelque chose/);
}

describe('WelcomeV13 — parcours immersif après création (moments réels)', () => {
  it('salue par le prénom quand il est fourni', () => {
    render(base);
    expect(container.textContent).toContain('Bienvenue, Ama.');
  });

  it('reste honnête sans prénom (jamais un « Bienvenue, undefined »)', () => {
    render({ ...base, firstName: null });
    expect(container.textContent).toContain('Bienvenue sur Omni.');
    expect(container.textContent).not.toContain('undefined');
  });

  it('affiche la progression honnête (étape 1 sur 5, dots reflétant l’état réel)', () => {
    render(base);
    expect(container.textContent).toContain('étape 1 sur 5');
    const dots = container.querySelectorAll('.onboard-dot');
    expect(dots.length).toBe(5);
    expect(dots[0].className).toContain('active');
    expect(dots[1].className).not.toContain('active');
  });

  it('montre le VRAI total de lieux (dérivé de getPublicStats), jamais un plafond', async () => {
    render(base);
    await act(async () => { await Promise.resolve(); });
    expect(getPublicStats).toHaveBeenCalled();
    expect(container.textContent).toContain('Lieux connus');
    expect(container.textContent).toContain('13743');
  });

  it('le moment 2 propose les deux rôles, et le choix appelle le vrai routage', () => {
    const onChooseRole = vi.fn();
    render({ ...base, onChooseRole });
    click(/Continuer/);
    expect(container.textContent).toContain('étape 2 sur 5');
    const labels = buttons();
    expect(labels.some((t) => /Je cherche autour de moi/.test(t))).toBe(true);
    expect(labels.some((t) => /Je propose quelque chose/.test(t))).toBe(true);
    click(/Je propose quelque chose/);
    expect(onChooseRole).toHaveBeenCalledWith('seller');
    expect(container.textContent).toContain('étape 3 sur 5');
  });

  it('le moment 3 « comment ça marche » enseigne les éléments cœur (GUIDE-1b)', () => {
    render(base);
    advanceToGuide('buyer');
    expect(container.textContent).toContain('étape 3 sur 5');
    // Les 3 temps du cœur (mots du Seed).
    expect(container.textContent).toContain('Découvrir');
    expect(container.textContent).toContain('Interroger');
    expect(container.textContent).toContain('Vérifier & transiger');
    // L'échelle 0→4 avec les mots VERROUILLÉS (S-06), jamais les anciens.
    expect(container.textContent).toContain('Disponibilité vivante');
    expect(container.textContent).toContain('Transactable');
    expect(container.textContent).not.toContain('Disponibilité confirmée');
    // Non bloquant (S-31) : « passer » reste possible.
    expect(container.textContent).toContain('Vous pouvez passer');
  });

  it('le moment 4 acheteur propose des exemples qui lancent une VRAIE recherche', () => {
    const onTrySearch = vi.fn();
    const onChooseRole = vi.fn();
    render({ ...base, onTrySearch, onChooseRole });
    expect(WELCOME_SEARCH_EXAMPLES.length).toBeGreaterThan(0);
    advanceToGuide('buyer');
    click(/Continuer/);
    expect(onChooseRole).toHaveBeenCalledWith('buyer');
    for (const example of WELCOME_SEARCH_EXAMPLES) {
      expect(container.textContent).toContain(example);
    }
    act(() => {
      [...container.querySelectorAll('[role="button"]')].find((el) => (el.textContent || '').trim() === WELCOME_SEARCH_EXAMPLES[0])?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onTrySearch).toHaveBeenCalledWith(WELCOME_SEARCH_EXAMPLES[0]);
  });

  it('le moment 4 vendeur garde les deux gestes réels : explorer et publier', () => {
    render(base);
    advanceToGuide('seller');
    click(/Continuer/);
    const labels = buttons();
    expect(labels.some((t) => /Explorer la carte/.test(t))).toBe(true);
    expect(labels.some((t) => /Publier ce que je vends/.test(t))).toBe(true);
  });

  it('« Publier » déclenche le geste réel, pas une promesse', () => {
    let published = false;
    render({ ...base, onPublish: () => { published = true; } });
    advanceToGuide('seller');
    click(/Continuer/);
    click(/Publier ce que je vends/);
    expect(published).toBe(true);
  });

  it('présente les plans en info + lien, jamais en mur (décision fondateur 2026-10-07)', () => {
    let plansOpened = false;
    render({ ...base, onOpenPlans: () => { plansOpened = true; } });
    advanceToGuide('buyer');
    click(/Continuer/);
    click(/Voir les plans/);
    expect(container.textContent).toContain('étape 5 sur 5');
    expect(container.textContent).toMatch(/Gratuit|Pro/);
    expect(plansOpened).toBe(false);
    click(/Comparer les plans/);
    expect(plansOpened).toBe(true);
  });

  it('partage sans PII et affiche le retour réel', async () => {
    render({ ...base, onShare: async () => 'Lien copié ! Partagez-le autour de vous.' });
    advanceToGuide('buyer');
    click(/Continuer/);
    click(/Voir les plans/);
    await act(async () => {
      const btn = [...container.querySelectorAll('button')].find((b) => /Partager Omni/.test(b.textContent || ''));
      expect(btn).toBeTruthy();
      btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });
    expect(container.textContent).toContain('Lien copié');
  });

  it('fermer ne choisit rien (aucun rôle adopté, aucune recherche lancée)', () => {
    const onChooseRole = vi.fn();
    const onTrySearch = vi.fn();
    let closed = false;
    render({ ...base, onChooseRole, onTrySearch, onClose: () => { closed = true; } });
    act(() => {
      container.querySelector('[aria-label="Fermer"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(closed).toBe(true);
    expect(onChooseRole).not.toHaveBeenCalled();
    expect(onTrySearch).not.toHaveBeenCalled();
  });
});
