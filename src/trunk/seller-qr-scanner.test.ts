import { describe, expect, it } from 'vitest';
import { extractTransactionPayload } from './SellerQrScannerSheet';
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