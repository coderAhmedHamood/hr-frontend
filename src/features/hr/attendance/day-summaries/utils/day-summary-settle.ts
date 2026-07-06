import type {
  DaySummaryResponseDto,
  SettleDaySummaryDto,
} from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { getDaySummaryMetricMinutes } from '@/features/hr/attendance/day-summaries/utils/day-summary-display';

export type DaySummarySettlePlan = {
  shortageMinutes: number;
  outsidePeriodMinutes: number;
  overtimeMinutes: number;
  settleablePoolMinutes: number;
  transferMinutes: number;
  after: {
    shortageMinutes: number;
    outsidePeriodMinutes: number;
    overtimeMinutes: number;
  };
};

export function getDaySummaryShortageMinutes(row: DaySummaryResponseDto): number {
  return getDaySummaryMetricMinutes(row, 'shortage');
}

export function getDaySummaryOutsidePeriodMinutes(row: DaySummaryResponseDto): number {
  return getDaySummaryMetricMinutes(row, 'outsidePeriods');
}

export function getDaySummarySettleablePoolMinutes(row: DaySummaryResponseDto): number {
  return (
    getDaySummaryOutsidePeriodMinutes(row) +
    getDaySummaryMetricMinutes(row, 'overtime')
  );
}

/** Net shortage against overtime pool (outside + overtime). */
export function computeDaySummarySettlePlan(row: DaySummaryResponseDto): DaySummarySettlePlan {
  const shortageMinutes = getDaySummaryShortageMinutes(row);
  const outsidePeriodMinutes = getDaySummaryOutsidePeriodMinutes(row);
  const overtimeMinutes = getDaySummaryMetricMinutes(row, 'overtime');
  const settleablePoolMinutes = outsidePeriodMinutes + overtimeMinutes;

  const transferMinutes = Math.min(shortageMinutes, settleablePoolMinutes);
  let remaining = transferMinutes;
  const fromOutside = Math.min(remaining, outsidePeriodMinutes);
  remaining -= fromOutside;
  const fromOvertime = remaining;

  return {
    shortageMinutes,
    outsidePeriodMinutes,
    overtimeMinutes,
    settleablePoolMinutes,
    transferMinutes,
    after: {
      shortageMinutes: shortageMinutes - transferMinutes,
      outsidePeriodMinutes: outsidePeriodMinutes - fromOutside,
      overtimeMinutes: Math.max(0, overtimeMinutes - fromOvertime),
    },
  };
}

export function canSettleDaySummary(row: DaySummaryResponseDto): boolean {
  if (typeof row.canSettle === 'boolean') {
    return row.canSettle;
  }
  const plan = computeDaySummarySettlePlan(row);
  return (
    plan.transferMinutes > 0 &&
    plan.shortageMinutes > 0 &&
    plan.settleablePoolMinutes > 0 &&
    !row.isSettled &&
    !row.isFinalized
  );
}

export function buildSettleDaySummaryPayload(
  updatedBy?: string | null,
): SettleDaySummaryDto {
  return updatedBy ? { updatedBy } : {};
}
