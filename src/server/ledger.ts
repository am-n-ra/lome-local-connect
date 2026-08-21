import { correlationId, type AuthorityResult, serverResult } from "./authority";

export type AuditEvent = {
  id: string;
  action: string;
  actor: string;
  correlationId: string;
  timestamp: string;
  outcome: "success" | "failure";
  reason?: string;
};

export type MutationContext = {
  actor: string;
  correlationId?: string;
  idempotencyKey: string;
};

const idempotency = new Map<string, AuthorityResult<unknown>>();
const auditEvents: AuditEvent[] = [];

export function auditLog(): readonly AuditEvent[] {
  return auditEvents;
}

export function executeIdempotent<T>(
  action: string,
  context: MutationContext,
  operation: () => T,
): AuthorityResult<T> {
  const existing = idempotency.get(context.idempotencyKey);
  if (existing) return existing as AuthorityResult<T>;

  const requestId = context.correlationId ?? correlationId();
  try {
    const result = serverResult(operation(), requestId);
    idempotency.set(context.idempotencyKey, result);
    auditEvents.push({
      id: `audit-${crypto.randomUUID()}`,
      action,
      actor: context.actor,
      correlationId: requestId,
      timestamp: new Date().toISOString(),
      outcome: "success",
    });
    return result;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown mutation failure";
    auditEvents.push({
      id: `audit-${crypto.randomUUID()}`,
      action,
      actor: context.actor,
      correlationId: requestId,
      timestamp: new Date().toISOString(),
      outcome: "failure",
      reason,
    });
    throw error;
  }
}

export function resetProofLedger(): void {
  idempotency.clear();
  auditEvents.splice(0, auditEvents.length);
}
