import type { SearchOptions } from './types';

export type ConstraintChipStatus = 'wired' | 'soon';

export type ChipFilter = {
  label: string;
  options: Partial<SearchOptions> | undefined;
  status: ConstraintChipStatus;
  hint: string | undefined;
};

/**
 * D-CON-3 / D-LOC-3 — the budget default is **a local amount derived from the
 * user's currency**, not a global constant. `$5` is the canonical base; the
 * pilot market (Lomé, 1 USD = 500 XOF) renders it as 2 500 F. A user elsewhere
 * gets their own currency's amount, not francs.
 *
 * Measured basis for the pilot value: the Lomé catalogue p90 is 2 500 F
 * (16 published offers; median 1 000, max 6 500).
 */
export const BUDGET_DEFAULT_USD_MINOR = 500; // $5.00
export const BUDGET_DEFAULT_LOCAL_MINOR = 2500; // pilot display, 1 USD = 500 XOF

/** Quantity threshold default (D-CON-2) — 1, genuinely editable. */
export const QUANTITY_DEFAULT = 1;

/** Portées de rayon de recherche — échelle métier réelle( quartier → ville → région → monde(. */
export const RAYON_SCOPES: readonly { label: string; rayonKm: number | null }[] = [
  { label: '1 km', rayonKm: 1 },
  { label: '5 km', rayonKm: 5 },
  { label: '10 km', rayonKm: 10 },
  { label: '25 km', rayonKm: 25 },
  { label: '100 km', rayonKm: 100 },
  { label: 'Monde', rayonKm: null },
];

export function rayonScopeOptionsFor(label: string): Partial<SearchOptions> | undefined {
  const scope = RAYON_SCOPES.find((item) => item.label === label);
  if (!scope) return undefined;
  return scope.rayonKm === null ? undefined : { rayonKm: scope.rayonKm };
}

export function rayonScopeStatusFor(label: string): ConstraintChipStatus {
  return RAYON_SCOPES.some((item) => item.label === label) ? 'wired' : 'soon';
}

export const RAYON_SCOPE_LABELS: readonly string[] = RAYON_SCOPES.map((item) => item.label);

export function isRayonScope(label: string): boolean {
  return RAYON_SCOPES.some((item) => item.label === label);
}

/**
 * D-CON-5 — three explicit families, because a switch and a threshold are not
 * the same object. A switch is *checked*; a threshold is *set*. Mixing them in
 * one row is what let a frozen threshold look like a working filter.
 *
 * 1. Disponibilité — switches, wired.
 * 2. Votre besoin — editable thresholds, wired (budget, quantity). Rendered as
 *    inputs, not chips, so the shopper can see which one is settable.
 * 3. Attributs d'offre — `soon` where the schema has no column (honest).
 *    `Livraison` and `Transactable` are deliberately **absent**: delivery is a
 *    request mode (043), transactable is a trust tier — neither is a catalogue
 *    filter, so keeping them in search would mislead.
 */
export type ConstraintGroup = {
  id: 'disponibilite' | 'besoin' | 'attributs';
  label: string;
  hint: string | undefined;
  chips: readonly ChipFilter[];
};

export const CONSTRAINT_GROUPS: readonly ConstraintGroup[] = [
  {
    id: 'disponibilite',
    label: 'Disponibilité',
    hint: undefined,
    chips: [
      { label: 'Ouvert', options: { operationalState: 'ouvert' }, status: 'wired', hint: 'Exclut les facilités fermées' },
    ],
  },
  {
    id: 'besoin',
    label: 'Votre besoin',
    hint: 'Un seuil se règle, il ne se coche pas.',
    chips: [], // rendered as editable thresholds, not chips
  },
  {
    id: 'attributs',
    label: "Attributs d'offre",
    hint: undefined,
    chips: [
      { label: 'État / condition', options: undefined, status: 'soon', hint: 'Bientôt : aucune colonne neuf/occasion dans le socle' },
      { label: 'Créneau', options: undefined, status: 'soon', hint: 'Bientôt : horaires présents, filtre serveur à construire' },
    ],
  },
];

/** Chips câblées à un filtre serveur réel. Les autres restent honnêtement « bientôt ». */
export const CHIP_FILTERS: readonly ChipFilter[] = [
  ...CONSTRAINT_GROUPS.flatMap((group) => group.chips),
];

export function chipStatusFor(label: string): ConstraintChipStatus {
  if (isRayonScope(label)) return 'wired';
  return CHIP_FILTERS.find((chip) => chip.label === label)?.status ?? 'soon';
}

export function chipOptionsFor(label: string): Partial<SearchOptions> | undefined {
  return CHIP_FILTERS.find((chip) => chip.label === label)?.options;
}

export function chipHintFor(label: string): string | undefined {
  return CHIP_FILTERS.find((chip) => chip.label === label)?.hint;
}

/** An active search, expressed as switches + set thresholds (not a chip set). */
export type SearchConstraints = {
  switches: Set<string>;
  budgetMaxMinor: number | null;
  quantiteMin: number | null;
};

export function emptyConstraints(): SearchConstraints {
  return { switches: new Set<string>(), budgetMaxMinor: null, quantiteMin: null };
}

/** Total number of active constraints — drives the honest counter. */
export function activeConstraintCount(constraints: SearchConstraints): number {
  let n = constraints.switches.size;
  if (constraints.budgetMaxMinor !== null) n += 1;
  if (constraints.quantiteMin !== null) n += 1;
  return n;
}

/**
 * Builds real search options from switches + thresholds.
 * Only wired constraints contribute — a `soon` chip never reaches the server.
 */
export function chipsToSearchOptions(
  active: Iterable<string>,
  thresholds?: { budgetMaxMinor?: number | null; quantiteMin?: number | null; budgetCurrency?: string | null; budgetRatePerUsdMinor?: number | null },
): SearchOptions {
  const options: SearchOptions = { category: '' };
  for (const label of active) {
    const opts = chipOptionsFor(label) ?? rayonScopeOptionsFor(label);
    if (!opts) continue;
    if (opts.rayonKm !== undefined) options.rayonKm = opts.rayonKm;
    if (opts.operationalState !== undefined) options.operationalState = opts.operationalState;
  }
  if (thresholds?.budgetMaxMinor !== undefined && thresholds.budgetMaxMinor !== null) {
    options.budgetMaxMinor = thresholds.budgetMaxMinor;
    if (thresholds.budgetCurrency) options.budgetCurrency = thresholds.budgetCurrency;
    if (typeof thresholds.budgetRatePerUsdMinor === 'number') options.budgetRatePerUsdMinor = thresholds.budgetRatePerUsdMinor;
  }
  if (thresholds?.quantiteMin !== undefined && thresholds.quantiteMin !== null) {
    options.quantiteMin = thresholds.quantiteMin;
  }
  return options;
}

/** Human summary of what is actually applied, in the user's own words. */
export function summarizeActiveChips(
  constraints: SearchConstraints,
  formatBudget?: (minor: number) => string,
): string[] {
  const parts: string[] = [];
  for (const label of constraints.switches) {
    if ((chipOptionsFor(label) ?? rayonScopeOptionsFor(label)) !== undefined) {
      parts.push(label.replace(/^≤\s*/, ''));
    }
  }
  if (constraints.quantiteMin !== null) parts.push(`≥ ${constraints.quantiteMin}`);
  if (constraints.budgetMaxMinor !== null) {
    parts.push(`≤ ${formatBudget ? formatBudget(constraints.budgetMaxMinor) : constraints.budgetMaxMinor}`);
  }
  return parts;
}
