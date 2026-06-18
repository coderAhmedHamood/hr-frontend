import { create } from 'zustand';
import { contractTemplatesApi } from '@/features/hr/contracts/contract-templates/lib/api/contract-templates';
import type { ContractTemplateDto as ApiContractTemplate } from '@/features/hr/contracts/contract-templates/types/contract-template';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import type { HRContractNature, HRWorkArrangement } from './contracts-store';

export type HRContractTemplateRecord = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  defaultContractNature: HRContractNature;
  defaultWorkArrangement: HRWorkArrangement;
  defaultProbationDays: number | null;
  defaultAnnualLeaveDays: number;
  suggestedBaseSalary: number;
  currency: string;
  durationMonths: number | null;
  allowanceLines: { allowanceTypeId: string; amount: number; sortOrder: number }[];
  articleIds: string[];
  allowancesHint: string;
  sortOrder: number;
  isActive: boolean;
};

function mapApiTemplate(t: ApiContractTemplate): HRContractTemplateRecord {
  return {
    id: t.id,
    code: t.code,
    nameAr: t.nameAr,
    nameEn: t.nameEn ?? '',
    descriptionAr: t.descriptionAr ?? '',
    defaultContractNature: t.defaultContractNature as HRContractNature,
    defaultWorkArrangement: t.defaultWorkArrangement as HRWorkArrangement,
    defaultProbationDays: t.defaultProbationDays ?? null,
    defaultAnnualLeaveDays: t.defaultAnnualLeaveDays ?? 21,
    suggestedBaseSalary: Number(t.suggestedBaseSalary) || 0,
    currency: t.currency,
    durationMonths: t.durationMonths ?? null,
    allowanceLines: (t.allowanceLines ?? []).map(l => ({
      allowanceTypeId: l.allowanceTypeId,
      amount: Number(l.amount) || 0,
      sortOrder: l.sortOrder,
    })),
    articleIds: (t.articles ?? []).map((a) => a.articleId),
    allowancesHint: t.allowancesHint ?? '',
    sortOrder: t.sortOrder,
    isActive: t.isActive,
  };
}

interface State {
  templates: HRContractTemplateRecord[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useHRContractTemplatesStore = create<State>()((set) => ({
  templates: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await contractTemplatesApi.list({ companyId, limit: 200 });
      set({ templates: result.items.map(mapApiTemplate), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },
}));
