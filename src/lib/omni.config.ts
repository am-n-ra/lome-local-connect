/** Product-wide Omni configuration flags and limits.
 *
 * Manual buyer/seller flows must not depend on the AI flags. Disable AI to hide
 * orchestration UI only; search, availability requests and purchase intents stay enabled.
 */
export const OMNI_CONFIG = {
  aiAutomationEnabled: false,
  buyerAgentEnabled: false,
  sellerAgentEnabled: false,
  mediaUiEnabled: false,
  freeBuyerBulkLimit: 3,
  sellerFreeFacilityLimit: 1,
} as const;

export type OmniConfig = typeof OMNI_CONFIG;
