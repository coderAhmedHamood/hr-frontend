import type {
  DaySummaryResponseDto,
  SettleDaySummaryDto,
} from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { getDaySummaryMetricMinutes } from '@/features/hr/attendance/day-summaries/utils/day-summary-display';

export type DaySummarySettlePlan = {
  expectedMinutes: number;
  totalMinutes: number;
  overtimeMinutes: number;
  shortageMinutes: number;
  transferMinutes: number;
  after: {
    totalMinutes: number;
    overtimeMinutes: number;
    shortageMinutes: number;
  };
};

export function getDaySummaryShortageMinutes(row: DaySummaryResponseDto): number {
  const fromTotals = row.dailyTotals?.minutes?.shortage;
  if (typeof fromTotals === 'number' && Number.isFinite(fromTotals)) {
    return fromTotals;
  }
  if (typeof row.shortageMinutes === 'number' && Number.isFinite(row.shortageMinutes)) {
    return row.shortageMinutes;
  }
  const expected = getDaySummaryMetricMinutes(row, 'expected');
  const total = getDaySummaryMetricMinutes(row, 'total');
  return Math.max(0, expected - total);
}

/** Transfer from overtime to actual until actual reaches expected (partial if overtime is insufficient). */
export function computeDaySummarySettlePlan(row: DaySummaryResponseDto): DaySummarySettlePlan {
  const expectedMinutes = getDaySummaryMetricMinutes(row, 'expected');
  const totalMinutes = getDaySummaryMetricMinutes(row, 'total');
  const overtimeMinutes = getDaySummaryMetricMinutes(row, 'overtime');
  const shortageMinutes = getDaySummaryShortageMinutes(row);

  const gapToExpected = Math.max(0, expectedMinutes - totalMinutes);
  const transferMinutes = Math.min(overtimeMinutes, gapToExpected);
  const afterTotal = totalMinutes + transferMinutes;

  return {
    expectedMinutes,
    totalMinutes,
    overtimeMinutes,
    shortageMinutes,
    transferMinutes,
    after: {
      totalMinutes: afterTotal,
      overtimeMinutes: overtimeMinutes - transferMinutes,
      shortageMinutes: Math.max(0, expectedMinutes - afterTotal),
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
    plan.totalMinutes < plan.expectedMinutes &&
    plan.overtimeMinutes > 0 &&
    !row.isSettled &&
    !row.isFinalized
  );
}

export function buildSettleDaySummaryPayload(
  updatedBy?: string | null,
): SettleDaySummaryDto {
  return updatedBy ? { updatedBy } : {};
}
