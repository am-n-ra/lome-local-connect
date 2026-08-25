import { describe, expect, it } from 'vitest';
import { sessionUserFromAuthResult } from './auth-session';

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
});
