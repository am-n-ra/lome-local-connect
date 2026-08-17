export const OMNI_SURFACE_STATES = [
  "map",
  "search_active",
  "search_results",
  "facility_selected",
  "availability",
  "availability_results",
  "purchase_intent",
  "transaction_chat",
  "completed",
] as const;

export type OmniSurfaceState = (typeof OMNI_SURFACE_STATES)[number];

export type OmniSurfaceStateInput = {
  hasSearch: boolean;
  hasResults: boolean;
  selectedFacility: boolean;
  availabilityOpen: boolean;
  hasAvailabilityResults?: boolean;
  purchaseIntentOpen?: boolean;
  transactionOpen?: boolean;
  transactionCompleted?: boolean;
  revealRunning?: boolean;
};

/**
 * Derives the visible product state from the current route/panel state.
 * This is intentionally pure so buyer and seller surfaces can share the
 * vocabulary without introducing a second state-management runtime.
 */
export function deriveOmniSurfaceState(input: OmniSurfaceStateInput): OmniSurfaceState {
  if (input.transactionCompleted) return "completed";
  if (input.transactionOpen) return "transaction_chat";
  if (input.purchaseIntentOpen) return "purchase_intent";
  if (input.availabilityOpen && input.hasAvailabilityResults) return "availability_results";
  if (input.availabilityOpen) return "availability";
  if (input.selectedFacility) return "facility_selected";
  if (input.hasSearch && input.hasResults && !input.revealRunning) return "search_results";
  if (input.hasSearch || input.revealRunning) return "search_active";
  return "map";
}

export const SURFACE_STATE_LABEL: Record<OmniSurfaceState, string> = {
  map: "Map",
  search_active: "Search active",
  search_results: "Search results",
  facility_selected: "Facility selected",
  availability: "Availability",
  availability_results: "Availability results",
  purchase_intent: "Purchase intent",
  transaction_chat: "Transaction chat",
  completed: "Completed",
};

export const OMNI_MOTION_STATES = [
  "idle",
  "locating",
  "searching",
  "revealing-region",
  "revealing-results",
  "selected",
  "transaction",
] as const;

export type OmniMotionState = (typeof OMNI_MOTION_STATES)[number];

export type OmniMotionStateInput = {
  locating?: boolean;
  searching?: boolean;
  revealRunning?: boolean;
  revealLabel?: string | null;
  selected?: boolean;
  transaction?: boolean;
};

/**
 * Pure map-motion vocabulary shared by buyer and seller surfaces.
 * MapCanvas performs camera work; this function only describes the visible state.
 */
export function deriveOmniMotionState(input: OmniMotionStateInput): OmniMotionState {
  if (input.transaction) return "transaction";
  if (input.selected) return "selected";
  if (input.revealRunning && input.revealLabel && input.revealLabel !== "Votre position") {
    return "revealing-region";
  }
  if (input.revealRunning) return "revealing-results";
  if (input.searching) return "searching";
  if (input.locating) return "locating";
  return "idle";
}

export const MOTION_STATE_LABEL: Record<OmniMotionState, string> = {
  idle: "Globe en mouvement",
  locating: "Localisation en cours",
  searching: "Recherche en cours",
  "revealing-region": "Révélation de la zone",
  "revealing-results": "Cadrage des résultats",
  selected: "Facility sélectionnée",
  transaction: "Transaction ouverte",
};
