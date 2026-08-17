import { describe, expect, it } from "vitest";
import { cameraPreviewShouldBeVisible, cameraStatusLabel } from "./camera-scanner";

describe("camera scanner contract", () => {
  it("keeps permission and fallback states explicit", () => {
    expect(cameraStatusLabel("permission_pending")).toContain("autorisation");
    expect(cameraStatusLabel("denied")).toContain("saisie manuelle");
    expect(cameraStatusLabel("unsupported")).toContain("saisie manuelle");
  });

  it("only marks the live preview visible when the stream is active", () => {
    expect(cameraPreviewShouldBeVisible("permission_pending")).toBe(false);
    expect(cameraPreviewShouldBeVisible("active")).toBe(true);
    expect(cameraPreviewShouldBeVisible("error")).toBe(false);
  });
});
