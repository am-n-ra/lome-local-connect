import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * S3-a — `setDeclaredPhone` provisionne le compte à la volée puis écrit le numéro.
 * La première version le faisait en DEUX sous-instructions dans la même requête :
 * un CTE `insert ... returning id` puis un `update ... where auth_user_id`. Or en
 * Postgres une sous-instruction ne voit pas la ligne écrite par une autre dans la
 * MÊME instruction (sémantique de snapshot) → l'update ne touchait aucune ligne et
 * la méthode renvoyait null. Découvert par la preuve contre Postgres réel
 * (`scripts/prove-s3a-declared-phone.mjs`), invisible aux tests stubbés.
 *
 * Garde statique : la méthode doit écrire avec UN SEUL `insert ... on conflict do
 * update`. Le half réel vit dans le script de preuve.
 */
const source = readFileSync(new URL('../server/trunk-repository.ts', import.meta.url), 'utf8');

describe('S3-a — setDeclaredPhone écrit en une seule instruction', () => {
  const start = source.indexOf('async setDeclaredPhone');
  const end = source.indexOf('async listRoleManagementAccounts', start);
  const block = source.slice(start, end);

  it('existe et cible la bonne table', () => {
    expect(start).toBeGreaterThan(-1);
    expect(block).toContain('insert into v2_accounts');
    expect(block).toContain('on conflict (auth_user_id) do update');
    expect(block).toContain('phone_declared');
  });

  it('ne relit pas la ligne insérée dans la même instruction (update séparé interdit)', () => {
    expect(block).not.toContain('update v2_accounts');
    expect(block).not.toContain('where auth_user_id');
  });

  it('le contrôle de format est une garde locale avant toute écriture', () => {
    expect(block).toContain("SellerCataloguePolicyError('INVALID_PHONE')");
  });
});
