// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The Neon Auth client is an external network boundary; the UI contract is what this
// test owns. We assert the REAL sign-up path is invoked (not a simulated OTP).
const mocks = vi.hoisted(() => ({
  signUp: vi.fn(async () => ({})),
  signIn: vi.fn(async () => ({})),
  getSession: vi.fn(async () => ({ data: { user: { id: 'u1', email: 'ama@example.com', name: 'Ama' } } })),
}));
vi.mock('../auth', () => ({
  authClient: { signUp: { email: mocks.signUp }, signIn: { email: mocks.signIn }, getSession: mocks.getSession },
  getAuthToken: vi.fn(async () => 'header.payload.signature'),
}));
vi.mock('./api', () => ({ setDeclaredPhone: vi.fn(async () => ({ ok: true })) }));

import { AuthSheetV13 } from './AuthSheetV13';

const { signUp, signIn, getSession } = mocks;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  signUp.mockClear(); signIn.mockClear(); getSession.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderUi(mode: 'signin' | 'signup', onAuthenticated = vi.fn()) {
  act(() => {
    root.render(<AuthSheetV13 initialMode={mode} onAuthenticated={onAuthenticated} onClose={() => {}} />);
  });
  return onAuthenticated;
}

function text() { return container.textContent ?? ''; }
function submitButton() {
  return container.querySelector<HTMLButtonElement>('button[type="submit"]');
}
// React controlled inputs ignore a plain `.value =`; the native setter makes onChange fire.
function typeInto(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
  act(() => { setter.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
}

describe('AUTH-CREATE — l\'écran auth permet de CRÉER un compte (bug fondateur 2026-10-07)', () => {
  it('en mode signup, propose la création (Prénom + Téléphone) et non la seule connexion', () => {
    renderUi('signup');
    expect(text()).toContain('Créez votre compte.');
    expect(text()).toContain('Prénom (optionnel)');
    expect(text()).toContain('Créer mon compte');
    expect(text()).toContain('Téléphone (optionnel)');
    // le mensonge X5 (code OTP simulé) n'existe pas
    expect(text()).not.toMatch(/code à 4 chiffres/i);
  });

  it('en mode signin, ne demande ni prénom ni téléphone', () => {
    renderUi('signin');
    expect(text()).toContain('Connectez-vous pour continuer.');
    expect(text()).toContain('Se connecter');
    expect(text()).not.toContain('Prénom (optionnel)');
  });

  it('bascule création ↔ connexion sur la même surface', () => {
    renderUi('signin');
    const toggle = container.querySelectorAll<HTMLButtonElement>('button.btn.ghost.sm')[0];
    expect(toggle.textContent).toContain('Créer un compte');
    act(() => toggle.click());
    expect(text()).toContain('Créez votre compte.');
    expect(container.querySelectorAll<HTMLButtonElement>('button.btn.ghost.sm')[0].textContent).toContain('Se connecter');
  });

  it('le bouton reste désactivé tant que email + mot de passe (≥6) ne sont pas valides', () => {
    renderUi('signup');
    expect(submitButton()!.disabled).toBe(true);
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-email')!, 'ama@example.com');
    expect(submitButton()!.disabled).toBe(true);
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-password')!, 'secret6');
    expect(submitButton()!.disabled).toBe(false);
  });

  it('soumettre en mode création appelle la VRAIE création de compte puis onAuthenticated', async () => {
    const onAuth = renderUi('signup');
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-email')!, 'ama@example.com');
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-password')!, 'secret6');
    await act(async () => { submitButton()!.click(); });
    expect(signUp).toHaveBeenCalledWith({ email: 'ama@example.com', password: 'secret6', name: 'ama@example.com' });
    expect(signIn).not.toHaveBeenCalled();
    expect(onAuth).toHaveBeenCalledWith({ id: 'u1', email: 'ama@example.com', name: 'Ama' });
  });
});
