import { describe, expect, it } from 'vitest';
import { authErrorOf, sessionUserFromAuthResult, authResultHasSession } from './auth-session';

describe('Neon Auth session mapping', () => {
  it('maps the native Better Auth response from data.user', () => {
    expect(sessionUserFromAuthResult({
      data: {
        user: { id: 'auth-user', email: 'hidden@example.test', name: 'Demo' },
        session: { user: { id: 'auth-user' } },
      },
    })).toEqual({ id: 'auth-user', email: 'hidden@example.test', name: 'Demo' });
  });

  it('also maps the Supabase-compatible response from data.session.user', () => {
    expect(sessionUserFromAuthResult({
      data: {
        session: {
          user: { id: 'auth-user', email: 'hidden@example.test', name: 'Demo' },
        },
      },
    })).toEqual({ id: 'auth-user', email: 'hidden@example.test', name: 'Demo' });
  });

  it('rejects responses without an active user', () => {
    expect(sessionUserFromAuthResult({ data: { session: null } })).toBeNull();
    expect(sessionUserFromAuthResult({ data: { user: null, session: null } })).toBeNull();
  });

  it('normalizes optional profile fields without exposing session tokens', () => {
    expect(sessionUserFromAuthResult({ data: { session: { user: { id: 'auth-user' } } } })).toEqual({
      id: 'auth-user',
      email: null,
      name: null,
    });
  });

  it('maps the direct user carried by a sign-up/sign-in success ({ token, user })', () => {
    expect(sessionUserFromAuthResult({ data: { token: 'opaque', user: { id: 'auth-user', email: 'a@b.c', name: 'Ama' } } }))
      .toEqual({ id: 'auth-user', email: 'a@b.c', name: 'Ama' });
  });
});

describe('AUTH-VERIFY — « session ouverte » n\'est pas « utilisateur présent »', () => {
  it('a success WITH a session token opened a real session', () => {
    expect(authResultHasSession({ data: { token: 'opaque', user: { id: 'u1' } } })).toBe(true);
  });

  it('a success carrying a session object opened a real session', () => {
    expect(authResultHasSession({ data: { session: { id: 's1' }, user: { id: 'u1' } } })).toBe(true);
  });

  it('the verification-required shape ({ user } with NO session/token) did NOT open one', () => {
    // C'est le comportement de Neon quand la vérification d'e-mail est ACTIVÉE : un compte
    // est créé, la session non — l'utilisateur ne doit pas pouvoir entrer.
    expect(authResultHasSession({ data: { user: { id: 'u1', emailVerified: false } } })).toBe(false);
    expect(authResultHasSession({ data: { session: null, user: { id: 'u1' } } })).toBe(false);
    expect(authResultHasSession({ data: null })).toBe(false);
    expect(authResultHasSession(null)).toBe(false);
  });
});

describe('AUTH-LOOP — authErrorOf reads the SDK error in every shape', () => {
  it('reads a wrapped { error } result (Better Auth is configured throw: false)', () => {
    expect(authErrorOf({ data: null, error: { message: 'Invalid credentials', code: 'INVALID_EMAIL_OR_PASSWORD' } }))
      .toEqual({ message: 'Invalid credentials', code: 'INVALID_EMAIL_OR_PASSWORD' });
  });

  it('reads a thrown BetterAuthError carrying message/code directly', () => {
    expect(authErrorOf({ message: 'Invalid OTP', code: 'INVALID_OTP', status: 400 }))
      .toEqual({ message: 'Invalid OTP', code: 'INVALID_OTP', status: 400 });
  });

  it('returns null for a success result and never mistakes data.user for an error', () => {
    expect(authErrorOf({ data: { user: { id: 'u1', email: 'a@b.c' } } })).toBeNull();
    expect(authErrorOf({ token: 'x', user: { id: 'u1' } })).toBeNull();
    expect(authErrorOf(null)).toBeNull();
    expect(authErrorOf(undefined)).toBeNull();
  });
});
