export type FacilityRow = {
  id: string;
  neighbourhood?: string | null;
  owner_id: string | null;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  status: string;
  is_online: boolean;
  type: string;
  last_position_update: string | null;
};

export type ProductRow = {
  id: string;
  facility_id: string;
  name: string;
  price: number;
  in_stock: boolean;
  photo_url: string | null;
  last_confirmed_at: string | null;
};

export type SubscriptionRow = {
  facility_id: string;
  tier: string;
  wallet_balance: number;
  pro_active_until: string | null;
  last_qualifying_action_month: string | null;
};

export const CATEGORIES = [
  { value: "food", label: "Alimentation" },
  { value: "electronics", label: "Électronique" },
  { value: "fashion", label: "Mode" },
  { value: "hardware", label: "Matériaux" },
  { value: "other", label: "Artisanat & Services" },
] as const;

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Autre";
}

export const STATUS_LABEL: Record<string, string> = {
  unclaimed: "Non réclamé",
  unconfirmed: "Non confirmé",
  certified: "Vérifié",
  confirmed: "Confirmé",
};

export const STATUS_COLOR: Record<string, string> = {
  unclaimed: "#b8b0a8",
  unconfirmed: "#9a938c",
  certified: "#2f6fb5",
  confirmed: "#d9a521",
};

export function formatFcfa(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
}

export function formatDateFr(value: string | Date | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number | null): string {
  if (km === null) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function isFresh(lastConfirmedAt: string | null): boolean {
  if (!lastConfirmedAt) return false;
  return Date.now() - new Date(lastConfirmedAt).getTime() < 48 * 3600 * 1000;
}

export function freshnessLabel(lastConfirmedAt: string | null): string {
  if (!lastConfirmedAt) return "Jamais confirmé";
  const hours = Math.floor((Date.now() - new Date(lastConfirmedAt).getTime()) / 3600000);
  if (hours < 1) return "Confirmé à l'instant";
  if (hours < 24) return `Confirmé il y a ${hours} h`;
  return `Confirmé il y a ${Math.floor(hours / 24)} j`;
}

export function isProActive(sub: SubscriptionRow | null | undefined): boolean {
  if (!sub) return false;
  if (sub.tier !== "pro") return false;
  if (!sub.pro_active_until) return false;
  return new Date(sub.pro_active_until).getTime() >= Date.now() - 86400000;
}

export function daysLeft(until: string | null): number {
  if (!until) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(until).getTime() - Date.now()) / 86400000),
  );
}

export function currentMonthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function campaignCost(radiusKm: number | null, cityWide: boolean): number {
  if (cityWide) return 4000;
  return 500 * (radiusKm ?? 0);
}

export const LOME_CENTER = { lat: 6.1725, lng: 1.2314 };
