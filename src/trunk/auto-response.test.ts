import { describe, expect, it } from 'vitest';
import { decideAutoResponse, defersOnNegotiation, type AutoResponseFacts } from './auto-response';

const NOW = Date.parse('2026-10-15T12:00:00.000Z');
// D-03 : « frais » veut dire PLUS DE 4 h devant l'échéance. À 2 h, la donnée est déjà
// « vieillissante » — encore bonne pour l'affichage, plus pour répondre automatiquement.
const IN_20H = new Date(NOW + 20 * 60 * 60 * 1000).toISOString();
const IN_2H = new Date(NOW + 2 * 60 * 60 * 1000).toISOString();
const AGO_1H = new Date(NOW - 60 * 60 * 1000).toISOString();

/** Tous les feux au vert : chaque test n'éteint QUE le fait qu'il teste. */
const green: AutoResponseFacts = {
  autoEnabled: true,
  proAlive: true,
  availabilityState: 'en_stock',
  availabilityExpiresAt: IN_20H,
  availableStock: 10,
  requestedQuantity: 3,
  listedPriceMinor: 20000,
  proposedPriceMinor: null,
  now: NOW,
};

describe('NR-9 · l’automate répond à la disponibilité, jamais à la négociation', () => {
  it('répond quand tout est vert, au prix affiché et à la quantité demandée', () => {
    const decision = decideAutoResponse(green);
    expect(decision).toEqual({
      kind: 'respond',
      status: 'available',
      quantityAvailable: 3,
      priceMinor: 20000,
      freshnessLevel: 'fresh',
    });
  });

  // LA décision produit, verrouillée seule : un prix proposé suffit à faire taire l'automate.
  it('s’abstient dès qu’un prix est proposé — même avec un stock frais et suffisant', () => {
    expect(defersOnNegotiation(15000)).toBe(true);
    const decision = decideAutoResponse({ ...green, proposedPriceMinor: 15000 });
    expect(decision.kind).toBe('defer');
    expect(decision).toMatchObject({ reason: 'negotiation-open' });
  });

  // Contrôle négatif : sans proposition, la MÊME demande obtient une réponse. Sans ce cas, le
  // test ci-dessus passerait aussi si l'automate s'abstenait toujours.
  it('la même demande SANS prix proposé obtient une réponse', () => {
    expect(defersOnNegotiation(null)).toBe(false);
    expect(decideAutoResponse({ ...green, proposedPriceMinor: null }).kind).toBe('respond');
  });

  it('ne répond pas si le réglage est éteint (C2)', () => {
    const decision = decideAutoResponse({ ...green, autoEnabled: false });
    expect(decision).toMatchObject({ kind: 'defer', reason: 'not-enabled' });
  });

  it('ne répond pas sans Pro vivant (C1) — le badge peut survivre à l’entitlement, la réponse non', () => {
    expect(decideAutoResponse({ ...green, proAlive: false })).toMatchObject({ kind: 'defer', reason: 'not-pro' });
  });

  // C5 — « ne transforme jamais une donnée périmée en vérité ».
  it('s’abstient sur un stock périmé, même si l’état affiché est « en_stock »', () => {
    const expired = decideAutoResponse({ ...green, availabilityExpiresAt: AGO_1H });
    expect(expired).toMatchObject({ kind: 'defer', reason: 'not-fresh' });

    // Vieillissant (fenêtre D-03 de 4 h) : encore bon pour l'affichage, mais plus pour répondre.
    const stale = decideAutoResponse({ ...green, availabilityExpiresAt: IN_2H });
    expect(stale).toMatchObject({ kind: 'defer', reason: 'not-fresh' });

    // Et un état non vivant ne répond jamais, quelle que soit la fenêtre.
    expect(decideAutoResponse({ ...green, availabilityState: 'a_valider' }))
      .toMatchObject({ kind: 'defer', reason: 'not-fresh' });
    expect(decideAutoResponse({ ...green, availabilityState: 'bientot' }))
      .toMatchObject({ kind: 'defer', reason: 'not-fresh' });
  });

  // C4 — « quantité insuffisante ⇒ EXCLUE, jamais partielle » (Species §113).
  it('s’abstient quand le stock ne couvre pas la demande — jamais de réponse partielle', () => {
    expect(decideAutoResponse({ ...green, availableStock: 2, requestedQuantity: 3 }))
      .toMatchObject({ kind: 'defer', reason: 'insufficient-stock' });
    // Juste assez : la borne est inclusive, on ne refuse pas une demande qu'on peut honorer.
    expect(decideAutoResponse({ ...green, availableStock: 3, requestedQuantity: 3 }).kind).toBe('respond');
  });

  it('un stock réservé à zéro (FF-8) est un refus, pas un « disponible » creux', () => {
    expect(decideAutoResponse({ ...green, availableStock: 0 }))
      .toMatchObject({ kind: 'defer', reason: 'insufficient-stock' });
  });

  // L'ordre des refus suit la chaîne d'autorité : le DROIT avant la VÉRITÉ avant la CAPACITÉ.
  it('nomme le premier obstacle dans l’ordre du droit, pas le dernier', () => {
    // Pro absent ET stock insuffisant ET prix proposé → on dit le DROIT.
    expect(decideAutoResponse({
      ...green, proAlive: false, availableStock: 0, proposedPriceMinor: 100,
    })).toMatchObject({ reason: 'not-pro' });
    // Pro vivant mais donnée périmée ET stock insuffisant → on dit la VÉRITÉ.
    expect(decideAutoResponse({
      ...green, availabilityExpiresAt: AGO_1H, availableStock: 0,
    })).toMatchObject({ reason: 'not-fresh' });
    // Frais, stock insuffisant, prix proposé → on dit la CAPACITÉ (elle bloque de toute façon).
    expect(decideAutoResponse({
      ...green, availableStock: 0, proposedPriceMinor: 100,
    })).toMatchObject({ reason: 'insufficient-stock' });
  });

  it('chaque refus porte une phrase qui NOMME la condition (jamais un échec muet)', () => {
    const refusals = [
      { ...green, autoEnabled: false },
      { ...green, proAlive: false },
      { ...green, availabilityExpiresAt: AGO_1H },
      { ...green, availableStock: 0 },
      { ...green, proposedPriceMinor: 100 },
    ];
    for (const facts of refusals) {
      const decision = decideAutoResponse(facts);
      expect(decision.kind).toBe('defer');
      if (decision.kind === 'defer') expect(decision.detail.length).toBeGreaterThan(10);
    }
  });
});
