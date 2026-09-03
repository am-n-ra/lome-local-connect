import { upload as uploadPrivateBlob } from '@vercel/blob/client';
import type { AccountCapabilitiesResult, AdminAuditListResult, AdminConsoleResult, ApiResult, FacilityOperationalState, RoleManagementAccount, RoleManagementResult, AvailabilityResponseStatus, AvailabilityResponsesResult, AvailabilityResult, BuyerAvailabilityRequestList, ClaimDraftResult, ClaimEvidenceItem, ClaimSubmitResult, EvidenceKind, ExternalPaymentConfirmationResult, ExternalPaymentDeclarationResult, ExternalPaymentMethod, FacilityDetail, NotificationInboxResult, OperatorRunsResult, PublicFacility, PublicFacilityImportResult, PurchaseIntentResult, QrTokenIssueResult, QrVerificationResult, ReviewClaimResult, ReviewOutcome, ReviewQueueResult, SearchOptions, SellerAvailabilityQueue, SellerCatalogueResult, TransactionRatingResult, TransactionMessagesResult, TransactionState, TransactionTransitionResult, WalletOverviewResult, WalletRechargeResult, FacilityProActivationResult } from './types';

async function parse<T>(response: Response): Promise<ApiResult<T>> {
  const payload = (await response.json()) as ApiResult<T>;
  if (!response.ok && payload.ok !== false) {
    return { ok: false, correlationId: 'client-error', error: { code: `HTTP_${response.status}`, message: 'The request could not be completed.', retryable: response.status >= 500 } };
  }
  return payload;
}

async function fetchWithRecovery(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let response = await fetch(input, init);
  if (response.status >= 500) {
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    response = await fetch(input, init);
  }
  return response;
}

export async function getAccountCapabilities(input: { token: string }): Promise<ApiResult<AccountCapabilitiesResult>> {
  const response = await fetchWithRecovery('/api/v2/account/context', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<AccountCapabilitiesResult>(response);
}

export async function getRoleManagementAccounts(input: { token: string }): Promise<ApiResult<{ authorized: boolean; accounts: RoleManagementAccount[] }>> {
  const response = await fetchWithRecovery('/api/v2/admin/role-management', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse(response);
}

export async function setManagedStaffRole(input: { token: string; accountId: string; role: 'operator' | 'reviewer'; status: 'active' | 'revoked'; reason: string }): Promise<ApiResult<RoleManagementResult>> {
  const response = await fetchWithRecovery('/api/v2/admin/role-management', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ accountId: input.accountId, role: input.role, status: input.status, reason: input.reason }),
  });
  return parse(response);
}

export async function getAdminConsole(input: { token: string }): Promise<ApiResult<AdminConsoleResult>> {
  const response = await fetchWithRecovery('/api/v2/admin/console', { headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` } });
  return parse(response);
}

export async function listAdminAuditEvents(input: { token: string; eventType?: string; limit?: number }): Promise<ApiResult<AdminAuditListResult>> {
  const params = new URLSearchParams();
  if (input.eventType?.trim()) params.set('event_type', input.eventType.trim());
  if (typeof input.limit === 'number') params.set('limit', String(input.limit));
  const response = await fetchWithRecovery(`/api/v2/admin/audit-events?${params.toString()}`, { headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` } });
  return parse(response);
}

export async function setFacilityOperationalState(input: { token: string; facilityId: string; state: FacilityOperationalState; reason: string }): Promise<ApiResult<{ facilityId: string; operationalState: FacilityOperationalState }>> {
  const response = await fetchWithRecovery(`/api/v2/admin/facilities/${encodeURIComponent(input.facilityId)}/operational-state`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ state: input.state, reason: input.reason }),
  });
  return parse(response);
}

export async function correctFacilitySalesCounter(input: { token: string; facilityId: string; qualifyingSales: number; reason: string }): Promise<ApiResult<{ facilityId: string; qualifyingSales: number; previousQualifyingSales: number }>> {
  const response = await fetchWithRecovery(`/api/v2/admin/facilities/${encodeURIComponent(input.facilityId)}/sales-counter`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ qualifyingSales: input.qualifyingSales, reason: input.reason }),
  });
  return parse(response);
}

export async function listPublicFacilities(bounds?: [number, number, number, number], query?: string, options?: SearchOptions): Promise<ApiResult<PublicFacility[]>> {
  const params = new URLSearchParams();
  if (bounds) ['west', 'south', 'east', 'north'].forEach((key, index) => params.set(key, String(bounds[index])));
  if (query?.trim()) params.set('q', query.trim());
  if (options?.category) params.set('category', options.category);
  if (typeof options?.budgetMaxMinor === 'number') params.set('budget_max', String(options.budgetMaxMinor));
  if (typeof options?.quantiteMin === 'number') params.set('quantite_min', String(options.quantiteMin));
  if (typeof options?.rayonKm === 'number') params.set('rayon_km', String(options.rayonKm));
  const response = await fetchWithRecovery(`/api/v2/public/facilities?${params.toString()}`, { headers: { Accept: 'application/json' } });
  return parse<PublicFacility[]>(response);
}

export async function getFacilityDetail(id: string): Promise<ApiResult<FacilityDetail>> {
  const response = await fetchWithRecovery(`/api/v2/facilities/${encodeURIComponent(id)}`, { headers: { Accept: 'application/json' } });
  return parse<FacilityDetail>(response);
}

export async function requestAvailability(input: {
  productId: string;
  facilityId: string;
  quantity: number;
  budgetMode: 'unlimited' | 'maximum';
  budgetMinor: number | null;
  token: string;
  idempotencyKey: string;
}): Promise<ApiResult<AvailabilityResult>> {
  const response = await fetchWithRecovery('/api/v2/availability', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.token}`,
      'Idempotency-Key': input.idempotencyKey,
    },
    body: JSON.stringify({
      productId: input.productId,
      facilityId: input.facilityId,
      quantity: input.quantity,
      budgetMode: input.budgetMode,
      budgetMinor: input.budgetMinor,
    }),
  });
  return parse<AvailabilityResult>(response);
}

export async function getBuyerAvailabilityRequests(input: { token: string }): Promise<ApiResult<BuyerAvailabilityRequestList>> {
  const response = await fetchWithRecovery('/api/v2/availability-responses', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<BuyerAvailabilityRequestList>(response);
}

export async function getAvailabilityResponses(input: { requestId: string; token: string }): Promise<ApiResult<AvailabilityResponsesResult>> {
  const params = new URLSearchParams({ requestId: input.requestId });
  const response = await fetchWithRecovery(`/api/v2/availability-responses?${params.toString()}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<AvailabilityResponsesResult>(response);
}

export async function getWalletOverview(input: { token: string }): Promise<ApiResult<WalletOverviewResult>> {
  const response = await fetchWithRecovery('/api/v2/wallet', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<WalletOverviewResult>(response);
}
export async function createWalletRecharge(input: { token: string; amountMinor: number; currency: string; callbackUrl: string; customer?: { email?: string | null; firstName?: string | null; lastName?: string | null }; idempotencyKey: string }): Promise<ApiResult<WalletRechargeResult>> {
  const response = await fetchWithRecovery('/api/v2/wallet/recharges', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}`, 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({ amountMinor: input.amountMinor, currency: input.currency, callbackUrl: input.callbackUrl, customer: input.customer ?? {} }),
  });
  return parse<WalletRechargeResult>(response);
}
export async function activateFacilityPro(input: { token: string; facilityId: string; reference: string }): Promise<ApiResult<FacilityProActivationResult>> {
  const response = await fetchWithRecovery('/api/v2/wallet/pro', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}`, 'Idempotency-Key': input.reference },
    body: JSON.stringify({ facilityId: input.facilityId, reference: input.reference }),
  });
  return parse<FacilityProActivationResult>(response);
}
export async function getSellerAvailabilityQueue(input: { token: string }): Promise<ApiResult<SellerAvailabilityQueue>> {
  const response = await fetchWithRecovery('/api/v2/seller/availability-requests', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<SellerAvailabilityQueue>(response);
}

export async function createSellerFacility(input: { token: string; name: string; category?: string | null; description?: string | null; address?: string | null; latitude: number; longitude: number; idempotencyKey: string }): Promise<ApiResult<{ facilityId: string; slotId: string; trustState: 'verification_draft'; created: boolean }>> {
  const response = await fetchWithRecovery('/api/v2/seller/facilities', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}`, 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({ name: input.name, category: input.category ?? null, description: input.description ?? null, address: input.address ?? null, latitude: input.latitude, longitude: input.longitude }),
  });
  return parse(response);
}

export async function createSellerProductDraft(input: { token: string; facilityId: string; name: string; description?: string | null; unit?: string; prixOriginal: number; currency: string; pourcentageReduction: number; stockLoueOmni: number; idempotencyKey: string }): Promise<ApiResult<{ productId: string; facilityId: string; publicationState: 'draft'; prixReduit: number }>> {
  const response = await fetchWithRecovery('/api/v2/seller/catalogue', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}`, 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({ facilityId: input.facilityId, name: input.name, description: input.description ?? null, unit: input.unit ?? 'unit', prixOriginal: input.prixOriginal, currency: input.currency, pourcentageReduction: input.pourcentageReduction, stockLoueOmni: input.stockLoueOmni }),
  });
  return parse(response);
}

export async function updateSellerProductDraft(input: { token: string; productId: string; name: string; description?: string | null; unit?: string; prixOriginal: number; currency: string; pourcentageReduction: number; stockLoueOmni: number }): Promise<ApiResult<{ productId: string; publicationState: 'draft'; prixReduit: number }>> {
  const response = await fetchWithRecovery(`/api/v2/seller/catalogue/${input.productId}`, { method: 'PATCH', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` }, body: JSON.stringify({ name: input.name, description: input.description ?? null, unit: input.unit ?? 'unit', prixOriginal: input.prixOriginal, currency: input.currency, pourcentageReduction: input.pourcentageReduction, stockLoueOmni: input.stockLoueOmni }) });
  return parse(response);
}

export async function transitionSellerProduct(input: { token: string; productId: string; to: 'published' | 'archived' }): Promise<ApiResult<{ productId: string; publicationState: 'published' | 'archived' }>> {
  const response = await fetchWithRecovery(`/api/v2/seller/catalogue/${input.productId}`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` }, body: JSON.stringify({ to: input.to }) });
  return parse(response);
}

export async function setProductAvailability(input: { token: string; productId: string; to: import('./types').ProductAvailabilityState; expiresInHours: number | null }): Promise<ApiResult<{ productId: string; availabilityState: string; previousState: string | null }>> {
  const response = await fetchWithRecovery(`/api/v2/seller/catalogue/${input.productId}/availability`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` }, body: JSON.stringify({ to: input.to, expiresInHours: input.expiresInHours }) });
  return parse(response);
}

export async function getProductStockEvents(input: { token: string; productId: string }): Promise<ApiResult<{ authorized: boolean; events: import('./types').ProductStockEvent[] }>> {
  const response = await fetchWithRecovery(`/api/v2/seller/catalogue/${input.productId}/stock-events`, { headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` } });
  return parse(response);
}

export async function getSellerCatalogue(input: { token: string }): Promise<ApiResult<SellerCatalogueResult>> {
  const response = await fetchWithRecovery('/api/v2/seller/catalogue', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<SellerCatalogueResult>(response);
}

export async function rebindDemoSeller(input: { token: string }): Promise<ApiResult<{ authorized: true }>> {
  const response = await fetchWithRecovery('/api/v2/seller/demo-rebind', {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({}),
  });
  return parse<{ authorized: true }>(response);
}

export async function getTransaction(input: { transactionId: string; token: string }): Promise<ApiResult<import('./types').TransactionSnapshotResult>> {
  const response = await fetchWithRecovery(`/api/v2/transaction-transitions?action=snapshot&transactionId=${encodeURIComponent(input.transactionId)}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<import('./types').TransactionSnapshotResult>(response);
}

export async function createPurchaseIntent(input: { responseId: string; token: string; idempotencyKey: string }): Promise<ApiResult<PurchaseIntentResult>> {
  const response = await fetchWithRecovery('/api/v2/purchase-intents', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.token}`,
      'Idempotency-Key': input.idempotencyKey,
    },
    body: JSON.stringify({ responseId: input.responseId }),
  });
  return parse<PurchaseIntentResult>(response);
}

export async function issueBuyerQrToken(input: { transactionId: string; token: string }): Promise<ApiResult<QrTokenIssueResult>> {
  const response = await fetchWithRecovery('/api/v2/qr-issuances?actor=buyer', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ transactionId: input.transactionId }),
  });
  return parse<QrTokenIssueResult>(response);
}

/** @deprecated Seller-issued QR is retained only for the bounded legacy path. New flows must use issueBuyerQrToken. */
export async function issueQrToken(input: { transactionId: string; token: string }): Promise<ApiResult<QrTokenIssueResult>> {
  const response = await fetchWithRecovery('/api/v2/qr-issuances', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ transactionId: input.transactionId }),
  });
  return parse<QrTokenIssueResult>(response);
}

export async function verifyQrToken(input: { transactionId: string; tokenHash: string; token: string }): Promise<ApiResult<QrVerificationResult>> {
  const response = await fetchWithRecovery('/api/v2/qr-verifications', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ transactionId: input.transactionId, tokenHash: input.tokenHash }),
  });
  return parse<QrVerificationResult>(response);
}

export async function declareExternalPayment(input: { transactionId: string; method: ExternalPaymentMethod; token: string }): Promise<ApiResult<ExternalPaymentDeclarationResult>> {
  const response = await fetchWithRecovery('/api/v2/external-payment-declarations', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ transactionId: input.transactionId, method: input.method }),
  });
  return parse<ExternalPaymentDeclarationResult>(response);
}

export async function confirmExternalPayment(input: { transactionId: string; token: string }): Promise<ApiResult<ExternalPaymentConfirmationResult>> {
  const response = await fetchWithRecovery('/api/v2/external-payment-confirmations', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ transactionId: input.transactionId }),
  });
  return parse<ExternalPaymentConfirmationResult>(response);
}

export async function transitionTransaction(input: { transactionId: string; from: TransactionState; to: TransactionState; actorRole: 'buyer' | 'seller'; token: string }): Promise<ApiResult<TransactionTransitionResult>> {
  const response = await fetchWithRecovery('/api/v2/transaction-transitions', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ transactionId: input.transactionId, from: input.from, to: input.to, actorRole: input.actorRole }),
  });
  return parse<TransactionTransitionResult>(response);
}

export async function getTransactionMessages(input: { transactionId: string; token: string }): Promise<ApiResult<TransactionMessagesResult>> {
  const response = await fetchWithRecovery(`/api/v2/transaction-messages?transactionId=${encodeURIComponent(input.transactionId)}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<TransactionMessagesResult>(response);
}
export async function sendTransactionMessage(input: { transactionId: string; body: string; token: string }): Promise<ApiResult<TransactionMessagesResult['messages'][number]>> {
  const response = await fetchWithRecovery(`/api/v2/transaction-messages?transactionId=${encodeURIComponent(input.transactionId)}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ body: input.body }),
  });
  return parse<TransactionMessagesResult['messages'][number]>(response);
}
export async function submitTransactionRating(input: { transactionId: string; score: number; note: string; token: string }): Promise<ApiResult<TransactionRatingResult>> {
  const response = await fetchWithRecovery('/api/v2/transaction-ratings', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ transactionId: input.transactionId, score: input.score, note: input.note }),
  });
  return parse<TransactionRatingResult>(response);
}

export async function requestSellerAvailabilityResponse(input: {
  requestId: string;
  facilityId: string;
  productId: string;
  status: Extract<AvailabilityResponseStatus, 'available' | 'partial' | 'unavailable'>;
  quantityAvailable: number | null;
  priceMinor: number | null;
  sellerMessage: string | null;
  token: string;
  idempotencyKey: string;
}): Promise<ApiResult<{ responseId: string; requestId: string; facilityId: string; productId: string; status: AvailabilityResponseStatus; quantityAvailable: number | null; priceMinor: number | null; observedAt: string }>> {
  const response = await fetchWithRecovery('/api/v2/availability-responses', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.token}`,
      'Idempotency-Key': input.idempotencyKey,
    },
    body: JSON.stringify({
      requestId: input.requestId,
      facilityId: input.facilityId,
      productId: input.productId,
      status: input.status,
      quantityAvailable: input.quantityAvailable,
      priceMinor: input.priceMinor,
      sellerMessage: input.sellerMessage,
    }),
  });
  return parse(response);
}


export async function importPublicFacilityBatch(input: { token: string; items: Array<{ sourceRef: string; name: string; category?: string | null; address?: string | null; latitude: number; longitude: number }>; attribution: string }): Promise<ApiResult<{ imported: number; created: number; existing: number; results: PublicFacilityImportResult[] }>> {
  const response = await fetchWithRecovery('/api/v2/public/facilities?action=operator-import-batch', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ provider: 'openstreetmap', attribution: input.attribution, items: input.items }),
  });
  return parse(response);
}
export async function importPublicFacility(input: {
  provider: 'openstreetmap';
  attribution: string;
  sourceRef: string;
  name: string;
  category: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  token: string;
}): Promise<ApiResult<PublicFacilityImportResult>> {
  const response = await fetchWithRecovery('/api/v2/public/facilities?action=operator-import', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ provider: input.provider, attribution: input.attribution, sourceRef: input.sourceRef, name: input.name, category: input.category, latitude: input.latitude, longitude: input.longitude, address: input.address }),
  });
  return parse<PublicFacilityImportResult>(response);
}

export async function getOperatorRuns(input: { token: string }): Promise<ApiResult<OperatorRunsResult>> {
  const response = await fetchWithRecovery('/api/v2/public/facilities?operator=runs', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<OperatorRunsResult>(response);
}

export async function createFacilityClaimDraft(input: { facilityId: string; token: string }): Promise<ApiResult<ClaimDraftResult>> {
  const response = await fetchWithRecovery(`/api/v2/facilities/${encodeURIComponent(input.facilityId)}?action=claim`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({}),
  });
  return parse<ClaimDraftResult>(response);
}

export async function getClaimStorageStatus(input: { facilityId: string; token: string }): Promise<ApiResult<{ available: boolean }>> {
  const response = await fetchWithRecovery(`/api/v2/facilities/${encodeURIComponent(input.facilityId)}?action=claim-storage-status`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<{ available: boolean }>(response);
}

export async function uploadFacilityEvidence(input: { requestId: string; evidenceKind: EvidenceKind; file: File; token: string; onProgress?: (percentage: number) => void }): Promise<ClaimEvidenceItem> {
  const safeName = input.file.name.normalize('NFKC').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'evidence';
  const pathname = `claims/${input.requestId}/${input.evidenceKind}/${safeName}`;
  const blob = await uploadPrivateBlob(pathname, input.file, {
    access: 'private',
    contentType: input.file.type,
    multipart: input.file.size > 4 * 1024 * 1024,
    clientPayload: JSON.stringify({ evidenceKind: input.evidenceKind }),
    handleUploadUrl: `/api/v2/facilities/${encodeURIComponent(input.requestId)}?action=claim-upload`,
    headers: { Authorization: `Bearer ${input.token}` },
    onUploadProgress: (event) => input.onProgress?.(event.percentage),
  });
  return { evidenceKind: input.evidenceKind, objectKey: `private://omni/${blob.pathname}`, checksum: null };
}

export async function submitFacilityClaim(input: { requestId: string; version: number; evidence: ClaimEvidenceItem[]; token: string }): Promise<ApiResult<ClaimSubmitResult>> {
  const response = await fetchWithRecovery(`/api/v2/facilities/${encodeURIComponent(input.requestId)}?action=claim-submit`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ version: input.version, evidence: input.evidence }),
  });
  return parse<ClaimSubmitResult>(response);
}

export async function cancelFacilityClaim(input: { requestId: string; version: number; token: string }): Promise<ApiResult<{ requestId: string; facilityId: string; state: 'cancelled'; version: number }>> {
  const response = await fetchWithRecovery(`/api/v2/facilities/${encodeURIComponent(input.requestId)}?action=claim-cancel`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ version: input.version }),
  });
  return parse(response);
}

export async function getReviewQueue(input: { token: string }): Promise<ApiResult<ReviewQueueResult>> {
  const response = await fetchWithRecovery('/api/v2/public/facilities?reviewer=queue', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<ReviewQueueResult>(response);
}

export async function reviewFacilityClaim(input: { requestId: string; outcome: ReviewOutcome; reason: string; token: string }): Promise<ApiResult<ReviewClaimResult>> {
  const response = await fetchWithRecovery(`/api/v2/facilities/${encodeURIComponent(input.requestId)}?action=review`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ outcome: input.outcome, reason: input.reason }),
  });
  return parse<ReviewClaimResult>(response);
}

export async function getSellerActivationQueue(input: { token: string }): Promise<ApiResult<{ candidates: Array<{ accountId: string; authUserId: string; onboardingState: string; facilityCount: number; createdAt: string; suspended: boolean }> }>> {
  const response = await fetchWithRecovery('/api/v2/public/facilities?reviewer=seller-activations', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse(response);
}
export async function setSellerAccountSuspension(input: { accountId: string; suspended: boolean; reason: string; token: string }): Promise<ApiResult<{ accountId: string; suspended: boolean }>> {
  const response = await fetchWithRecovery(`/api/v2/facilities/${encodeURIComponent(input.accountId)}?action=reviewer-seller-suspension`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ suspended: input.suspended, reason: input.reason }),
  });
  return parse(response);
}
export async function activateSellerAccount(input: { accountId: string; token: string }): Promise<ApiResult<{ accountId: string; onboardingState: 'seller_ready'; activated: true }>> {
  const response = await fetchWithRecovery(`/api/v2/facilities/${encodeURIComponent(input.accountId)}?action=reviewer-seller-activation`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({}),
  });
  return parse(response);
}
export async function getNotificationInbox(input: { token: string }): Promise<ApiResult<NotificationInboxResult>> {
  const response = await fetchWithRecovery('/api/v2/public/facilities?inbox=1', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<NotificationInboxResult>(response);
}

export async function getWebPushStatus(input: { token: string }): Promise<ApiResult<{ active: number }>> {
  const response = await fetchWithRecovery('/api/v2/notifications/push?status=1', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<{ active: number }>(response);
}
export async function subscribeWebPush(input: { subscription: PushSubscriptionJSON; token: string }): Promise<ApiResult<{ subscriptionId: string; state: 'granted'; created: boolean }>> {
  const response = await fetchWithRecovery('/api/v2/notifications/push?action=subscribe', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ endpoint: input.subscription.endpoint, keys: input.subscription.keys, userAgent: navigator.userAgent }),
  });
  return parse<{ subscriptionId: string; state: 'granted'; created: boolean }>(response);
}
export async function revokeWebPush(input: { endpoint: string; token: string }): Promise<ApiResult<{ revoked: true; endpoint: string }>> {
  const response = await fetchWithRecovery('/api/v2/notifications/push?action=revoke', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ endpoint: input.endpoint }),
  });
  return parse<{ revoked: true; endpoint: string }>(response);
}
export async function markNotificationSeen(input: { notificationId: string; token: string }): Promise<ApiResult<{ notificationId: string; seen: true }>> {
  const response = await fetchWithRecovery(`/api/v2/facilities/${encodeURIComponent(input.notificationId)}?action=notification-seen`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({}),
  });
  return parse<{ notificationId: string; seen: true }>(response);
}
