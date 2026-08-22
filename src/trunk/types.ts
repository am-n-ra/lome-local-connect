export type PublicTrust = 'unclaimed' | 'certified' | 'unconfirmed' | 'confirmed';

export interface SearchOptions {
  category: string;
}

export interface PublicFacility {
  id: string;
  name: string;
  category: string;
  address: string | null;
  latitude: number;
  longitude: number;
  trust: PublicTrust;
  plan: 'free' | 'pro_active' | 'pro_expired';
  productCount: number;
}

export interface PublicProduct {
  id: string;
  facilityId: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  priceMinor: number;
  currency: string;
  couponLabel: string | null;
}

export interface FacilityDetail extends PublicFacility {
  products: PublicProduct[];
}

export interface AvailabilityResult {
  requestId: string;
  productId: string;
  facilityId: string;
  status: 'submitted' | 'responding' | 'available' | 'partial' | 'unavailable';
  expiresAt: string;
  message: string;
}

export interface ApiFailure {
  code: string;
  message: string;
  retryable: boolean;
}

export interface ApiResult<T> {
  ok: boolean;
  correlationId: string;
  data?: T;
  error?: ApiFailure;
}
