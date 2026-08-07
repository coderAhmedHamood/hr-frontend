import type {
  PartnerAddress,
  PartnerAddressType,
} from '@/features/contacts/domain/types/partner';
import { PartnerAuthApiError } from '@/features/ecommerce/storefront/domain/partner-auth';
import {
  unwrapApiEnvelope,
  unwrapStoreList,
  type StorePaginated,
} from '@/features/ecommerce/storefront/lib/api/store-http';
import { resolveApiBaseUrl } from '@/shared/api-base-url';
import { publicConfig } from '@/shared/config';

/**
 * Storefront addresses via Contacts `/contacts/partner-addresses`
 * (same service/table as staff `/contacts/[id]`). Partner JWT is
 * self-scoped on the backend — body `partnerId` must match the token.
 */

export type { PartnerAddress, PartnerAddressType };

export type PartnerAddressInput = {
  partnerId: string;
  addressType?: PartnerAddressType;
  label?: string | null;
  isDefault?: boolean;
  countryCode?: string | null;
  state?: string | null;
  city?: string | null;
  district?: string | null;
  street?: string | null;
  building?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
};

function apiBaseUrl(): string {
  return resolveApiBaseUrl(publicConfig.apiUrl).replace(/\/$/, '');
}

async function parseError(response: Response): Promise<PartnerAuthApiError> {
  let message = 'Request failed';
  let code: string | undefined;
  try {
    const body = (await response.json()) as {
      message?: string | string[];
      code?: string;
      error?: { message?: string; code?: string };
    };
    if (Array.isArray(body.message)) message = body.message.join(' · ');
    else if (typeof body.message === 'string' && body.message.trim()) message = body.message;
    else if (typeof body.error?.message === 'string') message = body.error.message;
    code = body.code ?? body.error?.code;
  } catch {
    /* ignore */
  }
  return new PartnerAuthApiError(message, response.status, code);
}

async function addressesFetch<T>(
  path: string,
  init: RequestInit & { token: string },
): Promise<T> {
  if (!init.token) throw new PartnerAuthApiError('PARTNER_TOKEN_REQUIRED', 401);
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Bearer ${init.token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;

  const payload = (await response.json()) as unknown;
  const data = unwrapApiEnvelope<T>(payload);
  if (data == null) {
    throw new PartnerAuthApiError('Empty addresses response', response.status);
  }
  return data;
}

/** Same Contacts endpoint the staff partner detail page uses. */
const BASE = '/contacts/partner-addresses';

export async function listPartnerAddresses(
  token: string,
  query?: {
    partnerId?: string;
    companyId?: string;
    addressType?: PartnerAddressType;
    page?: number;
    limit?: number;
  },
): Promise<StorePaginated<PartnerAddress>> {
  const params = new URLSearchParams();
  params.set('page', String(query?.page ?? 1));
  params.set('limit', String(query?.limit ?? 100));
  params.set('archiveScope', 'active');
  if (query?.partnerId) params.set('partnerId', query.partnerId);
  if (query?.companyId) params.set('companyId', query.companyId);
  if (query?.addressType) params.set('addressType', query.addressType);

  const data = await addressesFetch<unknown>(`${BASE}?${params.toString()}`, {
    method: 'GET',
    token,
  });
  return unwrapStoreList<PartnerAddress>(data);
}

export async function createPartnerAddress(
  token: string,
  input: PartnerAddressInput,
): Promise<PartnerAddress> {
  return addressesFetch<PartnerAddress>(BASE, {
    method: 'POST',
    token,
    body: JSON.stringify({
      partnerId: input.partnerId,
      addressType: input.addressType ?? 'shipping',
      label: input.label?.trim() || null,
      isDefault: input.isDefault ?? false,
      countryCode: input.countryCode ?? 'YE',
      state: input.state ?? null,
      city: input.city?.trim() || null,
      district: input.district?.trim() || null,
      street: input.street?.trim() || null,
      building: input.building?.trim() || null,
      postalCode: input.postalCode ?? null,
      latitude: input.latitude ?? undefined,
      longitude: input.longitude ?? undefined,
      notes: input.notes?.trim() || null,
    }),
  });
}

export async function updatePartnerAddress(
  token: string,
  id: string,
  input: Omit<PartnerAddressInput, 'partnerId'> & { partnerId?: string },
): Promise<PartnerAddress> {
  return addressesFetch<PartnerAddress>(`${BASE}/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({
      ...(input.addressType !== undefined ? { addressType: input.addressType } : {}),
      ...(input.label !== undefined ? { label: input.label?.trim() || null } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      ...(input.countryCode !== undefined ? { countryCode: input.countryCode } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.city !== undefined ? { city: input.city?.trim() || null } : {}),
      ...(input.district !== undefined ? { district: input.district?.trim() || null } : {}),
      ...(input.street !== undefined ? { street: input.street?.trim() || null } : {}),
      ...(input.building !== undefined ? { building: input.building?.trim() || null } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
      ...(input.latitude !== undefined ? { latitude: input.latitude ?? undefined } : {}),
      ...(input.longitude !== undefined ? { longitude: input.longitude ?? undefined } : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
    }),
  });
}

export async function deletePartnerAddress(token: string, id: string): Promise<void> {
  await addressesFetch<void>(`${BASE}/${id}`, { method: 'DELETE', token });
}

export async function setDefaultPartnerAddress(
  token: string,
  id: string,
): Promise<PartnerAddress> {
  return updatePartnerAddress(token, id, { isDefault: true });
}

export function formatPartnerAddressLine(address: PartnerAddress): string {
  return [address.city, address.district, address.street, address.building]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' · ');
}
