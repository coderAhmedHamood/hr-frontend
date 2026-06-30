'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  buildPdfCompanyLetterhead,
  type PdfCompanyLetterhead,
  type PdfCompanySource,
} from '@/components/pdf/lib/pdf-company-info';

export function usePdfCompanyLetterhead(): PdfCompanyLetterhead {
  const { data: company } = useActiveCompany();
  const defaultCompanyId = useDefaultCompanyId();
  const sessionCompany = useAuthStore((s) =>
    defaultCompanyId
      ? s.accessProfile?.companies.find((c) => c.companyId === defaultCompanyId)
      : undefined,
  );

  return useMemo(() => {
    if (company) {
      return buildPdfCompanyLetterhead({
        nameAr: company.nameAr,
        nameEn: company.nameEn,
        commercialRegistrationNo: company.commercialRegistrationNo,
        logoUrl: company.logoUrl,
      });
    }

    if (sessionCompany) {
      return buildPdfCompanyLetterhead({
        nameAr: sessionCompany.companyNameAr,
        nameEn: sessionCompany.companyNameEn,
        commercialRegistrationNo: sessionCompany.companyCommercialRegistrationNo,
        logoUrl: sessionCompany.companyLogoUrl,
      });
    }

    return buildPdfCompanyLetterhead(null);
  }, [company, sessionCompany]);
}

export type PdfLetterheadOverrides = Partial<PdfCompanyLetterhead> & {
  companyNameAr?: string;
  companyNameEn?: string;
};

export function useResolvedPdfLetterhead(overrides?: PdfLetterheadOverrides): PdfCompanyLetterhead {
  const defaults = usePdfCompanyLetterhead();

  return useMemo(() => ({
    companyNameAr: overrides?.companyNameAr?.trim() || defaults.companyNameAr,
    companyNameEn: overrides?.companyNameEn?.trim() || defaults.companyNameEn,
    commercialReg: overrides?.commercialReg?.trim() || defaults.commercialReg,
    logoSrc: overrides?.logoSrc ?? defaults.logoSrc,
  }), [defaults, overrides]);
}

export function companyDtoToPdfSource(company: PdfCompanySource | null | undefined): PdfCompanySource {
  return {
    nameAr: company?.nameAr,
    nameEn: company?.nameEn,
    commercialRegistrationNo: company?.commercialRegistrationNo,
    logoUrl: company?.logoUrl,
  };
}
