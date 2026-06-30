export const JOB_TYPE_AR: Record<string, string> = {
  'full-time': 'دوام كامل',
  'part-time': 'دوام جزئي',
  contract: 'عقد',
  internship: 'تدريب',
};

export const ATS_JOB_TYPE_ORDER = ['all', 'full-time', 'part-time', 'contract', 'internship'] as const;
export type AtsJobTypeFilter = (typeof ATS_JOB_TYPE_ORDER)[number];

export const ATS_JOB_TYPE_LABELS: Record<AtsJobTypeFilter, string> = {
  all: 'كل الأنواع',
  'full-time': JOB_TYPE_AR['full-time'],
  'part-time': JOB_TYPE_AR['part-time'],
  contract: JOB_TYPE_AR.contract,
  internship: JOB_TYPE_AR.internship,
};

export const ATS_JOB_STATUS_ORDER = ['all', 'active', 'inactive'] as const;
export type AtsJobStatusFilter = (typeof ATS_JOB_STATUS_ORDER)[number];

export const ATS_JOB_STATUS_LABELS: Record<AtsJobStatusFilter, string> = {
  all: 'الكل',
  active: 'نشطة',
  inactive: 'متوقفة',
};
