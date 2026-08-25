import { describe, expect, it } from 'vitest';
import { sessionUserFromAuthResult } from './auth-session';

describe('Neon Auth session mapping', () => {
  it('maps the adapter response from data.session.user', () => {
    expect(sessionUserFromAuthResult({
      data: {
        session: {
          user: { id: 'auth-user', email: 'hidden@example.test', name: 'Demo' },
        },
      },
    })).toEqual({ id: 'auth-user', email: 'hidden@example.test', name: 'Demo' });
  });

  it('does not mistake data.user for an active session', () => {
    expect(sessionUserFromAuthResult({ data: { user: { id: 'wrong-shape' } } })).toBeNull();
    expect(sessionUserFromAuthResult({ data: { session: null } })).toBeNull();
  });

  it('normalizes optional profile fields without exposing session tokens', () => {
    expect(sessionUserFromAuthResult({ data: { session: { user: { id: 'auth-user' } } } })).toEqual({
      id: 'auth-user',
      email: null,
      name: null,
    });
  });
});
