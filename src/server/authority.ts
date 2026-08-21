export type AuthorityErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CLIENT_AUTHORITY_REJECTED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID"
  | "INTERNAL";

export class AuthorityError extends Error {
  constructor(
    public readonly code: AuthorityErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AuthorityError";
  }
}

export type AuthorityResult<T> =
  | { ok: true; data: T; correlationId: string }
  | { ok: false; error: { code: AuthorityErrorCode; message: string }; correlationId: string };

export function correlationId(): string {
  return `v2-${crypto.randomUUID()}`;
}

export function rejectClientAuthority(field: string): never {
  throw new AuthorityError(
    "CLIENT_AUTHORITY_REJECTED",
    `Client cannot authoritatively set ${field}`,
    { field },
  );
}

export function serverResult<T>(data: T, id = correlationId()): AuthorityResult<T> {
  return { ok: true, data, correlationId: id };
}

export function serverFailure(error: AuthorityError, id = correlationId()): AuthorityResult<never> {
  return { ok: false, error: { code: error.code, message: error.message }, correlationId: id };
}
