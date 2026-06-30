export type RequestTypeApprovalStage = {
  order: number;
  nameAr: string;
  nameEn?: string;
  approverKind: 'manager' | 'hr' | 'specific';
  approverIds?: string[];
  isRequired?: boolean;
  meta?: Record<string, unknown>;
};

export type RequestTypeSubtype = {
  slug: string;
  nameAr: string;
  nameEn?: string;
  sortOrder?: number;
  isActive?: boolean;
  meta?: Record<string, unknown>;
};

export type ApiRequestType = {
  id: string;
  companyId: string;
  departmentId: string | null;
  slug: string;
  nameAr: string;
  nameEn: string;
  requestCategory: string;
  approvalAssignmentTemplateId: string | null;
  approvalStages: RequestTypeApprovalStage[];
  subtypes: RequestTypeSubtype[];
  sortOrder: number;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type CreateRequestTypeDto = {
  companyId: string;
  departmentId?: string | null;
  slug?: string;
  nameAr: string;
  nameEn?: string;
  requestCategory?: string;
  approvalAssignmentTemplateId?: string | null;
  approvalStages?: RequestTypeApprovalStage[];
  subtypes?: RequestTypeSubtype[];
  sortOrder?: number;
  isActive?: boolean;
  notes?: string;
  createdBy?: string;
};

export type UpdateRequestTypeDto = Partial<Omit<CreateRequestTypeDto, 'companyId' | 'createdBy'>> & {
  updatedBy?: string;
};
