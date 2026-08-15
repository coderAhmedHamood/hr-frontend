export const STORE_COUNTRY_UNAVAILABLE_ERROR = 'COUNTRY_UNAVAILABLE';

/** Backend: `Selected country is not available for this store` */
export function isStoreCountryUnavailable(message: string | null | undefined): boolean {
  return /country is not available for this store/i.test(message ?? '');
}
