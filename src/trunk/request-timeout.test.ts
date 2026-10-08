import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isRequestTimeoutError, raceWithTimeout, RequestTimeoutError, REQUEST_TIMEOUT_MS } from './request-timeout';

afterEach(() => {
  vi.useRealTimers();
});

// Un helper branché nulle part est une couche orpheline : le délai n'existe que si
// `fetchWithRecovery` l'applique réellement aux DEUX tentatives (initiale + 5xx).
describe('api.ts — le délai est réellement câblé sur les requêtes', () => {
  const apiSource = readFileSync(new URL('./api.ts', import.meta.url), 'utf8');

  it('fetchWithRecovery borne ses deux tentatives', () => {
    expect(apiSource).toContain("import { raceWithTimeout } from './request-timeout'");
    const occurrences = apiSource.match(/raceWithTimeout\(fetch\(/g) ?? [];
    expect(occurrences.length).toBe(2);
    expect(apiSource).not.toMatch(/await fetch\(input, init\)/);
  });
});

describe('raceWithTimeout — un réseau qui ne répond jamais devient une erreur honnête', () => {
  it('rend la valeur si la promesse se règle avant le délai', async () => {
    vi.useFakeTimers();
    const fast = Promise.resolve('ok');
    const result = raceWithTimeout(fast, 1000);
    await expect(result).resolves.toBe('ok');
  });

  it('lève RequestTimeoutError quand la promesse ne se règle jamais', async () => {
    vi.useFakeTimers();
    const never = new Promise<string>(() => {});
    const raced = raceWithTimeout(never, 1000);
    const assertion = expect(raced).rejects.toBeInstanceOf(RequestTimeoutError);
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it('nettoie le minuteur quand la promesse gagne (pas de fuite)', async () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    await raceWithTimeout(Promise.resolve(1), 1000);
    expect(clearSpy).toHaveBeenCalled();
  });

  it('un délai ≤ 0 rend la promesse inchangée (pas de course)', async () => {
    const p = Promise.resolve(42);
    expect(raceWithTimeout(p, 0)).toBe(p);
  });

  it('expose un délai par défaut borné et un message français', () => {
    expect(REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
    const error = new RequestTimeoutError();
    expect(error.code).toBe('REQUEST_TIMEOUT');
    expect(error.retryable).toBe(true);
    expect(error.message).toContain('réseau');
  });

  it('isRequestTimeoutError reconnaît la classe et le code', () => {
    expect(isRequestTimeoutError(new RequestTimeoutError())).toBe(true);
    expect(isRequestTimeoutError({ code: 'REQUEST_TIMEOUT' })).toBe(true);
    expect(isRequestTimeoutError(new Error('boom'))).toBe(false);
    expect(isRequestTimeoutError(null)).toBe(false);
  });
});
