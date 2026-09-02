export const TRANSACTION_PROGRESS_LABELS = [
  "Intention",
  "Offre",
  "QR",
  "Paiement",
  "Réception",
] as const;

export const AVAILABILITY_PROGRESS_LABELS = ["Produit", "Commerces", "Contraintes"] as const;

export type ProgressStatus = "upcoming" | "active" | "complete" | "blocked" | "expired" | "error";

export function deriveProgressStatus(index: number, current: number): ProgressStatus {
  if (index < current) return "complete";
  if (index === current) return "active";
  return "upcoming";
}
