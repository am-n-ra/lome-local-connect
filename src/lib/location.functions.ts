import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "./auth-middleware.server";
import { query, queryOne } from "./db.server";
import { enforceRateLimit } from "./rate-limit.server";

const locationInput = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().finite().min(0).max(100_000).nullable().optional(),
});

type LocationResolution = {
  city: string | null;
  countryCode: string | null;
  displayName: string | null;
  source: "browser_geolocation" | "unresolved";
  updatedAt: string;
};

type CachedLocation = {
  city: string | null;
  country_code: string | null;
  display_name: string | null;
};

type NominatimResponse = {
  address?: {
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    suburb?: string;
    country_code?: string;
  };
  display_name?: string;
};

function gridKey(latitude: number, longitude: number): string {
  // Three decimal places is approximately 100–110 m and avoids persisting raw coordinates.
  return `${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
}

function pickCity(address: NominatimResponse["address"]): string | null {
  if (!address) return null;
  const candidate =
    address.city ?? address.town ?? address.municipality ?? address.village ?? address.suburb ?? null;
  const normalized = candidate?.trim();
  return normalized ? normalized.slice(0, 120) : null;
}

async function resolveCity(latitude: number, longitude: number): Promise<CachedLocation> {
  const key = gridKey(latitude, longitude);
  const cached = await queryOne<CachedLocation>(
    `SELECT city, country_code, display_name
     FROM public.discovery_location_cache
     WHERE grid_key = $1 AND resolved_at > now() - interval '30 days'`,
    [key],
  );
  if (cached) return cached;

  const endpoint =
    process.env.OMNI_GEOCODER_URL ?? "https://nominatim.openstreetmap.org/reverse";
  const url = new URL(endpoint);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "10");
  url.searchParams.set("layer", "address");
  url.searchParams.set("lat", latitude.toString());
  url.searchParams.set("lon", longitude.toString());

  let resolved: CachedLocation = { city: null, country_code: null, display_name: null };
  try {
    await enforceRateLimit({
      bucket: "buyer-location-geocode",
      subject: "provider:nominatim",
      limit: 1,
      windowSeconds: 1,
      message: "La résolution de zone est momentanément limitée.",
    });
  } catch {
    return resolved;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2_500);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "fr,en",
        "User-Agent":
          process.env.OMNI_GEOCODER_USER_AGENT ??
          "Omni/1.0 (https://omni.sparkafrika.online; location discovery)",
      },
      signal: controller.signal,
    });
    if (response.ok) {
      const payload = (await response.json()) as NominatimResponse;
      resolved = {
        city: pickCity(payload.address),
        country_code: payload.address?.country_code?.toLowerCase() ?? null,
        display_name: payload.display_name?.slice(0, 500) ?? null,
      };
    }
  } catch {
    // Location should never block the map. The caller receives an unresolved result.
  } finally {
    clearTimeout(timeout);
  }

  await query(
    `INSERT INTO public.discovery_location_cache
       (grid_key, city, country_code, display_name, resolved_at)
     VALUES ($1,$2,$3,$4,now())
     ON CONFLICT (grid_key) DO UPDATE SET
       city = EXCLUDED.city,
       country_code = EXCLUDED.country_code,
       display_name = EXCLUDED.display_name,
       resolved_at = EXCLUDED.resolved_at`,
    [key, resolved.city, resolved.country_code, resolved.display_name],
  );
  return resolved;
}

export const saveBuyerDiscoveryLocation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => locationInput.parse(input))
  .handler(async ({ data, context }): Promise<LocationResolution> => {
    const resolved = await resolveCity(data.latitude, data.longitude);
    const source = resolved.city ? "browser_geolocation" : "unresolved";
    const updatedAt = new Date().toISOString();

    await query(
      `UPDATE public.profiles
       SET discovery_city = $1,
           discovery_country_code = $2,
           discovery_source = $3,
           discovery_updated_at = $4
       WHERE id = $5`,
      [resolved.city, resolved.country_code, source, updatedAt, context.userId],
    );

    return {
      city: resolved.city,
      countryCode: resolved.country_code,
      displayName: resolved.display_name,
      source,
      updatedAt,
    };
  });

export const getBuyerDiscoveryLocation = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<LocationResolution | null> => {
    const row = await queryOne<{
      discovery_city: string | null;
      discovery_country_code: string | null;
      discovery_source: "browser_geolocation" | "manual" | "legacy_market" | "unresolved";
      discovery_updated_at: string | null;
    }>(
      `SELECT discovery_city, discovery_country_code, discovery_source, discovery_updated_at
       FROM public.profiles WHERE id = $1`,
      [context.userId],
    );
    if (!row) return null;
    return {
      city: row.discovery_city,
      countryCode: row.discovery_country_code,
      displayName: null,
      source: row.discovery_source === "browser_geolocation" ? "browser_geolocation" : "unresolved",
      updatedAt: row.discovery_updated_at ?? new Date(0).toISOString(),
    };
  });
