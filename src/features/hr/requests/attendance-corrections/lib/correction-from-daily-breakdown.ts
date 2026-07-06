import type {
  AttendanceEventResponseDto,
  DailyBreakdownPeriod,
  DailyBreakdownResponseDto,
} from '@/features/hr/attendance/types/api/attendance-events';
import {
  formatShiftRangeAr,
  isoToTimePickerValue,
  timePickerToIso,
} from '@/features/hr/requests/attendance-corrections/lib/correction-period-time';

export type CorrectionFormPeriod = {
  periodId: string;
  labelAr: string;
  expectedRangeAr: string;
  shiftCheckIn: string;
  shiftCheckOut: string;
  checkOutOptional: boolean;
  recordedCheckIn: string;
  recordedCheckOut: string;
  correctedCheckIn: string;
  correctedCheckOut: string;
  /** True when recorded punches differ from shift boundaries or a required punch is missing. */
  needsCorrection: boolean;
};

function punchAt(
  events: AttendanceEventResponseDto[],
  type: 'check_in' | 'check_out',
  last: boolean,
): string | null {
  const list = events
    .filter((e) => !e.isVoided && e.eventType === type)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  return (last ? list[list.length - 1] : list[0])?.occurredAt ?? null;
}

function resolvePeriodRecorded(
  period: DailyBreakdownPeriod,
  breakdown: DailyBreakdownResponseDto,
): { checkInAt: string | null; checkOutAt: string | null } {
  const singlePeriod = breakdown.periods.length === 1;
  let checkInAt = period.actual.checkInAt ?? punchAt(period.events, 'check_in', false);
  let checkOutAt = period.actual.checkOutAt ?? punchAt(period.events, 'check_out', true);

  if (singlePeriod) {
    if (!checkInAt) checkInAt = punchAt(breakdown.unmatchedEvents, 'check_in', false);
    if (!checkOutAt) checkOutAt = punchAt(breakdown.unmatchedEvents, 'check_out', true);
  }

  return { checkInAt, checkOutAt };
}

function sameWallClockMinute(
  a: string | null | undefined,
  b: string | null | undefined,
  offset: number,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return isoToTimePickerValue(a, offset) === isoToTimePickerValue(b, offset);
}

function periodNeedsCorrection(
  recorded: { checkInAt: string | null; checkOutAt: string | null },
  expected: DailyBreakdownPeriod['expected'],
  offset: number,
): boolean {
  if (!recorded.checkInAt) return true;
  if (!expected.checkOutNotRequired && !recorded.checkOutAt) return true;
  if (!sameWallClockMinute(recorded.checkInAt, expected.startAt, offset)) return true;
  if (
    !expected.checkOutNotRequired &&
    !sameWallClockMinute(recorded.checkOutAt, expected.endAt, offset)
  ) {
    return true;
  }
  return false;
}

/** Corrected punches always follow shift boundaries from daily breakdown. */
function shiftCorrectedIso(
  expected: DailyBreakdownPeriod['expected'],
): { checkInAt: string | null; checkOutAt: string | null } {
  return {
    checkInAt: expected.startAt,
    checkOutAt: expected.checkOutNotRequired ? null : expected.endAt,
  };
}

export function buildCorrectionFormPeriod(
  period: DailyBreakdownPeriod,
  breakdown: DailyBreakdownResponseDto,
  periodIndex: number,
): CorrectionFormPeriod {
  const offset = breakdown.timezoneOffsetMinutes;
  const multi = breakdown.periods.length > 1;
  const recorded = resolvePeriodRecorded(period, breakdown);
  const { expected } = period;
  const corrected = shiftCorrectedIso(expected);

  return {
    periodId: expected.periodId,
    labelAr: multi ? `وردية ${periodIndex + 1}` : 'الوردية',
    expectedRangeAr: formatShiftRangeAr(expected.startTime, expected.endTime),
    shiftCheckIn: isoToTimePickerValue(expected.startAt, offset),
    shiftCheckOut: isoToTimePickerValue(
      expected.checkOutNotRequired ? null : expected.endAt,
      offset,
    ),
    checkOutOptional: expected.checkOutNotRequired,
    recordedCheckIn: isoToTimePickerValue(recorded.checkInAt, offset),
    recordedCheckOut: isoToTimePickerValue(recorded.checkOutAt, offset),
    correctedCheckIn: isoToTimePickerValue(corrected.checkInAt, offset),
    correctedCheckOut: isoToTimePickerValue(corrected.checkOutAt, offset),
    needsCorrection: periodNeedsCorrection(recorded, expected, offset),
  };
}

export function buildCorrectionFormPeriodsFromBreakdown(
  breakdown: DailyBreakdownResponseDto,
  onlyPeriodIndex?: number,
  options?: { includeAll?: boolean },
): CorrectionFormPeriod[] {
  const indices =
    onlyPeriodIndex != null
      ? [onlyPeriodIndex]
      : breakdown.periods.map((_, index) => index);

  const periods = indices
    .filter((index) => breakdown.periods[index])
    .map((index) => buildCorrectionFormPeriod(breakdown.periods[index]!, breakdown, index));

  if (onlyPeriodIndex != null) return periods;
  if (options?.includeAll) return periods;
  return periods.filter((p) => p.needsCorrection);
}

export function formPeriodToApiPunches(
  workDate: string,
  timezoneOffsetMinutes: number,
  period: CorrectionFormPeriod,
): {
  periodId: string;
  checkInAt: string | null;
  checkOutAt: string | null;
} {
  return {
    periodId: period.periodId,
    checkInAt: timePickerToIso(workDate, period.correctedCheckIn, timezoneOffsetMinutes),
    checkOutAt: timePickerToIso(workDate, period.correctedCheckOut, timezoneOffsetMinutes),
  };
}

