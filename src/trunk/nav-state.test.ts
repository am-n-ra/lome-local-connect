import { describe, expect, it } from 'vitest';
import { NAV_STATE_STORAGE_KEY, parseNavState, sanitizeNavSheet, serializeNavState } from './nav-state';

describe('BRANCH-2 — mémoire de surface (revenir au même endroit)', () => {
  it('round-trips a surface (rôle + feuille + lieu + visite)', () => {
    const state = { role: 'operator', sheet: 'facility', selectedId: '11111111-1111-1111-1111-111111111111', selVisitId: '22222222-2222-2222-2222-222222222222' };
    const back = parseNavState(serializeNavState(state));
    expect(back).toEqual(state);
    expect(NAV_STATE_STORAGE_KEY).toBe('omni-nav-state');
  });

  it('refuse une surface inexploitable (rien de restauré = pas de mensonge)', () => {
    expect(parseNavState(null)).toBeNull();
    expect(parseNavState('')).toBeNull();
    expect(parseNavState('{oops')).toBeNull();
    expect(parseNavState('"just a string"')).toBeNull();
    // Feuille `facility` sans lieu → incohérent → null (jamais une fiche vide).
    expect(parseNavState(JSON.stringify({ role: 'buyer', sheet: 'facility', selectedId: null }))).toBeNull();
  });

  it('ramène une feuille inconnue ou un rôle inconnu à un état sûr', () => {
    const parsed = parseNavState(JSON.stringify({ role: 'dictator', sheet: 'menu', selectedId: null }));
    expect(parsed).not.toBeNull();
    expect(parsed?.role).toBe('buyer');
    expect(parsed?.sheet).toBe('menu');
    expect(sanitizeNavSheet('nope')).toBe('none');
    expect(sanitizeNavSheet('<script>')).toBe('none');
  });

  it('n’accepte un id de lieu que s’il ressemble à un identifiant', () => {
    const parsed = parseNavState(JSON.stringify({ role: 'buyer', sheet: 'facility', selectedId: '../../etc/passwd' }));
    expect(parsed).toBeNull();
  });
});

describe('GR-2 — la feuille résultats ne se rouvre jamais VIDE', () => {
  it('porte la requête et son niveau (S-11) dans l’état de surface', () => {
    const state = { role: 'buyer', sheet: 'results', selectedId: null, selVisitId: null, searchQuery: 'pain', searchLevel: 'offer' as const };
    const back = parseNavState(serializeNavState(state));
    expect(back?.searchQuery).toBe('pain');
    expect(back?.searchLevel).toBe('offer');
  });

  it('REGRESSION : une feuille `results` sans requête n’est pas restaurée', () => {
    // Avant le correctif, cette surface se restaurait et rouvrait une feuille vide
    // (« 0 résultat » qui n'en est pas un). Mieux vaut ne rien restaurer.
    const parsed = parseNavState(JSON.stringify({ role: 'buyer', sheet: 'results', selectedId: null, searchQuery: null }));
    expect(parsed).toBeNull();
  });

  it('borne la requête et refuse une valeur vide ou non textuelle', () => {
    expect(parseNavState(JSON.stringify({ role: 'buyer', sheet: 'results', searchQuery: '   ' }))).toBeNull();
    const long = parseNavState(JSON.stringify({ role: 'buyer', sheet: 'results', searchQuery: 'x'.repeat(500) }));
    expect(long?.searchQuery?.length).toBe(200);
    // Un niveau inconnu retombe sur `offer` — jamais une surface d'entités par accident.
    const weird = parseNavState(JSON.stringify({ role: 'buyer', sheet: 'results', searchQuery: 'pain', searchLevel: 'hack' }));
    expect(weird?.searchLevel).toBe('offer');
  });

  it('ne fait pas voyager la requête hors de la feuille résultats', () => {
    const state = { role: 'buyer', sheet: 'menu', selectedId: null, selVisitId: null };
    const back = parseNavState(serializeNavState(state));
    expect(back?.sheet).toBe('menu');
    expect(back?.searchQuery).toBeUndefined();
  });
});

describe('GR-2 (suite) — la Room en cours survit au rechargement', () => {
  const txn = '33333333-3333-3333-3333-333333333333';

  it('porte la transaction ouverte dans l’état de surface', () => {
    const back = parseNavState(serializeNavState({ role: 'buyer', sheet: 'room', selectedId: null, selVisitId: null, roomTransactionId: txn }));
    expect(back?.sheet).toBe('room');
    expect(back?.roomTransactionId).toBe(txn);
  });

  it('REGRESSION : la Room n’était PAS restaurable — recharger ramenait sur la carte nue', () => {
    // Avant le correctif, `room` n'était pas dans RESTORABLE_SHEETS : la feuille retombait
    // sur `none` et l'utilisateur perdait le fil de sa transaction.
    expect(sanitizeNavSheet('room')).toBe('room');
    const restored = parseNavState(JSON.stringify({ role: 'buyer', sheet: 'room', roomTransactionId: txn }));
    expect(restored?.sheet).toBe('room');
  });

  it('une Room SANS transaction n’est pas restaurée (jamais une Room vide)', () => {
    expect(parseNavState(JSON.stringify({ role: 'buyer', sheet: 'room' }))).toBeNull();
    expect(parseNavState(JSON.stringify({ role: 'buyer', sheet: 'room', roomTransactionId: 'not-a-uuid' }))).toBeNull();
  });

  it('la transaction ne voyage pas hors de la Room', () => {
    const back = parseNavState(serializeNavState({ role: 'seller', sheet: 'seller', selectedId: null, selVisitId: null, roomTransactionId: txn }));
    expect(back?.sheet).toBe('seller');
    expect(back?.roomTransactionId).toBeUndefined();
  });
});
