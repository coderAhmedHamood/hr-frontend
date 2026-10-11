import type { CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';
import type { PrintCompany } from '@/features/print-templates/domain/types';

export function toPrintCompany(company: CompanyResponseDto | null | undefined): PrintCompany {
  if (!company) return { nameAr: 'اسم الشركة' };
  return {
    nameAr: company.nameAr,
    nameEn: company.nameEn,
    logoUrl: company.logoUrl,
    taxNumber: company.taxNumber,
    commercialRegistrationNo: company.commercialRegistrationNo,
    phone: company.phone || company.mobile,
    email: company.email,
    website: company.website,
    address: company.address,
    city: company.city,
    country: company.country,
    primaryColor: company.primaryColor,
    secondaryColor: company.secondaryColor,
  };
}
