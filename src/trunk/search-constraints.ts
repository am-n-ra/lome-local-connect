import type { SearchOptions } from './types';

export type ConstraintChipStatus = 'wired' | 'soon';

export type ChipFilter = {
  label: string;
  options: Partial<SearchOptions> | undefined;
  status: ConstraintChipStatus;
  hint: string | undefined;
};

const BUYER_BUDGET_MINOR = 15_000 * 100; // ≤ 15 000 FCFA

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
    const opts = chipOptionsFor(label);
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
    .filter((label) => chipOptionsFor(label) !== undefined)
    .map((label) => label.replace(/^≤\s*/, ''));
}