import { describe, expect, it } from 'vitest';
import { authErrorOf, sessionUserFromAuthResult } from './auth-session';

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
