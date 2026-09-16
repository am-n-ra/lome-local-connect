// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OnboardV13 } from './OnboardV13';

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

function renderUi(props: { pendingSearch?: string; onClose?: () => void; onComplete?: () => void } = {}) {
  act(() => {
    root.render(
      <OnboardV13
        pendingSearch={props.pendingSearch ?? 'riz sauce arachide'}
        onClose={props.onClose ?? (() => {})}
        onComplete={props.onComplete ?? (() => {})}
      />,
    );
  });
}

function text() {
  return container.textContent ?? '';
}

describe('COR-3b enriched onboarding', () => {
  it('opens on the educational step explaining the Omni value loop before asking for access', () => {
    renderUi();
    expect(text()).toContain("Omni trouve l'offre près de vous.");
    expect(text()).toContain('Découvrir');
    expect(text()).toContain('Interroger');
    expect(text()).toContain('QR tracé');
    // access form is not the first thing the user sees anymore
    expect(text()).not.toContain('Recevoir le code');
  });

  it('carries the pending search forward and collects an optional first name before the contact field', () => {
    renderUi({ pendingSearch: 'chaise de bureau' });
    const next = container.querySelector<HTMLButtonElement>('.btn.ok');
    expect(next).toBeTruthy();
    act(() => next!.click());
    expect(text()).toContain('chaise de bureau');
    expect(text()).toContain('Prénom (optionnel)');
    expect(text()).toContain('Aucun mot de passe');
  });
});
