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
