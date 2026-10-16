import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * P4 — GEL DU PRIX (D-TXN-PRICE, option B fondateur 2026-10-16).
 *
 * Le point 4 fondateur : le prix ne doit plus bouger une fois l'achat engagé. Le gel
 * se fait à l'INTENTION, en écrivant un snapshot APPEND-ONLY qui porte l'ORIGINE
 * (`list_price_minor`, avant remise), la REMISE appliquée (`discount_minor`) et le prix
 * DÛ (`unit_price_minor`, après remise). Une fois écrit, rien ne peut le changer — même
 * si le vendeur modifie le prix ou la remise de son offre ensuite (S-26 : une transaction
 * est une version gelée).
 *
 * Ce garde verrouille le CONTRAT côté source ; la preuve réelle contre Postgres vit dans
 * `scripts/prove-price-freeze.mjs` (`npm run proof:price-freeze`), falsifiée : forcer la
 * remise à 0 fait échouer 6 assertions.
 */
const repo = readFileSync(new URL('./trunk-repository.ts', import.meta.url), 'utf8');

describe('P4 — le prix remisé est gelé à l\'intention', () => {
  it('le snapshot d\'intention écrit l\'origine ET la remise', () => {
    expect(repo).toContain('list_price_minor');
    expect(repo).toContain('discount_minor');
    // La remise est dérivée de l'OFFRE (discount_kind/discount_value) — pas d'un prix nu.
    expect(repo).toMatch(/when p\.discount_kind = 'percentage' then least\(floor\(/);
    expect(repo).toMatch(/when p\.discount_kind = 'fixed' then least\(/);
  });

  it('le prix dû est origine − remise, et le total ne porte jamais le prix plein', () => {
    expect(repo).toContain('greatest(e.base_price_minor - e.discount_per_unit, 0) * e.quantity');
  });

  it('le « ciment » est DÉRIVÉ, jamais une colonne morte (append-only)', () => {
    // La colonne `cemented_at` avait été ajoutée puis retirée (075) : le snapshot est
    // append-only, une telle colonne resterait NULL à vie. On dérive de l'état courant.
    expect(repo).not.toContain('cemented_at');
    expect(repo).toContain('cemented:');
  });
});
