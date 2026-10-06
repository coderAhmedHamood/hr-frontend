import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type CompanyResponseDto = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  commercialRegistrationNo: string | null;
  taxNumber: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  country: string | null;
  /** Base country (ISO code): its profile drives the store (currency, phone code, map). */
  baseCountryCode: string;
  city: string | null;
  district: string | null;
  address: string | null;
  postalCode: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  storefrontPrimaryColor: string | null;
  storefrontSecondaryColor: string | null;
  storefrontBodyFont: string | null;
  storefrontDisplayFont: string | null;
  storefrontBodyFontUrl: string | null;
  storefrontDisplayFontUrl: string | null;
  timezone: string;
  currencyCode: string;
  languageCode: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateCompanyDto = {
  code: string;
  nameAr: string;
  nameEn?: string | null;
  commercialRegistrationNo?: string | null;
  taxNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  country?: string | null;
  baseCountryCode?: string;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  postalCode?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  storefrontPrimaryColor?: string | null;
  storefrontSecondaryColor?: string | null;
  storefrontBodyFont?: string | null;
  storefrontDisplayFont?: string | null;
  storefrontBodyFontUrl?: string | null;
  storefrontDisplayFontUrl?: string | null;
  timezone?: string;
  currencyCode?: string;
  languageCode?: string;
  isActive?: boolean;
  notes?: string | null;
};

export type UpdateCompanyDto = Partial<CreateCompanyDto>;

export type CompanyListQuery = {
  page?: number;
  limit?: number;
};

/** What a base country decides (backend core/countries/country-profiles). */
export type CountryProfile = {
  code: string;
  nameAr: string;
  nameEn: string;
  currencyCode: string;
  phoneCode: string;
  mapRegion: string;
};

export const companiesApi = {
  countryProfiles() {
    return apiRequest<CountryProfile[]>('/companies/country-profiles');
  },
  getAll(query?: CompanyListQuery) {
    return apiRequest<PaginatedResult<CompanyResponseDto>>('/companies', { query });
  },
  getById(id: string) {
    return apiRequest<CompanyResponseDto>(`/companies/${id}`);
  },
  create(payload: CreateCompanyDto) {
    return apiRequest<CompanyResponseDto>('/companies', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateCompanyDto) {
    return apiRequest<CompanyResponseDto>(`/companies/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/companies/${id}`, { method: 'DELETE' });
  },
};
