/**
 * The company's base country as the store uses it (company settings →
 * "الدولة الأساسية"; backend core/countries/country-profiles). The storefront
 * gets it in its config (`settings.country`); this default is Yemen — what the
 * store did before base countries existed — for an older backend or before the
 * config loads.
 */
export type StoreCountry = {
  code: string;
  nameAr: string;
  nameEn: string;
  currencyCode: string;
  /** Dialling code without "+". */
  phoneCode: string;
  /** Map picker region. */
  mapRegion: string;
  /** Digits of a mobile after the dialling code (absent from an older backend). */
  mobileLength?: number;
  /** First digits of a mobile after the dialling code. */
  mobilePrefixes?: string[];
  /** A mobile in local form, shown as a hint. */
  mobileExample?: string;
};

export const DEFAULT_STORE_COUNTRY: StoreCountry = {
  code: 'YE',
  nameAr: 'اليمن',
  nameEn: 'Yemen',
  currencyCode: 'YER',
  phoneCode: '967',
  mapRegion: 'YE',
  mobileLength: 9,
  mobilePrefixes: ['7'],
  mobileExample: '771234567',
};
