import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "./auth-middleware";
import { query, queryOne } from "./db.server";

export type MediaRow = {
  id: string;
  kind: "image" | "video";
  url: string;
  thumb_url: string | null;
  position: number;
  duration_s: number | null;
};

export const MEDIA_LIMITS = {
  facilityImages: 6,
  facilityVideos: 2,
  productImages: 4,
  maxImageBytes: 3 * 1024 * 1024,
  maxVideoBytes: 25 * 1024 * 1024,
  maxVideoSeconds: 60,
} as const;

const STORAGE_UNSET = "Stockage média non configuré. Ajoutez les variables R2 pour activer l'envoi.";

async function assertFacilityOwner(userId: string, facilityId: string) {
  const row = await queryOne<{ id: string }>(
    "SELECT id FROM public.facilities WHERE id = $1 AND owner_id = $2",
    [facilityId, userId],
  );
  if (!row) throw new Error("Ce commerce ne vous appartient pas.");
}

async function assertProductOwner(userId: string, productId: string) {
  const row = await queryOne<{ id: string }>(
    `SELECT p.id FROM public.products p
     JOIN public.facilities f ON f.id = p.facility_id
     WHERE p.id = $1 AND f.owner_id = $2`,
    [productId, userId],
  );
  if (!row) throw new Error("Ce produit ne vous appartient pas.");
}

/** Public read: media attached to a facility, showcase first. */
export const listFacilityMedia = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ facilityId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) =>
    query<MediaRow>(
      `SELECT id, kind, url, thumb_url, position, duration_s
       FROM public.facility_media WHERE facility_id = $1
       ORDER BY position ASC, created_at ASC`,
      [data.facilityId],
    ),
  );

/**
 * Validates the file, then returns a presigned R2 URL the browser uploads to.
 * Fails with a clear message while the storage credentials are missing.
 */
export const createMediaUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        scope: z.enum(["facility", "product"]),
        targetId: z.string().uuid(),
        kind: z.enum(["image", "video"]),
        contentType: z.string().max(100),
        bytes: z.number().int().positive(),
        durationS: z.number().int().min(0).max(3600).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.scope === "facility") await assertFacilityOwner(context.userId, data.targetId);
    else await assertProductOwner(context.userId, data.targetId);

    if (data.kind === "image") {
      if (!data.contentType.startsWith("image/")) throw new Error("Format d'image invalide.");
      if (data.bytes > MEDIA_LIMITS.maxImageBytes)
        throw new Error("Image trop lourde (3 Mo maximum après compression).");
    } else {
      if (data.scope === "product") throw new Error("Les vidéos ne sont pas permises sur un produit.");
      if (!data.contentType.startsWith("video/")) throw new Error("Format vidéo invalide.");
      if (data.bytes > MEDIA_LIMITS.maxVideoBytes)
        throw new Error("Vidéo trop lourde (25 Mo maximum).");
      if ((data.durationS ?? 0) > MEDIA_LIMITS.maxVideoSeconds)
        throw new Error("Vidéo trop longue (60 secondes maximum).");
    }

    // Quota check before signing anything.
    if (data.scope === "facility") {
      const counts = await queryOne<{ images: number; videos: number }>(
        `SELECT
           count(*) FILTER (WHERE kind = 'image')::int AS images,
           count(*) FILTER (WHERE kind = 'video')::int AS videos
         FROM public.facility_media WHERE facility_id = $1`,
        [data.targetId],
      );
      if (data.kind === "image" && (counts?.images ?? 0) >= MEDIA_LIMITS.facilityImages)
        throw new Error(`Maximum ${MEDIA_LIMITS.facilityImages} photos par commerce.`);
      if (data.kind === "video" && (counts?.videos ?? 0) >= MEDIA_LIMITS.facilityVideos)
        throw new Error(`Maximum ${MEDIA_LIMITS.facilityVideos} vidéos par commerce.`);
    } else {
      const row = await queryOne<{ n: number }>(
        "SELECT count(*)::int AS n FROM public.product_media WHERE product_id = $1",
        [data.targetId],
      );
      if ((row?.n ?? 0) >= MEDIA_LIMITS.productImages)
        throw new Error(`Maximum ${MEDIA_LIMITS.productImages} photos par produit.`);
    }

    const { r2Config, presignPut, publicUrlFor } = await import("./r2.server");
    const config = r2Config();
    if (!config) throw new Error(STORAGE_UNSET);

    const ext = data.kind === "image" ? "webp" : "mp4";
    const key = `${data.scope}/${data.targetId}/${crypto.randomUUID()}.${ext}`;
    const uploadUrl = await presignPut(config, key, data.contentType);
    return { uploadUrl, key, publicUrl: publicUrlFor(config, key) };
  });

/** Records an uploaded object once the browser PUT succeeded. */
export const registerMedia = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        scope: z.enum(["facility", "product"]),
        targetId: z.string().uuid(),
        kind: z.enum(["image", "video"]),
        url: z.string().url(),
        thumbUrl: z.string().url().nullable().optional(),
        storageKey: z.string().max(300),
        bytes: z.number().int().positive(),
        durationS: z.number().int().min(0).max(3600).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.scope === "facility") {
      await assertFacilityOwner(context.userId, data.targetId);
      const next = await queryOne<{ n: number }>(
        "SELECT COALESCE(max(position), -1) + 1 AS n FROM public.facility_media WHERE facility_id = $1",
        [data.targetId],
      );
      const row = await queryOne<MediaRow>(
        `INSERT INTO public.facility_media
           (facility_id, kind, url, thumb_url, storage_key, position, bytes, duration_s)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id, kind, url, thumb_url, position, duration_s`,
        [
          data.targetId,
          data.kind,
          data.url,
          data.thumbUrl ?? null,
          data.storageKey,
          next?.n ?? 0,
          data.bytes,
          data.durationS ?? null,
        ],
      );
      return row!;
    }

    await assertProductOwner(context.userId, data.targetId);
    const next = await queryOne<{ n: number }>(
      "SELECT COALESCE(max(position), -1) + 1 AS n FROM public.product_media WHERE product_id = $1",
      [data.targetId],
    );
    const row = await queryOne<MediaRow>(
      `INSERT INTO public.product_media (product_id, url, thumb_url, storage_key, position, bytes)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, 'image'::text AS kind, url, thumb_url, position, NULL::int AS duration_s`,
      [data.targetId, data.url, data.thumbUrl ?? null, data.storageKey, next?.n ?? 0, data.bytes],
    );
    // The first product photo also becomes the product thumbnail.
    await query(
      "UPDATE public.products SET photo_url = COALESCE(photo_url, $2) WHERE id = $1",
      [data.targetId, data.url],
    );
    return row!;
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z.object({ scope: z.enum(["facility", "product"]), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const table = data.scope === "facility" ? "facility_media" : "product_media";
    const owned = await queryOne<{ id: string; storage_key: string | null }>(
      data.scope === "facility"
        ? `SELECT m.id, m.storage_key FROM public.facility_media m
           JOIN public.facilities f ON f.id = m.facility_id
           WHERE m.id = $1 AND f.owner_id = $2`
        : `SELECT m.id, m.storage_key FROM public.product_media m
           JOIN public.products p ON p.id = m.product_id
           JOIN public.facilities f ON f.id = p.facility_id
           WHERE m.id = $1 AND f.owner_id = $2`,
      [data.id, context.userId],
    );
    if (!owned) throw new Error("Média introuvable.");

    await query(`DELETE FROM public.${table} WHERE id = $1`, [data.id]);

    if (owned.storage_key) {
      const { r2Config, deleteObject } = await import("./r2.server");
      const config = r2Config();
      if (config) {
        try {
          await deleteObject(config, owned.storage_key);
        } catch {
          /* the row is gone; the orphan object is cleaned up separately */
        }
      }
    }
    return { ok: true };
  });

/** Reorders media; the first item is the showcase (vitrine). */
export const reorderMedia = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        scope: z.enum(["facility", "product"]),
        targetId: z.string().uuid(),
        orderedIds: z.array(z.string().uuid()).max(20),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.scope === "facility") await assertFacilityOwner(context.userId, data.targetId);
    else await assertProductOwner(context.userId, data.targetId);

    const table = data.scope === "facility" ? "facility_media" : "product_media";
    const column = data.scope === "facility" ? "facility_id" : "product_id";
    for (const [index, id] of data.orderedIds.entries()) {
      await query(
        `UPDATE public.${table} SET position = $1 WHERE id = $2 AND ${column} = $3`,
        [index, id, data.targetId],
      );
    }
    return { ok: true };
  });
