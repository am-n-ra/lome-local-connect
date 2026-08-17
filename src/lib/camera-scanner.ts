export type CameraScannerStatus =
  "idle" | "permission_pending" | "active" | "denied" | "unsupported" | "error";

export function cameraStatusLabel(status: CameraScannerStatus): string {
  switch (status) {
    case "permission_pending":
      return "Demande d’autorisation caméra…";
    case "active":
      return "Caméra prête à scanner";
    case "denied":
      return "Caméra refusée — saisie manuelle disponible";
    case "unsupported":
      return "Scan indisponible — saisie manuelle disponible";
    case "error":
      return "Caméra indisponible — saisie manuelle disponible";
    default:
      return "Scanner QR prêt sur cet appareil";
  }
}

export function cameraPreviewShouldBeVisible(status: CameraScannerStatus): boolean {
  return status === "active";
}
