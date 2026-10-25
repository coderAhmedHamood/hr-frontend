import type { CompanyResponseDto, UpdateCompanyDto } from '@/features/hr/organization/lib/api/companies';

export type CompanySettingsFormState = {
  nameAr: string;
  nameEn: string;
  commercialRegistrationNo: string;
  taxNumber: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  country: string;
  baseCountryCode: string;
  /** Base currency (العملة الأساسية); sent only when changed. */
  currencyCode: string;
  city: string;
  district: string;
  address: string;
  postalCode: string;
  logoUrl: string;
  stampUrl: string;
  representativeTitleAr: string;
  representativeNameAr: string;
  timezone: string;
  primaryColor: string;
  secondaryColor: string;
  pdfWatermarkEnabled: boolean;
  pdfWatermarkOpacity: number;
};

/** Visibility levels of the logo background on printed pages (percent). */
export const PDF_WATERMARK_LEVELS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 4, label: 'باهتة جدًا' },
  { value: 7, label: 'خفيفة' },
  { value: 10, label: 'متوسطة' },
  { value: 15, label: 'واضحة' },
  { value: 22, label: 'قوية' },
  { value: 30, label: 'قوية جدًا' },
];

export function companyToSettingsForm(company: CompanyResponseDto): CompanySettingsFormState {
  return {
    nameAr: company.nameAr,
    nameEn: company.nameEn ?? '',
    commercialRegistrationNo: company.commercialRegistrationNo ?? '',
    taxNumber: company.taxNumber ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
    mobile: company.mobile ?? '',
    website: company.website ?? '',
    country: company.country ?? '',
    baseCountryCode: company.baseCountryCode || 'YE',
    currencyCode: company.currencyCode,
    city: company.city ?? '',
    district: company.district ?? '',
    address: company.address ?? '',
    postalCode: company.postalCode ?? '',
    logoUrl: company.logoUrl ?? '',
    stampUrl: company.stampUrl ?? '',
    representativeTitleAr: company.representativeTitleAr ?? '',
    representativeNameAr: company.representativeNameAr ?? '',
    timezone: company.timezone || 'Asia/Riyadh',
    primaryColor: company.primaryColor ?? '',
    secondaryColor: company.secondaryColor ?? '',
    pdfWatermarkEnabled: company.pdfWatermarkEnabled ?? true,
    pdfWatermarkOpacity: company.pdfWatermarkOpacity ?? 10,
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value.trim());
}

export function settingsFormToUpdateDto(
  form: CompanySettingsFormState,
  company?: { currencyCode: string },
): UpdateCompanyDto {
  return {
    // The base currency changes through its own guard: sent only when changed.
    ...(company && form.currencyCode !== company.currencyCode ? { currencyCode: form.currencyCode } : {}),
    nameAr: form.nameAr.trim(),
    nameEn: emptyToNull(form.nameEn),
    commercialRegistrationNo: emptyToNull(form.commercialRegistrationNo),
    taxNumber: emptyToNull(form.taxNumber),
    email: emptyToNull(form.email),
    phone: emptyToNull(form.phone),
    mobile: emptyToNull(form.mobile),
    website: emptyToNull(form.website),
    country: emptyToNull(form.country),
    baseCountryCode: form.baseCountryCode,
    city: emptyToNull(form.city),
    district: emptyToNull(form.district),
    address: emptyToNull(form.address),
    postalCode: emptyToNull(form.postalCode),
    logoUrl: emptyToNull(form.logoUrl),
    stampUrl: emptyToNull(form.stampUrl),
    representativeTitleAr: emptyToNull(form.representativeTitleAr),
    representativeNameAr: emptyToNull(form.representativeNameAr),
    timezone: form.timezone.trim() || 'Asia/Riyadh',
    primaryColor: emptyToNull(form.primaryColor),
    secondaryColor: emptyToNull(form.secondaryColor),
    pdfWatermarkEnabled: form.pdfWatermarkEnabled,
    pdfWatermarkOpacity: form.pdfWatermarkOpacity,
  };
}
