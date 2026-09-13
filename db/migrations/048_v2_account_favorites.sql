-- Omni V2 persistent establishment favorites (P3 NW-13h, decision D-K / arbitration default a).
-- D-K locked: Acheteur Pro now (favoris + comparateur; recommandations ensuite).
-- Arbitration default (a): « Favoris persistants » = etablissements favoris
-- (nouvelle table v2_account_favorites, toggle étoile sur carte/détail); la
-- sauvegarde de recherches existe déjà (v2_saved_searches) — elle reste distincte.
-- Additive only, idempotent, safe to re-run.

CREATE TABLE IF NOT EXISTS public.v2_account_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  facility_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT v2_account_favorites_account_fkey
    FOREIGN KEY (account_id) REFERENCES public.v2_accounts (id) ON DELETE CASCADE,
  CONSTRAINT v2_account_favorites_facility_fkey
    FOREIGN KEY (facility_id) REFERENCES public.v2_facilities (id) ON DELETE CASCADE,
  CONSTRAINT v2_account_favorites_account_facility_unique UNIQUE (account_id, facility_id)
);
CREATE INDEX IF NOT EXISTS v2_account_favorites_account_created_idx
  ON public.v2_account_favorites (account_id, created_at DESC);
COMMENT ON TABLE public.v2_account_favorites IS
  'D-K NW-13h: buyer establishment favorites (star toggle on map/detail). One row per (account, facility), unique.';