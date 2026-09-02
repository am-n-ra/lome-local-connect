export type Actor = "visitor" | "buyer" | "seller" | "admin";

export type SurfaceKind =
  | "map"
  | "dock"
  | "result"
  | "facility"
  | "catalogue"
  | "availability"
  | "comparison"
  | "transaction";

export type AsyncStatus = "idle" | "loading" | "ready" | "empty" | "error";

export type SurfaceState = {
  active: SurfaceKind;
  actor: Actor;
  query: string;
  selectedFacilityId: string | null;
  selectedProductId: string | null;
  async: AsyncStatus;
  error: string | null;
  returnSurface: SurfaceKind | null;
};

export const initialSurfaceState: SurfaceState = {
  active: "map",
  actor: "visitor",
  query: "",
  selectedFacilityId: null,
  selectedProductId: null,
  async: "idle",
  error: null,
  returnSurface: null,
};

export type SurfaceAction =
  | { type: "open"; surface: SurfaceKind; returnSurface?: SurfaceKind }
  | { type: "close" }
  | { type: "back" }
  | { type: "set-query"; query: string }
  | { type: "set-async"; async: AsyncStatus; error?: string | null }
  | { type: "select-facility"; facilityId: string; returnSurface?: SurfaceKind }
  | { type: "select-product"; productId: string }
  | { type: "set-actor"; actor: Actor };

export function reduceSurface(state: SurfaceState, action: SurfaceAction): SurfaceState {
  switch (action.type) {
    case "open":
      return {
        ...state,
        active: action.surface,
        returnSurface: action.returnSurface ?? state.active,
        error: null,
      };
    case "close":
      return { ...state, active: "map", returnSurface: null, error: null };
    case "back":
      return { ...state, active: state.returnSurface ?? "map", returnSurface: null, error: null };
    case "set-query":
      return { ...state, query: action.query };
    case "set-async":
      return { ...state, async: action.async, error: action.error ?? null };
    case "select-facility":
      return { ...state, selectedFacilityId: action.facilityId, active: "facility", returnSurface: action.returnSurface ?? "map" };
    case "select-product":
      return { ...state, selectedProductId: action.productId, active: "catalogue", returnSurface: "facility" };
    case "set-actor":
      return { ...state, actor: action.actor };
    default:
      return state;
  }
}
