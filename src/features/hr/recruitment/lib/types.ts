export type RecruitmentFormFieldType = 'text' | 'number' | 'select' | 'file';

export interface RecruitmentFormField {
  id: string;
  type: RecruitmentFormFieldType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface RecruitmentForm {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  fields: RecruitmentFormField[];
  createdAt: string;
}

export interface RecruitmentApplicant {
  id: string;
  formId: string;
  answers: Record<string, string | number | boolean | undefined>;
  cvFileName?: string;
  cvFileData?: string;
  submittedAt: string;
}
