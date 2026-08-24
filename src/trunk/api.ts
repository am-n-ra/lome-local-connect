import type { ApiResult, AvailabilityResponseStatus, AvailabilityResponsesResult, AvailabilityResult, BuyerAvailabilityRequestList, ClaimDraftResult, FacilityDetail, OperatorRunsResult, PublicFacility, PublicFacilityImportResult, SearchOptions, SellerAvailabilityQueue } from './types';

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

export async function listPublicFacilities(bounds?: [number, number, number, number], query?: string, options?: SearchOptions): Promise<ApiResult<PublicFacility[]>> {
  const params = new URLSearchParams();
  if (bounds) ['west', 'south', 'east', 'north'].forEach((key, index) => params.set(key, String(bounds[index])));
  if (query?.trim()) params.set('q', query.trim());
  if (options?.category) params.set('category', options.category);
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

export async function getSellerAvailabilityQueue(input: { token: string }): Promise<ApiResult<SellerAvailabilityQueue>> {
  const response = await fetchWithRecovery('/api/v2/seller/availability-requests', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<SellerAvailabilityQueue>(response);
}

export async function rebindDemoSeller(input: { token: string }): Promise<ApiResult<{ authorized: true }>> {
  const response = await fetchWithRecovery('/api/v2/seller/demo-rebind', {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({}),
  });
  return parse<{ authorized: true }>(response);
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
  const response = await fetchWithRecovery('/api/v2/operator/public-imports', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ provider: input.provider, attribution: input.attribution, sourceRef: input.sourceRef, name: input.name, category: input.category, latitude: input.latitude, longitude: input.longitude, address: input.address }),
  });
  return parse<PublicFacilityImportResult>(response);
}

export async function getOperatorRuns(input: { token: string }): Promise<ApiResult<OperatorRunsResult>> {
  const response = await fetchWithRecovery('/api/v2/operator/runs', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${input.token}` },
  });
  return parse<OperatorRunsResult>(response);
}

export async function createFacilityClaimDraft(input: { facilityId: string; token: string }): Promise<ApiResult<ClaimDraftResult>> {
  const response = await fetchWithRecovery(`/api/v2/facilities/${encodeURIComponent(input.facilityId)}/claims`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({}),
  });
  return parse<ClaimDraftResult>(response);
}
