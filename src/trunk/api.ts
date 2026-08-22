import type { SearchOptions, ApiResult, AvailabilityResult, FacilityDetail, PublicFacility } from './types';

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
