// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Skeleton, SkeletonDetail } from './Skeleton';

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

const render = (node: React.ReactNode) => act(() => root.render(node));

describe('SKELETON — une forme de contenu, honnête et monochrome', () => {
  it('annonce le chargement aux lecteurs d’écran (role=status + aria-busy)', () => {
    render(<Skeleton variant="line" />);
    const el = container.querySelector('.skeleton')!;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.getAttribute('aria-label')).toBe('Chargement');
  });

  it('répète la forme du contenu réel (count) au lieu d’un mot', () => {
    render(<Skeleton variant="kv" count={4} />);
    expect(container.querySelectorAll('.skeleton.sk-kv').length).toBe(4);
  });

  it('un rail de cartes rend une carte par entrée', () => {
    render(<Skeleton variant="hcard" count={3} />);
    const rail = container.querySelector('.sk-rail')!;
    expect(rail.querySelectorAll('.skeleton.sk-hcard').length).toBe(3);
  });

  it('la fiche détaillée épouse vignette + lignes', () => {
    render(<SkeletonDetail rows={3} />);
    expect(container.querySelector('.skeleton.sk-block')).not.toBeNull();
    expect(container.querySelectorAll('.skeleton.sk-kv').length).toBe(3);
  });

  // ADN visuel (docs/design.md) : monochrome, l'accent est réservé à la confiance.
  it('le CSS du squelette n’utilise jamais l’accent de confiance', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/trunk/ui-v13.css'), 'utf8');
    const skeletonBlock = css.slice(css.indexOf('.skeleton{'));
    expect(skeletonBlock).not.toContain('--accent');
    expect(skeletonBlock).not.toContain('#2E8B6F');
    expect(skeletonBlock).toContain('var(--panel)');
  });

  // ADN comportemental obligatoire : pas de shimmer sous prefers-reduced-motion.
  it('le shimmer s’éteint sous prefers-reduced-motion', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/trunk/ui-v13.css'), 'utf8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce){.sk-shimmer::after{animation:none');
  });
});
