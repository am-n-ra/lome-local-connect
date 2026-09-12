import type { SearchOptions } from './types';

export type ConstraintChipStatus = 'wired' | 'soon';

export type ChipFilter = {
  label: string;
  options: Partial<SearchOptions> | undefined;
  status: ConstraintChipStatus;
  hint: string | undefined;
};

const BUYER_BUDGET_MINOR = 15_000 * 100; // ≤ 15 000 FCFA

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

/** Chips câblées à un filtre serveur réel. Les autres restent honnêtement « bientôt ». */
export const CHIP_FILTERS: readonly ChipFilter[] = [
  { label: 'Quantité 10', options: { quantiteMin: 10 }, status: 'wired', hint: undefined },
  { label: '≤ 15 000 FCFA', options: { budgetMaxMinor: BUYER_BUDGET_MINOR }, status: 'wired', hint: undefined },
  { label: '≤ 10 km', options: { rayonKm: 10 }, status: 'wired', hint: undefined },
  { label: 'Ouvert', options: { operationalState: 'ouvert' }, status: 'wired', hint: 'Exclut les facilités fermées' },
  { label: 'Livraison', options: undefined, status: 'soon', hint: 'Bientôt: filtre livraison / retrait' },
  { label: 'Transactable', options: undefined, status: 'soon', hint: 'Bientôt: intérêt transactable par situation' },
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

/** Construit les options de recherche à partir des chips actifs câblées uniquement. */
export function chipsToSearchOptions(active: Iterable<string>): SearchOptions {
  const options: SearchOptions = { category: '' };
  for (const label of active) {
    const opts = chipOptionsFor(label) ?? rayonScopeOptionsFor(label);
    if (opts) {
      if (opts.quantiteMin !== undefined) options.quantiteMin = opts.quantiteMin;
      if (opts.budgetMaxMinor !== undefined) options.budgetMaxMinor = opts.budgetMaxMinor;
      if (opts.rayonKm !== undefined) options.rayonKm = opts.rayonKm;;
      if (opts.operationalState !== undefined) options.operationalState = opts.operationalState;
    }
  }
  return options;
}

/** Résumé des contraintes réellement appliquées ( l'intention visible sous le champ (. */
export function summarizeActiveChips(active: Iterable<string>): string[] {
  return [...active]
    .filter((label) => (chipOptionsFor(label) ?? rayonScopeOptionsFor(label)) !== undefined)
    .map((label) => label.replace(/^≤\s*/, ''));
}
