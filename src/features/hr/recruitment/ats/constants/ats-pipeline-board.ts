import type { AtsPipelineStage } from '@/features/hr/recruitment/lib/ats/types';
import { ATS_STAGE_LABELS } from '@/features/hr/recruitment/lib/ats/stage-styles';
import { statusDotClass } from '@/shared/status-pill-classes';

export const ATS_PIPELINE_STAGE_ORDER: AtsPipelineStage[] = [
  'applied',
  'screening',
  'interview',
  'technical',
  'offer',
  'hired',
  'rejected',
];

export type AtsPipelineColumnStyle = {
  label: string;
  dot: string;
};

export const ATS_PIPELINE_COLUMN_STYLES: Record<AtsPipelineStage, AtsPipelineColumnStyle> = {
  applied: {
    label: ATS_STAGE_LABELS.applied,
    dot: statusDotClass('info'),
  },
  screening: {
    label: ATS_STAGE_LABELS.screening,
    dot: statusDotClass('calculated'),
  },
  interview: {
    label: ATS_STAGE_LABELS.interview,
    dot: statusDotClass('gold'),
  },
  technical: {
    label: ATS_STAGE_LABELS.technical,
    dot: statusDotClass('warning'),
  },
  offer: {
    label: ATS_STAGE_LABELS.offer,
    dot: statusDotClass('approved'),
  },
  hired: {
    label: ATS_STAGE_LABELS.hired,
    dot: statusDotClass('approved'),
  },
  rejected: {
    label: ATS_STAGE_LABELS.rejected,
    dot: statusDotClass('rejected'),
  },
};
