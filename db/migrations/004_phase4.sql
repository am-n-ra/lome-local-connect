-- Phase 4 — hardening: server-side rate limiting

CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket       text NOT NULL,
  subject      text NOT NULL,
  window_start timestamptz NOT NULL,
  hits         integer NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, subject, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON public.rate_limits (window_start);
