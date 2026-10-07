/**
 * Currencies a company may take as its base currency — the same list as the
 * backend (`GET /companies/currencies`), for names and symbols on screens.
 */
export type CurrencyDefinition = {
  code: string;
  nameAr: string;
  nameEn: string;
  symbolAr: string;
  decimals: number;
};

export const CURRENCIES: readonly CurrencyDefinition[] = [
  { code: 'YER', nameAr: 'ريال يمني', nameEn: 'Yemeni rial', symbolAr: 'ر.ي', decimals: 2 },
  { code: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi riyal', symbolAr: 'ر.س', decimals: 2 },
  { code: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US dollar', symbolAr: '$', decimals: 2 },
  { code: 'AED', nameAr: 'درهم إماراتي', nameEn: 'UAE dirham', symbolAr: 'د.إ', decimals: 2 },
  { code: 'OMR', nameAr: 'ريال عماني', nameEn: 'Omani rial', symbolAr: 'ر.ع', decimals: 3 },
  { code: 'KWD', nameAr: 'دينار كويتي', nameEn: 'Kuwaiti dinar', symbolAr: 'د.ك', decimals: 3 },
  { code: 'QAR', nameAr: 'ريال قطري', nameEn: 'Qatari riyal', symbolAr: 'ر.ق', decimals: 2 },
  { code: 'BHD', nameAr: 'دينار بحريني', nameEn: 'Bahraini dinar', symbolAr: 'د.ب', decimals: 3 },
  { code: 'EGP', nameAr: 'جنيه مصري', nameEn: 'Egyptian pound', symbolAr: 'ج.م', decimals: 2 },
  { code: 'JOD', nameAr: 'دينار أردني', nameEn: 'Jordanian dinar', symbolAr: 'د.أ', decimals: 3 },
  { code: 'EUR', nameAr: 'يورو', nameEn: 'Euro', symbolAr: '€', decimals: 2 },
];

export function currencyDefinition(code: string | null | undefined): CurrencyDefinition | null {
  const upper = (code ?? '').trim().toUpperCase();
  return CURRENCIES.find((c) => c.code === upper) ?? null;
}

/** «ريال يمني» for YER; the code itself when unknown. */
export function currencyNameAr(code: string | null | undefined): string {
  return currencyDefinition(code)?.nameAr ?? (code ?? '').toUpperCase();
}

/** «ر.ي» for YER; the code itself when unknown. */
export function currencySymbolAr(code: string | null | undefined): string {
  return currencyDefinition(code)?.symbolAr ?? (code ?? '').toUpperCase();
}
