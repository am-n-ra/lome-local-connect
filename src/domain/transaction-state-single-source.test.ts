import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TRANSACTION_STATES, TERMINAL_TRANSACTION_STATES } from '../domain/contracts';

// TXN-G3 (GAP-3 du registre `omni-transaction-gaps-register-2026-10-15.md`)
//
// Défaut mesuré : `expired` était ÉCRIT comme état de transaction (sweep avant verrou)
// et RENDU par le client, mais absent du type domaine et du validateur HTTP. Trois
// listes coexistaient. Règle verrouillée ici : une seule source de vérité.

const CONTRACTS = readFileSync(new URL('./contracts.ts', import.meta.url), 'utf8');
const CLIENT_TYPES = readFileSync(new URL('../trunk/types.ts', import.meta.url), 'utf8');
const HTTP = readFileSync(new URL('../server/http.ts', import.meta.url), 'utf8');

describe('TXN-G3 — une seule définition de TransactionState', () => {
  it('le domaine reconnaît expired (état réellement écrit)', () => {
    expect(TRANSACTION_STATES).toContain('expired');
    expect(TERMINAL_TRANSACTION_STATES).toContain('expired');
    expect(TERMINAL_TRANSACTION_STATES).toContain('closed');
  });

  it('le client RÉUTILISE la définition du domaine au lieu de la redéfinir', () => {
    expect(CLIENT_TYPES).toContain("export type { TransactionState } from '../domain/contracts'");
    // Plus aucune union littérale locale qui pourrait diverger.
    expect(CLIENT_TYPES).not.toContain("export type TransactionState = 'intent_created'");
  });

  it('le validateur HTTP tire sa liste du domaine (pas de troisième copie)', () => {
    expect(HTTP).toContain("import { TRANSACTION_STATES } from '../domain/contracts'");
    expect(HTTP).not.toContain('const TRANSACTION_STATES');
  });

  it('le domaine ne liste expired qu’une fois DANS TransactionState (pas de doublon)', () => {
    // `expired` existe légitimement dans AvailabilityStatus AUSSI (une demande de dispo
    // peut expirer). On scoped donc le comptage au seul bloc TransactionState.
    const block = CONTRACTS.slice(CONTRACTS.indexOf('export type TransactionState ='), CONTRACTS.indexOf('TERMINAL_TRANSACTION_STATES'));
    const occurrences = block.split("| 'expired'").length - 1;
    expect(occurrences).toBe(1);
  });
});
