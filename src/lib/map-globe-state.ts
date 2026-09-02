export type CameraMode =
  | "resting_globe"
  | "manual_navigation"
  | "search_reveal"
  | "result_framing"
  | "selected_facility";

export type RevealInterruptReason =
  | "manual_interaction"
  | "new_search"
  | "selected_facility"
  | "provider_error"
  | "unmount";

const CAMERA_PRIORITY: Record<CameraMode, number> = {
  resting_globe: 1,
  result_framing: 2,
  search_reveal: 3,
  selected_facility: 4,
  manual_navigation: 5,
};

/** Higher-priority camera ownership wins. Equal-priority intents may replace each other. */
export function compareCameraPriority(current: CameraMode, next: CameraMode): number {
  return CAMERA_PRIORITY[next] - CAMERA_PRIORITY[current];
}

export function shouldAcceptCameraIntent(current: CameraMode, next: CameraMode): boolean {
  return compareCameraPriority(current, next) >= 0;
}

export function shouldCancelReveal(reason: RevealInterruptReason): boolean {
  return (
    reason === "manual_interaction" ||
    reason === "new_search" ||
    reason === "selected_facility" ||
    reason === "provider_error" ||
    reason === "unmount"
  );
}

export function nextRevealToken(current: number): number {
  return Number.isSafeInteger(current) && current >= 0 ? current + 1 : 1;
}
