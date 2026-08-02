'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companiesApi, type UpdateCompanyDto } from '@/features/hr/organization/lib/api/companies';

const QUERY_KEY = ['ecommerce-cms', 'company-colors'] as const;

type WebsiteBrandingPatch = Pick<
  UpdateCompanyDto,
  | 'storefrontPrimaryColor'
  | 'storefrontSecondaryColor'
  | 'storefrontBodyFont'
  | 'storefrontDisplayFont'
  | 'storefrontBodyFontUrl'
  | 'storefrontDisplayFontUrl'
>;

/**
 * Storefront-only theme colors + fonts — persisted on Company storefront* fields.
 * Distinct from dashboard primaryColor/secondaryColor. Saving here never touches
 * the admin dashboard theme.
 */
export function useWebsiteThemeColors(companyId: string) {
  const queryClient = useQueryClient();

  const { data: company, isLoading, isError, refetch } = useQuery({
    queryKey: [...QUERY_KEY, companyId],
    queryFn: () => companiesApi.getById(companyId),
    enabled: Boolean(companyId),
  });

  const update = useMutation({
    mutationFn: (patch: WebsiteBrandingPatch) => companiesApi.update(companyId, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData([...QUERY_KEY, companyId], updated);
    },
  });

  return { company, isLoading, isError, refetch, update };
}
