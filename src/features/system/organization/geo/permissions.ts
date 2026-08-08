import { SYSTEM_ORGANIZATION_PERMISSIONS } from '@/features/auth/permissions/codes';
import type { PagePermissionDefs } from '@/features/auth/permissions/types';

export const GEO_COUNTRIES_PERMISSIONS = {
  ...SYSTEM_ORGANIZATION_PERMISSIONS.geoCountries,
} as const satisfies PagePermissionDefs;

export const GEO_CITIES_PERMISSIONS = {
  ...SYSTEM_ORGANIZATION_PERMISSIONS.geoCities,
} as const satisfies PagePermissionDefs;

export const GEO_DISTRICTS_PERMISSIONS = {
  ...SYSTEM_ORGANIZATION_PERMISSIONS.geoDistricts,
} as const satisfies PagePermissionDefs;

/** Page gate — any geo read permission unlocks the locations screen. */
export const GEO_PAGE_PERMISSIONS = GEO_COUNTRIES_PERMISSIONS;
