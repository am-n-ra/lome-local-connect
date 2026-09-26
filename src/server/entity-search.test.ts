// Root — R-E (S-11) two-level search guards.
//
// The Seed promises two levels over ONE corpus, and the accepted maquette makes three
// promises that must survive code changes:
//   E-2  the public entity page NEVER carries seller contact (contact appears only after
//        a real purchase intent — exposing it earlier is the harm the Seed names)
//   E-5  the entity level does not filter on offer constraints (distance/budget/quantity)
//   D-01 `certified` is an INTERNAL milestone and must never surface as a public claim
//
// These drive the shipped repository read paths through the stubbed `sql`, which records
// the exact SQL text — so the invariant is asserted on the statement that would run.
import { describe, expect, it } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from './trunk-repository';

type SqlStub = ReturnType<typeof neon>;

/** Alternates row-sets per call: entity row first, then its offers. */
function stubSqlAlternating(sets: Record<string, unknown>[][]): { sql: SqlStub; queries: string[] } {
  const queries: string[] = [];
  let call = 0;
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push(strings.raw.join('¦'));
    void values;
    const rows = sets[call % sets.length] ?? [];
    call += 1;
    return Promise.resolve(rows);
  }) as SqlStub;
  return { sql, queries };
}

const entityRow = {
  id: 'entity-1',
  name: 'Boutique Kodjo',
  kind: 'organisation',
  trust_state: 'confirmed',
  category: 'Commerce',
  address: 'Lomé · Adawlato',
  latitude: 6.1319,
  longitude: 1.2225,
  offer_count: 3,
  min_price_minor: 850,
  currency: 'XOF',
  // A contact column deliberately present in the row: the mapper must NOT forward it.
  contact_phone: '+22890000000',
  contact_whatsapp: '+22890000001',
};

const offerRow = {
  id: 'product-1',
  facility_id: 'facility-1',
  name: 'Spaghetti 500 g',
  description: null,
  category: 'Épicerie',
  unit: 'paquet',
  price_minor: 850,
  currency: 'XOF',
  discount_kind: null,
  discount_value_minor: 0,
  quantity_allocated_omni: 24,
  quantity_reserved_omni: 0,
  position_kind: 'fixe',
  uniqueness_kind: null,
  handover_kind: 'retrait',
  price_kind: null,
  condition_kind: 'neuf',
  coupon_label: null,
};

describe('R-E entity search (S-11)', () => {
  it('maps the entity behind an offerer, and never exposes contact (E-2)', async () => {
    const { sql } = stubSqlAlternating([[entityRow]]);
    const repository = createTrunkRepository(sql);
    const entities = await repository.searchPublicEntities('kodjo');

    expect(entities).toHaveLength(1);
    const entity = entities[0];
    expect(entity).toMatchObject({
      id: 'entity-1',
      name: 'Boutique Kodjo',
      kind: 'organisation',
      trust: 'confirmed',
      offerCount: 3,
      minPriceMinor: 850,
      currency: 'XOF',
    });
    // E-2: the serialized public shape carries no contact, even though the row had one.
    const serialized = JSON.stringify(entity);
    expect(serialized).not.toContain('contact');
    expect(serialized).not.toContain('+22890000000');
    expect(Object.keys(entity)).not.toContain('contactPhone');
    expect(Object.keys(entity)).not.toContain('contactWhatsapp');
  });

  it('keeps `certified` internal — it never becomes a public claim (D-01)', async () => {
    const { sql } = stubSqlAlternating([[{ ...entityRow, trust_state: 'certified' }]]);
    const repository = createTrunkRepository(sql);
    const entities = await repository.searchPublicEntities();

    // `certified` is not a public label; it reads as unconfirmed, like toFacility already does.
    expect(entities[0].trust).toBe('unconfirmed');
    expect(entities[0].trust).not.toBe('certified');
  });

  it('never selects contact columns in the entity statements (E-2 at the SQL level)', async () => {
    const { sql, queries } = stubSqlAlternating([[entityRow], [offerRow]]);
    const repository = createTrunkRepository(sql);
    await repository.searchPublicEntities();
    await repository.getPublicEntity('entity-1');

    for (const query of queries) {
      expect(query).not.toContain('contact_phone');
      expect(query).not.toContain('contact_whatsapp');
    }
  });

  it('does not filter the entity level on offer constraints (E-5)', async () => {
    const { sql, queries } = stubSqlAlternating([[entityRow]]);
    const repository = createTrunkRepository(sql);
    await repository.searchPublicEntities();

    const query = queries[0];
    // Distance/budget/quantity belong to the offer level — the entity level ignores them.
    expect(query).not.toContain('budget_max');
    expect(query).not.toContain('quantite_min');
    expect(query).not.toContain('rayon_km');
    expect(query).not.toContain('6371');
  });

  it('returns the entity page with its published offers, characteristics included (S-01 + R-B)', async () => {
    const { sql } = stubSqlAlternating([[entityRow], [offerRow]]);
    const repository = createTrunkRepository(sql);
    const entity = await repository.getPublicEntity('entity-1');

    expect(entity).not.toBeNull();
    expect(entity?.offers).toHaveLength(1);
    expect(entity?.offers[0]).toMatchObject({
      id: 'product-1',
      name: 'Spaghetti 500 g',
      positionKind: 'fixe',
      handoverKind: 'retrait',
      conditionKind: 'neuf',
    });
    expect(JSON.stringify(entity)).not.toContain('contact');
  });

  it('answers null for an entity that is not publicly visible', async () => {
    const { sql } = stubSqlAlternating([[]]);
    const repository = createTrunkRepository(sql);
    expect(await repository.getPublicEntity('entity-1')).toBeNull();
  });

  it('tolerates an entity with no place (digital) — null coordinates, not a crash', async () => {
    const { sql } = stubSqlAlternating([[{ ...entityRow, latitude: null, longitude: null, address: null }]]);
    const repository = createTrunkRepository(sql);
    const entities = await repository.searchPublicEntities();

    expect(entities[0].latitude).toBeNull();
    expect(entities[0].longitude).toBeNull();
    expect(entities[0].address).toBeNull();
  });
});
