import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// TXN-G1 (GAP-1 du registre `omni-transaction-gaps-register-2026-10-15.md`)
//
// Défaut mesuré : `listOpenTransactions` exclut `<> 'closed'` ET l'intention
// `expired` ; `listClosedTransactions` n'acceptait que `= 'closed'`. Une
// transaction expirée n'apparaissait donc NULLE PART — elle disparaissait, et
// le message d'honnêteté « Rien n'a été débité » que la Room porte était
// inatteignable par aucun chemin.
//
// Règle verrouillée ici : une intention expirée est TERMINALE. Elle appartient à
// l'historique (« Terminées »), étiquetée « Expirée », SANS reçu (aucun achat).

const REPO = readFileSync(new URL('../server/trunk-repository.ts', import.meta.url), 'utf8');
const APP = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');
const SELLER = readFileSync(new URL('./SellerV13.tsx', import.meta.url), 'utf8');

describe('TXN-G1 — une transaction expirée ne disparaît plus', () => {
  it('la lecture historique couvre les deux formes d’expiration', () => {
    expect(REPO).toContain("current_state in ('closed', 'expired')");
    expect(REPO).toContain("pi2.state = 'expired'");
    // La projection rend un état honnête, jamais un `intent_created` mensonger.
    expect(REPO).toContain("when mi.current_state = 'closed' then 'closed'");
  });

  it('la lecture « en cours » exclut toujours l’expirée (elle n’est plus reprenable)', () => {
    // On ne veut pas d'un doublon : en cours = non terminal ; expirée = terminal.
    expect(REPO).toContain("where mi.current_state <> 'closed'");
    expect(REPO).toContain("pi2.state = 'expired'");
  });

  it('l’UI acheteur étiquette « Expirée » et n’ouvre PAS le reçu', () => {
    expect(APP).toContain("expired ? 'Expirée' : 'Clôturée'");
    expect(APP).toContain("if (expired) { void openRoom(transaction); return; }");
    // Le reçu est un achat gelé ; une expirée n'a rien à compter.
    expect(APP).toContain("expired ? 'Aucun débit · ' : 'Reçu · '");
  });

  it('l’UI vendeur étiquette aussi « Expirée »', () => {
    expect(SELLER).toContain("expired ? 'Expirée' : 'Clôturée'");
  });
});
