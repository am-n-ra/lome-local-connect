export const v2SliceStates = ["idle", "loading", "ready", "empty", "error", "cancelled"] as const;

export type V2SliceState = (typeof v2SliceStates)[number];

export type V2RetryableError = {
  kind: "retryable";
  code: string;
  message: string;
  retry: true;
};

export type V2TerminalError = {
  kind: "terminal";
  code: string;
  message: string;
  retry: false;
};

export type V2AdapterError = V2RetryableError | V2TerminalError;

export type V2AdapterResult<T> =
  | { state: "ready"; data: T }
  | { state: "empty"; data: T | null }
  | { state: "error"; error: V2AdapterError };

export type V2SafeRuntimeInfo = {
  ok: true;
  version: "v2";
  environment: "development" | "preview" | "production";
};

export function isRetryableV2Error(error: V2AdapterError): error is V2RetryableError {
  return error.retry;
}
