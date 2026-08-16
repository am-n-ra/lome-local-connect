import { query } from "@/lib/db.server";
import { ensureCoverage, type Bounds } from "@/lib/osm-coverage.server";

type Probe = { name: string; bounds: Bounds };

const probes: Probe[] = [
  {
    name: "Aflao",
    bounds: { minLat: 6.08, minLng: 1.14, maxLat: 6.2, maxLng: 1.2 },
  },
  {
    name: "London",
    bounds: { minLat: 51.48, minLng: -0.15, maxLat: 51.55, maxLng: 0.0 },
  },
];

for (const probe of probes) {
  const before = await query<{ count: number }>(
    `SELECT count(*)::int AS count FROM public.facilities
     WHERE latitude BETWEEN $1 AND $2 AND longitude BETWEEN $3 AND $4`,
    [probe.bounds.minLat, probe.bounds.maxLat, probe.bounds.minLng, probe.bounds.maxLng],
  );
  const imported = await ensureCoverage(probe.bounds, 9);
  const rows = await query<{
    id: string;
    market_code: string;
    status: string;
    source: string | null;
    source_ref: string | null;
  }>(
    `SELECT id, market_code, status, source, source_ref
     FROM public.facilities
     WHERE latitude BETWEEN $1 AND $2 AND longitude BETWEEN $3 AND $4
     ORDER BY created_at DESC NULLS LAST`,
    [probe.bounds.minLat, probe.bounds.maxLat, probe.bounds.minLng, probe.bounds.maxLng],
  );
  const refs = rows.map((row) => row.source_ref).filter(Boolean);
  const uniqueRefs = new Set(refs);
  console.log(
    JSON.stringify({
      probe: probe.name,
      before: before[0]?.count ?? 0,
      imported,
      after: rows.length,
      osmRows: rows.filter((row) => row.source === "osm").length,
      unclaimedRows: rows.filter((row) => row.status === "unclaimed").length,
      globalRows: rows.filter((row) => row.market_code === "GLOBAL").length,
      sourceRefs: refs.length,
      uniqueSourceRefs: uniqueRefs.size,
      duplicateSourceRefs: refs.length - uniqueRefs.size,
    }),
  );
}
