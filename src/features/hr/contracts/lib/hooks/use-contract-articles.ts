import { useQuery } from '@tanstack/react-query';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { payrollListArchiveQuery } from '@/features/hr/organization/lib/archive-scope';
import { contractArticlesApi, type ApiContractArticle } from '../contracts-api';
import type { HRContractArticle } from '../contract-articles-store';

function mapApiArticle(a: ApiContractArticle): HRContractArticle {
  return {
    id: a.id,
    code: a.code,
    title: a.titleAr,
    body: (a.bodyAr ?? '').replace(/\r\n/g, '\n'),
    isBasic: a.isBasic,
    isActive: a.isActive,
    updatedAt: a.updatedAt,
  };
}

export const contractArticleKeys = {
  all: ['contract-articles'] as const,
  byCompany: (companyId: string) => ['contract-articles', companyId] as const,
};

export function useContractArticles() {
  const companyId = getDefaultCompanyId() ?? '';
  return useQuery({
    queryKey: contractArticleKeys.byCompany(companyId),
    queryFn: async () => {
      const result = await contractArticlesApi.list({ companyId, limit: 200, ...payrollListArchiveQuery() });
      return result.items.map(mapApiArticle);
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
