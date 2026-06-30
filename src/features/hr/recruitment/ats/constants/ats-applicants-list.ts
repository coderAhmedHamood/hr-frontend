import { ATS_STAGE_LABELS, type AtsStageTab } from '@/features/hr/recruitment/lib/ats/stage-styles';

export const ATS_APPLICANT_STAGE_ORDER = [
  'applied',
  'screening',
  'interview',
  'technical',
  'offer',
  'hired',
  'rejected',
] as const;

export type AtsApplicantStageFilter = AtsStageTab;

export const ATS_APPLICANT_STAGE_LABELS: Record<AtsApplicantStageFilter, string> = ATS_STAGE_LABELS;
