import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';

export type ViolationDeductionKindDto = 'none' | 'amount' | 'hours' | 'day';

export type ViolationTypeResponseDto = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  sortOrder: number;
  isActive: boolean;
  hasDeduction: boolean;
  deductionKind: ViolationDeductionKindDto | null;
  deductionValue: string | null;
  needsWarning: boolean;
  needsInvestigation: boolean;
  needsApproval: boolean;
  approvalTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateViolationTypeDto = {
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  hasDeduction?: boolean;
  deductionKind?: ViolationDeductionKindDto | null;
  deductionValue?: number | null;
  needsWarning?: boolean;
  needsInvestigation?: boolean;
  needsApproval?: boolean;
  approvalTemplateId?: string | null;
};

export type UpdateViolationTypeDto = Omit<Partial<CreateViolationTypeDto>, 'companyId'>;

export type ViolationTypeListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  isActive?: boolean;
  archiveScope?: OrganizationArchiveScope;
};
