import type { AtsPipelineStage } from '@/features/hr/recruitment/lib/ats/types';
import {
  filterTabTriggerClass,
  STATUS_PILL,
  statusDotClass,
  type FilterTabTone,
  type StatusPillTone,
} from '@/shared/status-pill-classes';

export type AtsStageTab = AtsPipelineStage | 'all';

export const ATS_STAGE_LABELS: Record<AtsStageTab, string> = {
  all: 'الكل',
  applied: 'تم التقديم',
  screening: 'الفرز',
  interview: 'المقابلة',
  technical: 'تقني',
  offer: 'العرض',
  hired: 'تم التعيين',
  rejected: 'مرفوض',
};

const ATS_STAGE_TAB_TONE: Record<AtsStageTab, FilterTabTone> = {
  all: 'muted',
  applied: 'primary',
  screening: 'accent',
  interview: 'gold',
  technical: 'warning',
  offer: 'success',
  hired: 'success',
  rejected: 'destructive',
};

const ATS_STAGE_DOT_TONE: Record<AtsStageTab, StatusPillTone> = {
  all: 'muted',
  applied: 'info',
  screening: 'calculated',
  interview: 'gold',
  technical: 'warning',
  offer: 'approved',
  hired: 'approved',
  rejected: 'rejected',
};

export const ATS_STAGE_BADGE: Record<AtsPipelineStage, string> = {
  applied: STATUS_PILL.info,
  screening: STATUS_PILL.calculated,
  interview: STATUS_PILL.gold,
  technical: STATUS_PILL.warning,
  offer: STATUS_PILL.approved,
  hired: STATUS_PILL.approved,
  rejected: STATUS_PILL.rejected,
};

export const ATS_STAGE_TABS = (Object.keys(ATS_STAGE_LABELS) as AtsStageTab[]).map((key) => ({
  key,
  label: ATS_STAGE_LABELS[key],
  pill: filterTabTriggerClass(ATS_STAGE_TAB_TONE[key]),
  dot: statusDotClass(ATS_STAGE_DOT_TONE[key]),
}));

export function scoreBarTone(score: number): { bar: string; text: string } {
  if (score >= 75) return { bar: 'bg-success', text: 'text-success' };
  if (score >= 50) return { bar: 'bg-gold', text: 'text-gold' };
  return { bar: 'bg-destructive', text: 'text-destructive' };
}
