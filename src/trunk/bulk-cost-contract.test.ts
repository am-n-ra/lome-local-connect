import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * D-C5 — le mot « bulk » et la facture disent la même chose que le serveur (R-4 :
 * 1 crédit par besoin, quel que soit le nombre de fournisseurs). Le serveur a basculé
 * mais le client enseignait encore l'ancien `ceil(N/100)` (phrase + calcul) et la fiche
 * multi-produits d'UNE facilité s'affichait sous l'en-tête bulk. Trois mensonges lents.
 *
 * Pourquoi un garde de source plutôt qu'un rendu : `TrunkAppV13` monte une carte et
 * l'API ; le monter pour vérifier un libellé coûterait plus qu'il ne prouve. On vérifie
 * le texte qui engage (phrase de coût, calcul, en-tête).
 */
const source = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');

describe('bulk cost and naming contract (D-C5)', () => {
  it('never prices by supplier count (the retired ceil(N/100) model)', () => {
    expect(source).not.toMatch(/Math\.ceil\(targets\.length \/ 100\)/);
    expect(source).not.toContain('par tranche de 100 facilités');
  });

  it('teaches one credit per need and a free single check', () => {
    expect(source).toContain('1 crédit par besoin');
    expect(source).toContain("d'une seule facilité reste gratuite");
  });

  it('refuses a one-supplier bulk before the server 409, naming the free path', () => {
    expect(source).toContain('au moins 2 facilités');
    expect(source).toContain('vérification manuelle gratuite');
  });

  it('shows single-supplier grouped manuals under their own name, never as bulk', () => {
    expect(source).toContain('Demandes manuelles');
    expect(source).toContain('Plusieurs produits, une facilité');
  });
});
