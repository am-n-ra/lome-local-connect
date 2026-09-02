-- Reclassify legacy OSM imports outside the bounded Lomé city market.
-- Runtime viewport imports use the same geographic rule in osm-coverage.server.ts.
UPDATE public.facilities
SET market_code = 'GLOBAL'
WHERE source = 'osm'
  AND NOT (
    latitude BETWEEN 6.05 AND 6.25
    AND longitude BETWEEN 1.20 AND 1.32
  );

CREATE INDEX IF NOT EXISTS facilities_global_source_idx
  ON public.facilities (market_code, source, status);
