import { describe, expect, it, vi } from 'vitest';
import { extractTransactionPayload, teardownScanner } from './SellerQrScannerSheet';
import { qrPayload } from './BuyerFlowV13';

const TXN = '11111111-2222-3333-4444-555555555555';
const TOKEN = 'abc-12345-secret-token';

describe('extractTransactionPayload', () => {
  it('parse un payload `transactionId:jeton` brut', () => {
    expect(extractTransactionPayload(`${TXN}:${TOKEN}`)).toEqual({ transactionId: TXN, tokenHash: TOKEN });
  });
  it('ignore les espaces périphériques', () => {
    expect(extractTransactionPayload(` ${TXN}:${TOKEN} `)).toEqual({ transactionId: TXN, tokenHash: TOKEN });
  });
  it('parse une URL portant txn et qr', () => {
    expect(extractTransactionPayload(`https://omni.test/?txn=${TXN}&qr=${TOKEN}`)).toEqual({ transactionId: TXN, tokenHash: TOKEN });
  });
  it('rejette un jeton trop court', () => {
    expect(extractTransactionPayload(`${TXN}:x`)).toBeNull();
  });
  it('rejette un transactionId non UUID', () => {
    expect(extractTransactionPayload(`nope:${TOKEN}`)).toBeNull();
  });
});

describe('teardownScanner', () => {
  // Regression: `scanner.stop()` throws a *string* synchronously when the
  // scanner is not running, so the old `stop().then(...).catch(...)` chain never
  // caught it and the error escaped unmount as "Uncaught Cannot stop, scanner is
  // not running or paused."
  it('ne propage pas l\'erreur synchrone de stop() sur un scanner jamais démarré', () => {
    const scanner = {
      stop: () => { throw 'Cannot stop, scanner is not running or paused.'; },
      clear: vi.fn(),
    };
    expect(() => teardownScanner(scanner as never)).not.toThrow();
    expect(scanner.clear).toHaveBeenCalled();
  });

  it('ne propage pas non plus une erreur synchrone de clear()', () => {
    const scanner = {
      stop: () => { throw 'Cannot stop, scanner is not running or paused.'; },
      clear: () => { throw 'Cannot clear while scan is ongoing, close it first.'; },
    };
    expect(() => teardownScanner(scanner as never)).not.toThrow();
  });

  it('arrête puis nettoie un scanner actif', async () => {
    const scanner = { stop: vi.fn(() => Promise.resolve()), clear: vi.fn() };
    teardownScanner(scanner as never);
    await Promise.resolve();
    await Promise.resolve();
    expect(scanner.stop).toHaveBeenCalled();
    expect(scanner.clear).toHaveBeenCalled();
  });

  it('tolère un scanner absent', () => {
    expect(() => teardownScanner(null)).not.toThrow();
  });
});