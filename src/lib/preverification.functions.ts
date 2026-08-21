import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth, requireStaff } from "./auth-middleware.server";
import { db, query, queryOne } from "./db.server";
import { enforceRateLimit } from "./rate-limit.server";

const requestStatus = z.enum([
  "pending",
  "evidence_draft",
  "in_review",
  "changes_requested",
  "approved_certified",
  "approved_unconfirmed",
  "rejected",
]);
const relationship = z.enum(["owner", "representative", "employee", "agent", "other"]);
const evidenceKind = z.enum(["identity", "relationship", "facility", "offer"]);
const reviewOutcome = z.enum(["certified", "unconfirmed", "changes_requested", "rejected"]);

export type FacilityClaimRequest = {
  id: string;
  facility_id: string;
  claimant_id: string;
  company_id: string | null;
  status: z.infer<typeof requestStatus>;
  relationship: z.infer<typeof relationship>;
  claimant_name: string;
  claimant_phone: string | null;
  admin_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  facility_status?: string;
  facility_name?: string;
  claimant_email?: string | null;
};

export type FacilityClaimEvidence = {
  id: string;
  request_id: string;
  kind: z.infer<typeof evidenceKind>;
  status: "draft" | "submitted" | "accepted" | "rejected";
  reference: string | null;
  document_url: string | null;
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

const requestInput = z.object({
  facilityId: z.string().uuid(),
  claimantName: z.string().trim().min(2).max(160),
  claimantPhone: z.string().trim().max(40).nullable().optional(),
  relationship: relationship,
  companyId: z.string().uuid().nullable().optional(),
});

export const getFacilityClaimRequest = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ facilityId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    return queryOne<FacilityClaimRequest>(
      `SELECT r.*, f.status AS facility_status
       FROM public.facility_claim_requests r
       JOIN public.facilities f ON f.id = r.facility_id
       WHERE r.facility_id = $1 AND r.claimant_id = $2
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [data.facilityId, context.userId],
    );
  });

export async function createOrGetFacilityClaimRequest(input: {
  facilityId: string;
  claimantId: string;
  claimantName: string;
  claimantPhone: string | null;
  relationship: z.infer<typeof relationship>;
  companyId: string | null;
}): Promise<FacilityClaimRequest> {
  const facility = await queryOne<{ id: string; status: string }>(
    "SELECT id, status FROM public.facilities WHERE id = $1",
    [input.facilityId],
  );
  if (!facility) throw new Error("Facilité introuvable.");
  if (facility.status !== "unclaimed") {
    throw new Error("Cette facilité n'est plus disponible pour une nouvelle vérification.");
  }

  const existing = await queryOne<FacilityClaimRequest>(
    `SELECT r.*, f.status AS facility_status
     FROM public.facility_claim_requests r
     JOIN public.facilities f ON f.id = r.facility_id
     WHERE r.facility_id = $1 AND r.claimant_id = $2
       AND r.status IN ('pending','evidence_draft','in_review','changes_requested')
     ORDER BY r.created_at DESC
     LIMIT 1`,
    [input.facilityId, input.claimantId],
  );
  if (existing) return existing;

  try {
    const created = await queryOne<FacilityClaimRequest>(
      `INSERT INTO public.facility_claim_requests
         (facility_id, claimant_id, company_id, relationship, claimant_name, claimant_phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [
        input.facilityId,
        input.claimantId,
        input.companyId ?? null,
        input.relationship,
        input.claimantName,
        input.claimantPhone?.trim() || null,
      ],
    );
    if (!created) throw new Error("Impossible de créer la demande de vérification.");
    return { ...created, facility_status: "unclaimed" };
  } catch (error) {
    // The partial unique index makes duplicate taps/retries safe under concurrency.
    const raced = await queryOne<FacilityClaimRequest>(
      `SELECT r.*, f.status AS facility_status
       FROM public.facility_claim_requests r
       JOIN public.facilities f ON f.id = r.facility_id
       WHERE r.facility_id = $1 AND r.claimant_id = $2
         AND r.status IN ('pending','evidence_draft','in_review','changes_requested')
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [input.facilityId, input.claimantId],
    );
    if (raced) return raced;
    throw error;
  }
}

export const createFacilityClaimRequest = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => requestInput.parse(input))
  .handler(async ({ data, context }) => {
    await enforceRateLimit({
      bucket: "facility-verification-request",
      subject: context.userId,
      limit: 8,
      windowSeconds: 3600,
      message: "Trop de demandes de vérification. Réessayez plus tard.",
    });
    return createOrGetFacilityClaimRequest({
      facilityId: data.facilityId,
      claimantId: context.userId,
      claimantName: data.claimantName,
      claimantPhone: data.claimantPhone ?? null,
      relationship: data.relationship,
      companyId: data.companyId ?? null,
    });
  });

export const saveFacilityClaimEvidence = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        requestId: z.string().uuid(),
        kind: evidenceKind,
        reference: z.string().trim().max(500).nullable().optional(),
        documentUrl: z.string().url().max(1000).nullable().optional(),
        notes: z.string().trim().max(2000).nullable().optional(),
      })
      .refine(
        (value) => Boolean(value.reference?.trim() || value.documentUrl || value.notes?.trim()),
        "Ajoutez une référence, un document ou une note.",
      )
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const request = await queryOne<Pick<FacilityClaimRequest, "id" | "claimant_id" | "status">>(
      `SELECT id, claimant_id, status
       FROM public.facility_claim_requests
       WHERE id = $1`,
      [data.requestId],
    );
    if (!request || request.claimant_id !== context.userId) throw new Error("Demande introuvable.");
    if (!["pending", "evidence_draft", "changes_requested"].includes(request.status)) {
      throw new Error("Cette demande n'est plus modifiable.");
    }

    const saved = await queryOne<FacilityClaimEvidence>(
      `INSERT INTO public.facility_claim_evidence
         (request_id, kind, status, reference, document_url, notes, updated_at)
       VALUES ($1, $2, 'draft', $3, $4, $5, now())
       ON CONFLICT (request_id, kind) DO UPDATE SET
         status = 'draft', reference = EXCLUDED.reference, document_url = EXCLUDED.document_url,
         notes = EXCLUDED.notes, updated_at = now()
       RETURNING *`,
      [
        data.requestId,
        data.kind,
        data.reference?.trim() || null,
        data.documentUrl || null,
        data.notes?.trim() || null,
      ],
    );
    if (!saved) throw new Error("Impossible d'enregistrer cette preuve.");
    await query(
      `UPDATE public.facility_claim_requests
       SET status = 'evidence_draft', updated_at = now()
       WHERE id = $1 AND status IN ('pending','changes_requested')`,
      [data.requestId],
    );
    return saved;
  });

export const listFacilityClaimEvidence = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const request = await queryOne<{ claimant_id: string }>(
      "SELECT claimant_id FROM public.facility_claim_requests WHERE id = $1",
      [data.requestId],
    );
    if (!request || request.claimant_id !== context.userId) throw new Error("Demande introuvable.");
    return query<FacilityClaimEvidence>(
      `SELECT * FROM public.facility_claim_evidence
       WHERE request_id = $1 ORDER BY created_at ASC`,
      [data.requestId],
    );
  });

export const submitFacilityClaimRequest = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = await db().transaction((tx) => [
      tx.query(
        `WITH eligible AS (
           SELECT r.id
           FROM public.facility_claim_requests r
           JOIN public.facilities f ON f.id = r.facility_id
           WHERE r.id = $1 AND r.claimant_id = $2
             AND r.status IN ('pending','evidence_draft','changes_requested')
             AND f.status = 'unclaimed'
             AND (SELECT count(*) FROM public.facility_claim_evidence e
                  WHERE e.request_id = r.id
                    AND e.status IN ('draft','submitted','accepted')
                    AND e.kind IN ('identity','relationship','facility','offer')) = 4
         ), evidence_update AS (
           UPDATE public.facility_claim_evidence e
           SET status = 'submitted', submitted_at = now(), updated_at = now()
           FROM eligible
           WHERE e.request_id = eligible.id
           RETURNING e.request_id
         )
         UPDATE public.facility_claim_requests r
         SET status = 'in_review', submitted_at = now(), updated_at = now()
         FROM eligible
         WHERE r.id = eligible.id
         RETURNING r.*`,
        [data.requestId, context.userId],
      ),
    ]);
    const submitted = (rows[0] as FacilityClaimRequest[])[0];
    if (submitted) return submitted;

    const current = await queryOne<FacilityClaimRequest>(
      `SELECT r.*, f.status AS facility_status
       FROM public.facility_claim_requests r
       JOIN public.facilities f ON f.id = r.facility_id
       WHERE r.id = $1 AND r.claimant_id = $2`,
      [data.requestId, context.userId],
    );
    if (!current) throw new Error("Demande introuvable.");
    if (current.status === "in_review") return current;
    throw new Error("Complétez les quatre éléments de preuve avant l'envoi.");
  });

export const listMyFacilityClaimRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    query<FacilityClaimRequest>(
      `SELECT r.*, f.name AS facility_name, f.status AS facility_status
       FROM public.facility_claim_requests r
       JOIN public.facilities f ON f.id = r.facility_id
       WHERE r.claimant_id = $1 ORDER BY r.updated_at DESC`,
      [context.userId],
    ),
  );

export const listPendingFacilityClaimRequests = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async () =>
    query<FacilityClaimRequest>(
      `SELECT r.*, f.name AS facility_name, f.status AS facility_status,
              p.email AS claimant_email
       FROM public.facility_claim_requests r
       JOIN public.facilities f ON f.id = r.facility_id
       JOIN public.profiles p ON p.id = r.claimant_id
       WHERE r.status IN ('in_review','changes_requested')
       ORDER BY r.submitted_at ASC NULLS LAST, r.created_at ASC`,
    ),
  );

export const listFacilityClaimEvidenceForStaff = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) =>
    query<FacilityClaimEvidence>(
      `SELECT * FROM public.facility_claim_evidence
       WHERE request_id = $1 ORDER BY kind ASC`,
      [data.requestId],
    ),
  );

export const reviewFacilityClaimRequest = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) =>
    z
      .object({
        requestId: z.string().uuid(),
        outcome: reviewOutcome,
        reason: z.string().trim().min(3).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const facilityStatus = data.outcome === "certified" ? "certified" : data.outcome === "unconfirmed" ? "unconfirmed" : "unclaimed";
    const requestStatusValue =
      data.outcome === "certified"
        ? "approved_certified"
        : data.outcome === "unconfirmed"
          ? "approved_unconfirmed"
          : data.outcome;

    const rows = await db().transaction((tx) => [
      tx.query(
        `WITH locked AS (
           SELECT r.id AS request_id, r.facility_id, r.status AS request_status,
                  f.status AS facility_status
           FROM public.facility_claim_requests r
           JOIN public.facilities f ON f.id = r.facility_id
           WHERE r.id = $1
           FOR UPDATE OF r, f
         ), updated_request AS (
           UPDATE public.facility_claim_requests r
           SET status = $2, admin_reason = $3, reviewed_by = $4,
               reviewed_at = now(), updated_at = now()
           FROM locked
           WHERE r.id = locked.request_id
             AND locked.request_status = 'in_review'
             AND locked.facility_status = 'unclaimed'
           RETURNING r.*, locked.facility_id
         ), updated_facility AS (
           UPDATE public.facilities f
           SET status = $5,
               verified_at = CASE WHEN $5 = 'certified' THEN now() ELSE f.verified_at END,
               updated_at = now()
           FROM updated_request
           WHERE f.id = updated_request.facility_id
           RETURNING f.id, f.status
         ), audit_event AS (
           INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, detail)
           SELECT $4, 'facility.certification_outcome', 'facility_claim_request', updated_request.id,
                  jsonb_build_object(
                    'outcome', $2,
                    'facilityStatus', updated_facility.status,
                    'reason', $3
                  )
           FROM updated_request
           JOIN updated_facility ON updated_facility.id = updated_request.facility_id
           RETURNING id
         )
         SELECT updated_request.*, updated_facility.status AS facility_status
         FROM updated_request
         JOIN updated_facility ON updated_facility.id = updated_request.facility_id`,
        [data.requestId, requestStatusValue, data.reason, context.userId, facilityStatus],
      ),
    ]);
    const reviewed = (rows[0] as FacilityClaimRequest[])[0];
    if (reviewed) return reviewed;

    const current = await queryOne<FacilityClaimRequest>(
      `SELECT r.*, f.status AS facility_status
       FROM public.facility_claim_requests r
       JOIN public.facilities f ON f.id = r.facility_id
       WHERE r.id = $1`,
      [data.requestId],
    );
    if (!current) throw new Error("Demande de vérification introuvable.");
    if (current.status === requestStatusValue && current.facility_status === facilityStatus) return current;
    throw new Error("Cette demande a déjà été traitée ou sa facilité n'est plus dans l'état attendu.");
  });
