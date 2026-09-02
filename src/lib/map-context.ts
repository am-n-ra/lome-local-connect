import type { MapFilters } from "@/lib/search-dock-contract";

export type OmniRole = "acheteur" | "vendeur";
export type MapRoute = "/carte" | "/vendeur";

export type MapViewport = {
  west: number;
  south: number;
  east: number;
  north: number;
  zoom: number;
};

export type MapContextSnapshot = {
  route: MapRoute;
  role: OmniRole;
  query: string;
  category: string | null;
  filters: MapFilters;
  quantity: number;
  budget: number | null;
  selectedFacilityId: string | null;
  viewport: MapViewport | null;
  returnTo: string;
  createdAt: number;
  expiresAt: number;
};

const STORAGE_KEY = "omni.map-context.v1";
const DEFAULT_TTL_MS = 15 * 60 * 1000;
let memorySnapshot: MapContextSnapshot | null = null;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isValidMapContextSnapshot(value: unknown, now = Date.now()): value is MapContextSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<MapContextSnapshot>;
  if (snapshot.route !== "/carte" && snapshot.route !== "/vendeur") return false;
  if (snapshot.role !== "acheteur" && snapshot.role !== "vendeur") return false;
  if (typeof snapshot.query !== "string" || typeof snapshot.returnTo !== "string") return false;
  if (!snapshot.filters || typeof snapshot.filters !== "object") return false;
  if (!isFiniteNumber(snapshot.quantity) || snapshot.quantity < 1) return false;
  if (snapshot.budget !== null && !isFiniteNumber(snapshot.budget)) return false;
  if (snapshot.viewport !== null) {
    if (!snapshot.viewport || !isFiniteNumber(snapshot.viewport.west) || !isFiniteNumber(snapshot.viewport.south) || !isFiniteNumber(snapshot.viewport.east) || !isFiniteNumber(snapshot.viewport.north) || !isFiniteNumber(snapshot.viewport.zoom)) return false;
  }
  if (!isFiniteNumber(snapshot.createdAt) || !isFiniteNumber(snapshot.expiresAt) || snapshot.expiresAt <= now) return false;
  return true;
}

export function createMapContextSnapshot(input: Omit<MapContextSnapshot, "createdAt" | "expiresAt"> & { ttlMs?: number }, now = Date.now()): MapContextSnapshot {
  const { ttlMs = DEFAULT_TTL_MS, ...safe } = input;
  const snapshot: MapContextSnapshot = {
    ...safe,
    query: safe.query.slice(0, 300),
    category: safe.category?.slice(0, 80) ?? null,
    returnTo: safe.returnTo.startsWith("/") ? safe.returnTo.slice(0, 240) : "/carte",
    createdAt: now,
    expiresAt: now + Math.max(1_000, ttlMs),
  };
  return snapshot;
}

export function saveMapContext(snapshot: MapContextSnapshot): void {
  if (!isValidMapContextSnapshot(snapshot)) return;
  memorySnapshot = snapshot;
  const storage = getStorage();
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Memory fallback remains available when storage is blocked or full.
  }
}

export function readMapContext(now = Date.now()): MapContextSnapshot | null {
  const storage = getStorage();
  let candidate: unknown = memorySnapshot;
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) candidate = JSON.parse(raw) as unknown;
  } catch {
    candidate = memorySnapshot;
  }
  if (!isValidMapContextSnapshot(candidate, now)) {
    clearMapContext();
    return null;
  }
  memorySnapshot = candidate;
  return candidate;
}

export function clearMapContext(): void {
  memorySnapshot = null;
  try {
    getStorage()?.removeItem(STORAGE_KEY);
  } catch {
    // Best effort cleanup.
  }
}

export function getMapContextStorageKey(): string {
  return STORAGE_KEY;
}
