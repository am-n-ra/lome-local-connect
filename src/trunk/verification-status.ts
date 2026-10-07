/**
 * DS-14 `seller-verif` (maquette : « État de votre vérification ») — la surface
 * côté VENDEUR de l'état de vérification de son entité.
 *
 * Deux règles porteuses, pures donc testables :
 *  - `sellerVerificationBadge` : l'état de confiance interne → le **badge
 *    public** que le vendeur voit. `certified` est un palier INTERNE (S-31) :
 *    il n'est jamais un badge public ; il se lit `confirmée`.
 *  - `sellerVerificationStep` : la **prochaine étape** — quelle que soit la
 *    source (demande, visite terrain, badge), on montre l'étape qui est vraie
 *    en premier, jamais une étape inventée.
 *
 * D-OPS-5 : la surface ne lit que ce que le vendeur a le droit de voir — badge,
 * étape, ventes qualifiantes, zone/date de visite. Jamais un contact acheteur,
 * jamais un message.
 */

export type VerificationBadge = 'unclaimed' | 'unconfirmed' | 'confirmed';

export type VerificationStep =
  | 'not_requested'
  | 'evidence_pending'
  | 'in_review'
  | 'visit_scheduled'
  | 'badge_settled';

/** Le badge public que le vendeur voit, dérivé de l'état de confiance interne. */
export function sellerVerificationBadge(trustState: string): VerificationBadge {
  switch (trustState) {
    case 'confirmed':
    case 'certified':
      // `certified` est un palier INTERNE : publiquement, c'est « confirmée ».
      return 'confirmed';
    case 'unconfirmed':
      return 'unconfirmed';
    default:
      // unclaimed, verification_draft/submitted, admin_review, needs_more_evidence,
      // rejected, suspended : tant qu'un badge n'est pas gagné, le public reste
      // « non revendiquée ». On ne peint jamais une confiance non acquise.
      return 'unclaimed';
  }
}

export function verificationBadgeLabel(badge: VerificationBadge): string {
  switch (badge) {
    case 'confirmed':
      return 'Confirmée';
    case 'unconfirmed':
      return 'Non confirmée';
    default:
      return 'Non revendiquée';
  }
}

/**
 * L'étape visible. Priorité au FAIT le plus avancé :
 * 1. un badge gagné (`confirmed`/`certified`) → `badge_settled` ;
 * 2. une visite terrain vivante (`a_visiter`/`en_cours`) → `visit_scheduled` ;
 * 3. une demande en revue équipe → `in_review` ;
 * 4. une demande à compléter, ou un état `unconfirmed` (preuves en cours) →
 *    `evidence_pending` ;
 * 5. sinon → `not_requested`.
 */
export function sellerVerificationStep(input: {
  trustState: string;
  requestState: string | null;
  visitState: string | null;
}): VerificationStep {
  if (sellerVerificationBadge(input.trustState) === 'confirmed') return 'badge_settled';
  if (input.visitState === 'a_visiter' || input.visitState === 'en_cours') return 'visit_scheduled';
  if (input.requestState === 'submitted' || input.requestState === 'admin_review') return 'in_review';
  if (
    input.requestState === 'draft'
    || input.requestState === 'needs_more_evidence'
    || input.trustState === 'unconfirmed'
  ) {
    return 'evidence_pending';
  }
  return 'not_requested';
}

export function verificationStepLabel(step: VerificationStep, evidence: { qualifyingSales: number; requiredCount: number }, hasVisit: boolean): string {
  switch (step) {
    case 'badge_settled':
      return 'Vérification confirmée';
    case 'visit_scheduled':
      return hasVisit ? 'Visite terrain programmée' : 'Visite terrain à programmer';
    case 'in_review':
      return 'En revue par l’équipe';
    case 'evidence_pending':
      return evidence.requiredCount > 1
        ? `Preuves en cours · ${evidence.qualifyingSales}/${evidence.requiredCount} ventes`
        : 'Preuves en cours';
    default:
      return 'Pas encore demandée';
  }
}
