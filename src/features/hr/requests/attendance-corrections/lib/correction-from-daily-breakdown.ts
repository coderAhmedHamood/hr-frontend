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
  /** Recorded punches as ISO (kept for the request's audit snapshot). */
  recordedCheckInAt: string | null;
  recordedCheckOutAt: string | null;
  correctedCheckIn: string;
  correctedCheckOut: string;
  /** True when a required punch (check-in, or check-out when required) is missing. */
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

/**
 * Only a missing punch needs correcting — a late check-in or an early
 * check-out is a real punch, not an error.
 */
function periodNeedsCorrection(
  recorded: { checkInAt: string | null; checkOutAt: string | null },
  expected: DailyBreakdownPeriod['expected'],
): boolean {
  if (!recorded.checkInAt) return true;
  return !expected.checkOutNotRequired && !recorded.checkOutAt;
}

/**
 * Default request: keep every recorded punch and fill only the missing side
 * with the shift boundary. Replacing recorded punches is an explicit choice
 * in the form ("استبدال بأوقات الوردية").
 */
function defaultCorrectedIso(
  recorded: { checkInAt: string | null; checkOutAt: string | null },
  expected: DailyBreakdownPeriod['expected'],
): { checkInAt: string | null; checkOutAt: string | null } {
  return {
    checkInAt: recorded.checkInAt ?? expected.startAt,
    checkOutAt:
      recorded.checkOutAt ?? (expected.checkOutNotRequired ? null : expected.endAt),
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
  const corrected = defaultCorrectedIso(recorded, expected);

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
    recordedCheckInAt: recorded.checkInAt,
    recordedCheckOutAt: recorded.checkOutAt,
    correctedCheckIn: isoToTimePickerValue(corrected.checkInAt, offset),
    correctedCheckOut: isoToTimePickerValue(corrected.checkOutAt, offset),
    needsCorrection: periodNeedsCorrection(recorded, expected),
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

export type CorrectionPeriodPayload = {
  periodId: string;
  /** Punches as recorded when the request was made (audit / reviewer view). */
  recorded: { checkInAt: string | null; checkOutAt: string | null };
  /** Only the sides being changed; null keeps the recorded punch as it is. */
  corrected: { checkInAt: string | null; checkOutAt: string | null };
};

export function formPeriodToApiPunches(
  workDate: string,
  timezoneOffsetMinutes: number,
  period: CorrectionFormPeriod,
): CorrectionPeriodPayload {
  const side = (corrected: string, recorded: string) =>
    corrected && corrected !== recorded
      ? timePickerToIso(workDate, corrected, timezoneOffsetMinutes)
      : null;
  return {
    periodId: period.periodId,
    recorded: {
      checkInAt: period.recordedCheckInAt,
      checkOutAt: period.recordedCheckOutAt,
    },
    corrected: {
      checkInAt: side(period.correctedCheckIn, period.recordedCheckIn),
      checkOutAt: side(period.correctedCheckOut, period.recordedCheckOut),
    },
  };
}

