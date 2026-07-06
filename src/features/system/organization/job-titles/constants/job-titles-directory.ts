export type JobTitleDraftForm = {
  companyId: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  isActive: boolean;
};

export const JOB_TITLE_EMPTY_FORM: JobTitleDraftForm = {
  companyId: '',
  titleAr: '',
  titleEn: '',
  descriptionAr: '',
  isActive: true,
};
