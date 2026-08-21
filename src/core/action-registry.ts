import type { Actor, SurfaceKind } from "./surface-state";

export type ActionDefinition = {
  id: string;
  label: string;
  owner: SurfaceKind;
  destination: SurfaceKind;
  actors: Actor[];
  proofId: string;
};

export const actionRegistry: readonly ActionDefinition[] = [
  { id: "open-search", label: "Search", owner: "dock", destination: "dock", actors: ["visitor", "buyer"], proofId: "V0-REGISTRY-001" },
  { id: "open-menu", label: "Menu", owner: "map", destination: "map", actors: ["visitor", "buyer", "seller", "admin"], proofId: "V0-REGISTRY-002" },
  { id: "open-results", label: "Results", owner: "dock", destination: "result", actors: ["visitor", "buyer"], proofId: "V0-REGISTRY-003" },
  { id: "open-facility", label: "Facility", owner: "result", destination: "facility", actors: ["visitor", "buyer", "seller"], proofId: "V0-REGISTRY-004" },
  { id: "open-catalogue", label: "Catalogue", owner: "facility", destination: "catalogue", actors: ["visitor", "buyer", "seller"], proofId: "V0-REGISTRY-005" },
  { id: "open-availability", label: "Availability", owner: "catalogue", destination: "availability", actors: ["buyer"], proofId: "V0-REGISTRY-006" },
  { id: "open-comparison", label: "Comparison", owner: "availability", destination: "comparison", actors: ["buyer"], proofId: "V0-REGISTRY-007" },
  { id: "open-transaction", label: "Transaction", owner: "comparison", destination: "transaction", actors: ["buyer", "seller"], proofId: "V0-REGISTRY-008" },
];

export function validateActionRegistry(actions: readonly ActionDefinition[] = actionRegistry): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const action of actions) {
    if (!action.id || ids.has(action.id)) errors.push(`duplicate-or-empty-id:${action.id}`);
    ids.add(action.id);
    if (!action.label || !action.owner || !action.destination || action.actors.length === 0 || !action.proofId) {
      errors.push(`incomplete-action:${action.id}`);
    }
  }
  return errors;
}
