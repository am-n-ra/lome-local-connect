// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The Neon Auth client is an external network boundary; the UI contract is what this
// test owns. We assert the REAL sign-up path is invoked (not a simulated OTP), and
// that the email-confirmation dead-end is replaced by a real, actionable state.
const mocks = vi.hoisted(() => ({
  signUp: vi.fn(async () => ({})),
  signIn: vi.fn(async () => ({})),
  getSession: vi.fn(async (): Promise<{ data: { user: unknown } }> => ({ data: { user: { id: 'u1', email: 'ama@example.com', name: 'Ama' } } })),
  sendVerificationOtp: vi.fn(async () => ({})),
  verifyEmail: vi.fn(async (): Promise<Record<string, unknown>> => ({ data: { user: { id: 'u1', email: 'ama@example.com', name: 'Ama' } } })),
}));
vi.mock('../auth', () => ({
  authClient: {
    signUp: { email: mocks.signUp },
    signIn: { email: mocks.signIn },
    getSession: mocks.getSession,
    emailOtp: { sendVerificationOtp: mocks.sendVerificationOtp, verifyEmail: mocks.verifyEmail },
  },
  getAuthToken: vi.fn(async () => 'header.payload.signature'),
}));
vi.mock('./api', () => ({ setDeclaredPhone: vi.fn(async () => ({ ok: true })) }));

import { AuthSheetV13 } from './AuthSheetV13';

const { signUp, signIn, getSession, sendVerificationOtp, verifyEmail } = mocks;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  signUp.mockClear(); signIn.mockClear(); getSession.mockClear(); sendVerificationOtp.mockClear(); verifyEmail.mockClear();
  signUp.mockResolvedValue({});
  signIn.mockResolvedValue({});
  getSession.mockResolvedValue({ data: { user: { id: 'u1', email: 'ama@example.com', name: 'Ama' } } });
  sendVerificationOtp.mockResolvedValue({});
  verifyEmail.mockResolvedValue({ data: { user: { id: 'u1', email: 'ama@example.com', name: 'Ama' } } });
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
    root.render(<AuthSheetV13 initialMode={mode} onAuthenticated={onAuthenticated} onClose={() => {}} onOpenLegal={() => {}} />);
  });
  return onAuthenticated;
}

function text() { return container.textContent ?? ''; }
function submitButton() {
  return container.querySelector<HTMLButtonElement>('button[type="submit"]');
}
function findButton(label: string) {
  return [...container.querySelectorAll<HTMLButtonElement>('button')].find((b) => (b.textContent ?? '').includes(label)) ?? null;
}
// React controlled inputs ignore a plain `.value =`; the native setter makes onChange fire.
function typeInto(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
  act(() => { setter.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
}
function checkConsent() {
  const box = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (box && !box.checked) act(() => { box.click(); });
}
function fillSignup(name: string, email: string, password: string) {
  typeInto(container.querySelector<HTMLInputElement>('#v13-auth-firstname')!, name);
  typeInto(container.querySelector<HTMLInputElement>('#v13-auth-email')!, email);
  typeInto(container.querySelector<HTMLInputElement>('#v13-auth-password')!, password);
  checkConsent();
}

describe('AUTH-CREATE — l\'écran auth permet de CRÉER un compte (bug fondateur 2026-10-07)', () => {
  it('en mode signup, propose la création (Prénom + Téléphone) et non la seule connexion', () => {
    renderUi('signup');
    expect(text()).toContain('Créez votre compte.');
    expect(text()).toContain('Prénom');
    expect(text()).toContain('Créer mon compte');
    expect(text()).toContain('Téléphone (optionnel)');
    // le mensonge X5 (code OTP simulé) n'existe pas
    expect(text()).not.toMatch(/code à 4 chiffres/i);
  });

  it('le Prénom est REQUIS (fondateur 2026-10-07 : le nom ne doit pas être optionnel)', () => {
    renderUi('signup');
    // pas de « (optionnel) » sur le prénom
    expect(text()).not.toContain('Prénom (optionnel)');
    // sans prénom, le bouton reste désactivé même avec e-mail + mot de passe + consentement
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-email')!, 'ama@example.com');
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-password')!, 'secret6');
    checkConsent();
    expect(submitButton()!.disabled).toBe(true);
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-firstname')!, 'Ama');
    expect(submitButton()!.disabled).toBe(false);
  });

  it('en mode signin, ne demande ni prénom ni téléphone', () => {
    renderUi('signin');
    expect(text()).toContain('Connectez-vous pour continuer.');
    expect(text()).toContain('Se connecter');
    expect(container.querySelector('#v13-auth-firstname')).toBeNull();
    expect(container.querySelector('#v13-auth-phone')).toBeNull();
  });

  it('bascule création ↔ connexion sur la même surface', () => {
    renderUi('signin');
    const toggle = container.querySelectorAll<HTMLButtonElement>('button.btn.ghost.sm')[0];
    expect(toggle.textContent).toContain('Créer un compte');
    act(() => toggle.click());
    expect(text()).toContain('Créez votre compte.');
    expect(container.querySelectorAll<HTMLButtonElement>('button.btn.ghost.sm')[0].textContent).toContain('Se connecter');
  });

  it('le bouton reste désactivé tant que prénom + email + mot de passe (≥6) + consentement ne sont pas valides', () => {
    renderUi('signup');
    expect(submitButton()!.disabled).toBe(true);
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-email')!, 'ama@example.com');
    expect(submitButton()!.disabled).toBe(true);
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-password')!, 'secret6');
    expect(submitButton()!.disabled).toBe(true); // prénom encore vide
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-firstname')!, 'Ama');
    expect(submitButton()!.disabled).toBe(true); // consentement pas encore coché
    checkConsent();
    expect(submitButton()!.disabled).toBe(false);
  });

  it('soumettre en mode création appelle la VRAIE création de compte puis onAuthenticated', async () => {
    const onAuth = renderUi('signup');
    fillSignup('Ama', 'ama@example.com', 'secret6');
    await act(async () => { submitButton()!.click(); });
    expect(signUp).toHaveBeenCalledWith({ email: 'ama@example.com', password: 'secret6', name: 'Ama' });
    expect(signIn).not.toHaveBeenCalled();
    expect(onAuth).toHaveBeenCalledWith({ id: 'u1', email: 'ama@example.com', name: 'Ama' });
  });
});

describe('BRANCH-2 — confirmation e-mail par CODE (OTP), envoi automatique, renvoi différé', () => {
  it('quand la création n\'ouvre pas de session, l\'état de confirmation demande le CODE reçu', async () => {
    getSession.mockResolvedValue({ data: { user: null } }); // plateforme exige la confirmation
    renderUi('signup');
    fillSignup('Ama', 'ama@example.com', 'secret6');
    await act(async () => { submitButton()!.click(); });
    expect(text()).toContain('Confirmez votre e-mail.');
    expect(text()).toContain('ama@example.com');
    // l'impasse précédente (« validez-la puis connectez-vous », puis rien) a disparu
    expect(text()).not.toContain('Si une confirmation par email est demandée');
    // le CODE de vérification est réellement déclenché (pas un lien)
    expect(sendVerificationOtp).toHaveBeenCalledWith({ email: 'ama@example.com', type: 'email-verification' });
    // un champ de saisie du code existe, et une action pour le valider
    expect(container.querySelector('#v13-auth-code')).toBeTruthy();
    expect(text()).toContain('Confirmer mon adresse');
  });

  it('saisir le code reçu confirme l\'adresse et ouvre la session (verifyEmail appelé)', async () => {
    // 1er getSession (après signup) : pas de session → état de confirmation ;
    // 2e getSession (après verifyEmail) : la session est ouverte.
    getSession.mockResolvedValueOnce({ data: { user: null } });
    const onAuth = renderUi('signup');
    fillSignup('Ama', 'ama@example.com', 'secret6');
    await act(async () => { submitButton()!.click(); });
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-code')!, '123456');
    await act(async () => { findButton('Confirmer mon adresse')!.click(); });
    expect(verifyEmail).toHaveBeenCalledWith({ email: 'ama@example.com', otp: '123456' });
    expect(onAuth).toHaveBeenCalledWith({ id: 'u1', email: 'ama@example.com', name: 'Ama' });
  });

  it('un code invalide est dit comme tel, et laisse l\'utilisateur réessayer', async () => {
    getSession.mockResolvedValue({ data: { user: null } });
    verifyEmail.mockResolvedValue({ error: { message: 'Invalid OTP', code: 'INVALID_OTP' } });
    renderUi('signup');
    fillSignup('Ama', 'ama@example.com', 'secret6');
    await act(async () => { submitButton()!.click(); });
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-code')!, '000000');
    await act(async () => { findButton('Confirmer mon adresse')!.click(); });
    expect(text()).toContain('Code incorrect ou expiré');
    expect(container.querySelector('#v13-auth-code')).toBeTruthy(); // toujours là pour réessayer
  });

  it('le renvoi n\'apparaît qu\'APRÈS un délai (on ne propose pas de renvoyer un e-mail qui vient de partir)', async () => {
    vi.useFakeTimers();
    try {
      getSession.mockResolvedValue({ data: { user: null } });
      renderUi('signup');
      fillSignup('Ama', 'ama@example.com', 'secret6');
      await act(async () => { submitButton()!.click(); });
      // juste après l'envoi : renvoi verrouillé par un compte à rebours
      expect(text()).toContain('Renvoyer le code dans');
      await act(async () => { vi.advanceTimersByTime(31000); });
      // après le délai : le bouton de renvoi est disponible
      expect(findButton('Renvoyer le code')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('une connexion refusée pour e-mail non confirmé dit la VÉRITÉ (pas « identifiants incorrects ») et envoie un code', async () => {
    signIn.mockResolvedValue({ error: { message: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' } });
    renderUi('signin');
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-email')!, 'ama@example.com');
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-password')!, 'secret6');
    await act(async () => { submitButton()!.click(); });
    expect(text()).toContain('Confirmez votre e-mail.');
    expect(text()).not.toContain('Vérifiez vos identifiants');
    expect(sendVerificationOtp).toHaveBeenCalled();
  });

  it('un vrai mauvais mot de passe reste dit comme tel (on ne confond pas les deux échecs)', async () => {
    signIn.mockResolvedValue({ error: { message: 'Invalid credentials', code: 'INVALID_EMAIL_OR_PASSWORD' } });
    renderUi('signin');
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-email')!, 'ama@example.com');
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-password')!, 'secret6');
    await act(async () => { submitButton()!.click(); });
    expect(text()).toContain('Vérifiez vos identifiants');
    expect(sendVerificationOtp).not.toHaveBeenCalled();
  });
});

describe('LEGAL — consentement au traitement et accès aux informations légales', () => {
  it('la création exige le consentement explicite (loi togolaise 2019-014)', () => {
    renderUi('signup');
    // champs remplis SANS cocher le consentement
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-firstname')!, 'Ama');
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-email')!, 'ama@example.com');
    typeInto(container.querySelector<HTMLInputElement>('#v13-auth-password')!, 'secret6');
    expect(submitButton()!.disabled).toBe(true);
    const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    expect(checkbox).toBeTruthy();
    act(() => { checkbox.click(); });
    expect(submitButton()!.disabled).toBe(false);
  });

  it('les liens Confidentialité / Conditions ouvrent la feuille légale', () => {
    const onOpenLegal = vi.fn();
    act(() => {
      root.render(<AuthSheetV13 initialMode="signup" onAuthenticated={vi.fn()} onClose={() => {}} onOpenLegal={onOpenLegal} />);
    });
    const links = [...container.querySelectorAll<HTMLButtonElement>('button.linkbtn')];
    const labels = links.map((l) => l.textContent);
    expect(labels.some((l) => /conditions/i.test(l ?? ''))).toBe(true);
    expect(labels.some((l) => /confidentialit/i.test(l ?? ''))).toBe(true);
    act(() => links.find((l) => /confidentialit/i.test(l.textContent ?? ''))!.click());
    expect(onOpenLegal).toHaveBeenCalledWith('confidentialite');
  });
});

