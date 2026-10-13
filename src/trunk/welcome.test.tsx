// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('WelcomeV13 — parcours immersif après création (3 moments réels)', () => {
  it('salue par le prénom quand il est fourni', () => {
    render(base);
    expect(container.textContent).toContain('Bienvenue, Ama.');
  });

  it('reste honnête sans prénom (jamais un « Bienvenue, undefined »)', () => {
    render({ ...base, firstName: null });
    expect(container.textContent).toContain('Bienvenue sur Omni.');
    expect(container.textContent).not.toContain('undefined');
  });

  it('affiche la progression honnête (étape 1 sur 4, dots reflétant l’état réel)', () => {
    render(base);
    expect(container.textContent).toContain('étape 1 sur 4');
    const dots = container.querySelectorAll('.onboard-dot');
    expect(dots.length).toBe(4);
    expect(dots[0].className).toContain('active');
    expect(dots[1].className).not.toContain('active');
  });

  it('le moment 2 propose les deux rôles, et le choix appelle le vrai routage', () => {
    const onChooseRole = vi.fn();
    render({ ...base, onChooseRole });
    act(() => {
      container.querySelectorAll('button');
      [...container.querySelectorAll('button')].find((b) => /Continuer/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('étape 2 sur 4');
    const labels = buttons();
    expect(labels.some((t) => /Je cherche autour de moi/.test(t))).toBe(true);
    expect(labels.some((t) => /Je propose quelque chose/.test(t))).toBe(true);
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Je propose quelque chose/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onChooseRole).toHaveBeenCalledWith('seller');
    expect(container.textContent).toContain('étape 3 sur 4');
  });

  it('le moment 3 acheteur propose des exemples qui lancent une VRAIE recherche', () => {
    const onTrySearch = vi.fn();
    const onChooseRole = vi.fn();
    render({ ...base, onTrySearch, onChooseRole });
    expect(WELCOME_SEARCH_EXAMPLES.length).toBeGreaterThan(0);
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Continuer/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Je cherche autour de moi/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onChooseRole).toHaveBeenCalledWith('buyer');
    for (const example of WELCOME_SEARCH_EXAMPLES) {
      expect(container.textContent).toContain(example);
    }
    act(() => {
      [...container.querySelectorAll('[role="button"]')].find((el) => (el.textContent || '').trim() === WELCOME_SEARCH_EXAMPLES[0])?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onTrySearch).toHaveBeenCalledWith(WELCOME_SEARCH_EXAMPLES[0]);
  });

  it('le moment 3 vendeur garde les deux gestes réels : explorer et publier', () => {
    render(base);
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Continuer/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Je propose quelque chose/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const labels = buttons();
    expect(labels.some((t) => /Explorer la carte/.test(t))).toBe(true);
    expect(labels.some((t) => /Publier ce que je vends/.test(t))).toBe(true);
  });

  it('« Publier » déclenche le geste réel, pas une promesse', () => {
    let published = false;
    render({ ...base, onPublish: () => { published = true; } });
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Continuer/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Je propose quelque chose/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Publier ce que je vends/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(published).toBe(true);
  });

  it('présente les plans en info + lien, jamais en mur (décision fondateur 2026-10-07)', () => {
    let plansOpened = false;
    render({ ...base, onOpenPlans: () => { plansOpened = true; } });
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Continuer/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Je cherche autour de moi/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Voir les plans/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('étape 4 sur 4');
    expect(container.textContent).toMatch(/Gratuit|Pro/);
    expect(plansOpened).toBe(false);
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Comparer les plans/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(plansOpened).toBe(true);
  });

  it('partage sans PII et affiche le retour réel', async () => {
    render({ ...base, onShare: async () => 'Lien copié ! Partagez-le autour de vous.' });
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Continuer/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Je cherche autour de moi/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      [...container.querySelectorAll('button')].find((b) => /Voir les plans/.test(b.textContent || ''))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
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
