import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';

export type LeaveTypeResponseDto = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  paid: boolean;
  deductsFromBalance: boolean;
  requiresApproval: boolean;
  maxDaysPerRequest: number | null;
  sortOrder: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateLeaveTypeDto = {
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  paid?: boolean;
  deductsFromBalance?: boolean;
  requiresApproval?: boolean;
  maxDaysPerRequest?: number | null;
  sortOrder?: number;
  isActive?: boolean;
  notes?: string | null;
};

export type UpdateLeaveTypeDto = Omit<Partial<CreateLeaveTypeDto>, 'companyId'>;

export type LeaveTypeListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  isActive?: boolean;
  archiveScope?: OrganizationArchiveScope;
};
