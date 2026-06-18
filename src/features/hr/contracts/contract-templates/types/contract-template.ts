/** مطابق لـ backend ContractNature enum */
export type ContractNature = 'indefinite' | 'fixed_term' | 'project_based';

/** مطابق لـ backend WorkArrangement enum */
export type WorkArrangement = 'full_time' | 'part_time' | 'remote' | 'hybrid';

export type ContractTemplateAllowanceLine = {
  id: string;
  allowanceTypeId: string;
  allowanceTypeCode: string;
  allowanceTypeNameAr: string;
  amount: string;
  sortOrder: number;
};

export type ContractTemplateArticleRef = {
  id: string;
  articleId: string;
  articleCode: string;
  articleTitleAr: string;
  articleTitleEn: string | null;
  isBasic: boolean;
  sortOrder: number;
};

export type ContractTemplateDto = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  defaultContractNature: ContractNature;
  defaultWorkArrangement: WorkArrangement;
  defaultProbationDays: number | null;
  defaultAnnualLeaveDays: number | null;
  suggestedBaseSalary: string;
  currency: string;
  durationMonths: number | null;
  allowancesHint: string | null;
  sortOrder: number;
  isActive: boolean;
  allowanceLines: ContractTemplateAllowanceLine[];
  articles: ContractTemplateArticleRef[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type AllowanceLineInput = {
  allowanceTypeId: string;
  amount: number;
  sortOrder?: number;
};

export type CreateContractTemplateDto = {
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  defaultContractNature: ContractNature;
  defaultWorkArrangement: WorkArrangement;
  defaultProbationDays?: number | null;
  defaultAnnualLeaveDays?: number | null;
  suggestedBaseSalary?: number;
  currency?: string;
  durationMonths?: number | null;
  allowancesHint?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  allowanceLines?: AllowanceLineInput[];
  articleIds?: string[];
  createdBy?: string | null;
};

export type UpdateContractTemplateDto = Partial<
  Omit<CreateContractTemplateDto, 'companyId' | 'createdBy'>
> & {
  updatedBy?: string | null;
};
