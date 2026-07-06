import type { CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';

export type CompanyRow = CompanyResponseDto;

export type CompanyDraftForm = {
  code: string;
  nameAr: string;
  nameEn: string;
  commercialRegistrationNo: string;
  taxNumber: string;
  isActive: boolean;
};

export const COMPANY_EMPTY_FORM: CompanyDraftForm = {
  code: '',
  nameAr: '',
  nameEn: '',
  commercialRegistrationNo: '',
  taxNumber: '',
  isActive: true,
};

export function companyToDraftForm(company: CompanyRow): CompanyDraftForm {
  return {
    code: company.code,
    nameAr: company.nameAr,
    nameEn: company.nameEn ?? '',
    commercialRegistrationNo: company.commercialRegistrationNo ?? '',
    taxNumber: company.taxNumber ?? '',
    isActive: company.isActive,
  };
}
