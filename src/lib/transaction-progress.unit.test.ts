import { describe, expect, it } from "vitest";
import {
  AVAILABILITY_PROGRESS_LABELS,
  deriveProgressStatus,
  TRANSACTION_PROGRESS_LABELS,
} from "./transaction-progress";

describe("transaction progress contract", () => {
  it("keeps all transaction labels visible in the canonical order", () => {
    expect([...TRANSACTION_PROGRESS_LABELS]).toEqual([
      "Intention",
      "Offre",
      "QR",
      "Paiement",
      "Réception",
    ]);
    expect(TRANSACTION_PROGRESS_LABELS).toHaveLength(5);
  });

  it("keeps availability labels separate from transaction labels", () => {
    expect([...AVAILABILITY_PROGRESS_LABELS]).toEqual(["Produit", "Commerces", "Contraintes"]);
  });

  it("derives complete, active and upcoming states without hiding labels", () => {
    expect([0, 1, 2, 3, 4].map((index) => deriveProgressStatus(index, 2))).toEqual([
      "complete",
      "complete",
      "active",
      "upcoming",
      "upcoming",
    ]);
  });
});
