import { describe, expect, it } from 'vitest';
import { getAuthUserId, getBearerToken } from './auth-context';

describe('server Auth boundary', () => {
  it('extracts only a non-empty Bearer credential', () => {
    expect(getBearerToken({ authorization: 'Bearer token-1' })).toBe('token-1');
    expect(getBearerToken({ authorization: 'Basic token-1' })).toBeNull();
    expect(getBearerToken({ authorization: 'Bearer   ' })).toBeNull();
    expect(getBearerToken({})).toBeNull();
  });

  it('fails closed for a malformed bearer token', async () => {
    await expect(getAuthUserId({ authorization: 'Bearer not-a-jwt' })).resolves.toBeNull();
  });
});
