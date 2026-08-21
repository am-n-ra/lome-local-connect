import type { OmniRole } from "@/lib/map-context";

export type MapMenuSurface =
  | "carte"
  | "disponibilites"
  | "transactions"
  | "messages"
  | "recherches"
  | "panier"
  | "facilite"
  | "catalogue"
  | "demandes"
  | "scanner"
  | "coupons"
  | "wallet"
  | "compte";

export type OmniMenuAction = {
  id: string;
  label: string;
  description?: string;
  icon: string;
  surface: MapMenuSurface;
  roles: OmniRole[];
  requiresAuth: boolean;
  badge?: number;
  onSelect: () => void;
};

export type OmniMenuModel = {
  role: OmniRole;
  authenticated: boolean;
  actions: OmniMenuAction[];
  canSwitchRole: boolean;
};

export function filterMenuActions(actions: Array<OmniMenuAction | null | undefined>, role: OmniRole, _authenticated: boolean): OmniMenuAction[] {
  return actions.filter((action): action is OmniMenuAction => Boolean(action)).filter((action) => action.roles.includes(role));
}

export function createMenuAction(input: Omit<OmniMenuAction, "roles"> & { roles?: OmniRole[] }): OmniMenuAction {
  return {
    ...input,
    roles: input.roles ?? ["acheteur", "vendeur"],
  };
}
