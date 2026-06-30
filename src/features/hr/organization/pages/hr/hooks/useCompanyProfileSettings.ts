'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patchDefaultCompanyBrandingInSession } from '@/features/auth/hooks/use-default-company-branding';
import { companiesApi, type UpdateCompanyDto } from '@/features/hr/organization/lib/api/companies';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';

export function useCompanyProfileSettings() {
  const queryClient = useQueryClient();
  const { data: company, isLoading, isError, error, refetch } = useActiveCompany();
  const companyId = company?.id ?? null;

  const update = useMutation({
    mutationFn: (dto: UpdateCompanyDto) => {
      if (!companyId) throw new Error('لم يتم تحديد الشركة');
      return companiesApi.update(companyId, dto);
    },
    onSuccess: (data) => {
      if (companyId) {
        queryClient.setQueryData(['company', companyId], data);
        patchDefaultCompanyBrandingInSession(companyId, {
          companyLogoUrl: data.logoUrl,
          companyPrimaryColor: data.primaryColor,
          companySecondaryColor: data.secondaryColor,
          companyNameAr: data.nameAr,
          companyNameEn: data.nameEn,
          companyCommercialRegistrationNo: data.commercialRegistrationNo,
        });
      }
    },
  });

  return {
    company,
    companyId,
    isLoading,
    isError,
    error,
    refetch,
    update,
  };
}
