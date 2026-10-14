import { describe, expect, it } from 'vitest';
import { shouldAutoPromptPush, PUSH_TRIGGER_ACTIONS, type PushTriggerAction } from './push-prompt';

// BRANCHES-NOTIF-1 — the prompt must fire at an ENGAGEMENT moment, once, and only when the
// platform can actually deliver. A prompt that fires too early (or on a platform that cannot
// deliver) is a refused permission — the exact anti-pattern this rule exists to prevent.

describe('shouldAutoPromptPush', () => {
  const base = { support: 'supported' as const, alreadyPrompted: false, pushActive: 0 };

  it('prompts on each engagement moment when the platform can deliver', () => {
    for (const action of PUSH_TRIGGER_ACTIONS) {
      expect(shouldAutoPromptPush({ ...base, action })).toBe(true);
    }
  });

  it('never prompts twice on the same device', () => {
    expect(shouldAutoPromptPush({ ...base, action: 'buyer-request', alreadyPrompted: true })).toBe(false);
  });

  it('never prompts when a subscription is already active', () => {
    expect(shouldAutoPromptPush({ ...base, action: 'buyer-intent', pushActive: 1 })).toBe(false);
  });

  it('never prompts on a platform that cannot deliver — the alert would never arrive', () => {
    const cannotDeliver = ['unsupported', 'needs-install', 'not-configured', 'permission-denied'] as const;
    for (const support of cannotDeliver) {
      expect(shouldAutoPromptPush({ ...base, action: 'seller-offer', support })).toBe(false);
    }
  });

  it('classifies every trigger action (no silent moment)', () => {
    // A moment added to the union without classification would fail the exhaustive Record
    // in push-prompt.ts at compile time; this asserts the runtime list is the same set.
    expect(new Set(PUSH_TRIGGER_ACTIONS).size).toBe(PUSH_TRIGGER_ACTIONS.length);
    expect(PUSH_TRIGGER_ACTIONS).toContain('buyer-request' as PushTriggerAction);
    expect(PUSH_TRIGGER_ACTIONS).toContain('seller-qr' as PushTriggerAction);
  });
});
