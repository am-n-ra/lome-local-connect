import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository, SellerCataloguePolicyError } from '../server/trunk-repository';

type SqlStub = ReturnType<typeof neon>;

// Un journaliseur minimal : capture le texte SQL et renvoie les lignes fournies.
function stubSql(rows: Record<string, unknown>[]): { sql: SqlStub; queries: string[] } {
  const queries: string[] = [];
  const sql = ((strings: TemplateStringsArray) => {
    queries.push(strings.raw.join('¦'));
    return Promise.resolve(rows);
  }) as SqlStub;
  return { sql, queries };
}

const migration = readFileSync(resolve(process.cwd(), 'db/migrations/068_v2_auto_availability.sql'), 'utf8');

describe('TRUNK-X2 migration 068 (disponibilité automatique)', () => {
  it('is additive and contains no destructive schema operation', () => {
    expect(migration).not.toMatch(/\b(drop\s+(table|schema|database)|truncate\b|delete\s+from)\b/i);
    expect(migration).toContain('alter table v2_products');
    expect(migration).toContain('add column if not exists auto_availability boolean not null default false');
  });

  it('defines the reconcile function with the honest rules', () => {
    expect(migration).toContain('create or replace function v2_reconcile_auto_availability()');
    // bientot reste manuel : jamais écrasé.
    expect(migration).toContain("p.availability_state <> 'bientot'");
    // l'auto n'écrit jamais verifie (palier de confiance, pas un état de stock).
    expect(migration).toContain("'en_stock'");
    expect(migration).not.toContain("then 'verifie'");
    // capacité pièce unique = 1 (R-G).
    expect(migration).toContain("uniqueness_kind = 'piece_unique'");
    // Pro vivant, lieu OU entité (R-4b).
    expect(migration).toContain('fe.state = ');
    expect(migration).toContain('fe.ends_at > now()');
    // fenêtre de fraîcheur unique 24 h.
    expect(migration).toContain("interval '24 hours'");
    // traçabilité du StockEvent.
    expect(migration).toContain("'auto_from_stock'");
    expect(migration).toContain('v2_product_stock_events');
  });
});

describe('TRUNK-X2 setProductAutoAvailability (Pro seam)', () => {
  it('rejects a non-owner / non-pro seller without reconciling', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.setProductAutoAvailability({ authUserId: 'auth-x', productId: 'product-1', enabled: true }))
      .rejects.toBeInstanceOf(SellerCataloguePolicyError);
    // La seule requête est le UPDATE gardé ; pas de réconciliation si rien n'est possédé.
    expect(call.queries).toHaveLength(1);
  });

  it('enables auto availability and reconciles immediately when owned + pro', async () => {
    const call = stubSql([{ id: 'product-1', availability_state: 'en_stock' }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.setProductAutoAvailability({ authUserId: 'auth-seller-1', productId: 'product-1', enabled: true });
    expect(result).toEqual({ productId: 'product-1', autoAvailability: true, availabilityState: 'en_stock' });
    // la porte juge l'entitlement VIVANT, jamais la colonne collante
    expect(call.queries[0]).toContain('facility_pro');
    expect(call.queries[0]).toContain('fe.ends_at > now()');
    expect(call.queries[0]).not.toContain("e.commercial_plan = 'pro_active' or f.commercial_plan");
    // activer réconcilie
    expect(call.queries.some((q) => q.includes('v2_reconcile_auto_availability'))).toBe(true);
  });

  it('disabling auto availability never reconciles', async () => {
    const call = stubSql([{ id: 'product-1', availability_state: 'en_stock' }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.setProductAutoAvailability({ authUserId: 'auth-seller-1', productId: 'product-1', enabled: false });
    expect(result.autoAvailability).toBe(false);
    expect(call.queries.some((q) => q.includes('v2_reconcile_auto_availability'))).toBe(false);
  });
});

describe('TRUNK-X2 refreshProductAvailability (Pro + auto)', () => {
  it('refuses a product that is not owned / pro / auto-enabled', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.refreshProductAvailability({ authUserId: 'auth-x', productId: 'product-1' }))
      .rejects.toBeInstanceOf(SellerCataloguePolicyError);
  });

  it('reconciles and reports the resulting state', async () => {
    const sequence: Record<string, unknown>[][] = [
      [{ id: 'product-1' }],                       // ownership/pro guard passes
      [{ availability_state: 'a_valider' }],       // prev state
      [{ v2_reconcile_auto_availability: 1 }],     // reconcile
      [{ availability_state: 'en_stock' }],        // after state
    ];
    let call = 0;
    const sql = ((strings: TemplateStringsArray) => {
      const rows = sequence[call] ?? [];
      call += 1;
      return Promise.resolve(rows);
    }) as SqlStub;
    const repository = createTrunkRepository(sql);
    const result = await repository.refreshProductAvailability({ authUserId: 'auth-seller-1', productId: 'product-1' });
    expect(result.productId).toBe('product-1');
    expect(result.availabilityState).toBe('en_stock');
    expect(result.changed).toBe(true);
  });
});
