ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_source_check;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_source_check
  CHECK (source IN ('manual', 'provider', 'allowlist'));

CREATE INDEX IF NOT EXISTS user_roles_active_idx
  ON public.user_roles (user_id, role, expires_at);
