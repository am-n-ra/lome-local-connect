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

function renderUi(props: { pendingSearch?: string; hasSession?: boolean } = {}) {
  act(() => {
    root.render(
      <OnboardV13
        pendingSearch={props.pendingSearch ?? 'riz sauce arachide'}
        hasSession={props.hasSession ?? false}
        onClose={() => {}}
        onComplete={() => {}}
      />,
    );
  });
}

function text() {
  return container.textContent ?? '';
}

describe('X5 honest onboarding (replaces the simulated OTP)', () => {
  it('opens on the educational step explaining the Omni value loop before asking for access', () => {
    renderUi();
    expect(text()).toContain("Omni trouve l'offre près de vous.");
    expect(text()).toContain('Découvrir');
    expect(text()).toContain('Interroger');
    expect(text()).toContain('QR tracé');
    // access form is not the first thing the user sees
    expect(text()).not.toContain('Recevoir le code');
  });

  it('carries the pending search forward and collects an optional first name before the contact fields', () => {
    renderUi({ pendingSearch: 'chaise de bureau' });
    const next = container.querySelector<HTMLButtonElement>('.btn.ok');
    expect(next).toBeTruthy();
    act(() => next!.click());
    expect(text()).toContain('chaise de bureau');
    expect(text()).toContain('Prénom (optionnel)');
    // honest promise: a full account is not required to explore
    expect(text()).toContain("Aucune inscription complète n'est demandée");
  });

  it('no longer simulates a 4-digit code — a real email/password sign-up is required', () => {
    renderUi();
    act(() => container.querySelector<HTMLButtonElement>('.btn.ok')!.click());
    // the fake code screen is gone
    expect(text()).not.toMatch(/code à 4 chiffres/i);
    expect(text()).not.toContain('Recevoir le code');
    expect(container.querySelector<HTMLInputElement>('input[type="password"]')).toBeTruthy();
    expect(container.querySelector<HTMLInputElement>('input[type="email"]')).toBeTruthy();
  });

  it('skips the credentials step when a real session already exists (gated action)', () => {
    renderUi({ hasSession: true });
    expect(text()).toContain('Ce que Pro débloque.');
    expect(container.querySelector<HTMLInputElement>('input[type="password"]')).toBeNull();
  });

  it('S-16 : collects an optional declared phone on signup, labelled non vérifié', () => {
    renderUi();
    act(() => container.querySelector<HTMLButtonElement>('.btn.ok')!.click());
    expect(text()).toContain('Téléphone (optionnel)');
    expect(text()).toContain('Déclaré · non confirmé');
    expect(text()).toContain('Omni ne vérifie pas ce numéro');
    expect(container.querySelector<HTMLInputElement>('input[autocomplete="tel"]')).toBeTruthy();
  });
});
