import type { CheckInWindowConfig, CheckOutWindowConfig, ShiftPeriod, ShiftTemplate, TemplateDayConfig, WeekDayIndex } from './types';

export function defaultCheckInWindow(): CheckInWindowConfig {
  return { beforeStartMinutes: 30, graceMinutes: 10, afterStartMinutes: 60 };
}

export function defaultCheckOutWindow(): CheckOutWindowConfig {
  return { beforeEndMinutes: 10, allowedShortageMinutes: 15, afterEndMinutes: 120 };
}

export function defaultShiftPeriod(id: string): ShiftPeriod {
  return {
    id,
    startTime: '09:00',
    endTime: '17:00',
    breakEnabled: false,
    breakStart: '12:00',
    breakEnd: '13:00',
    flexibilityEnabled: true,
    flexibilityMinutes: 15,
    checkIn: defaultCheckInWindow(),
    checkOut: defaultCheckOutWindow(),
    checkOutNotRequired: false,
    autoOvertime: false,
    strictMode: false,
    strictPenaltyWarning: false,
    strictPenaltyBalanceEnabled: false,
    strictPenaltyBalanceDays: 1,
  };
}

/** حقول قديمة في localStorage قبل إعادة التسمية */
type LegacyPeriodFields = {
  strictAbsenceDeductEnabled?: boolean;
  strictAbsenceDeductDays?: number;
  strictAbsenceWarningEnabled?: boolean;
  /** removed from backend — strip when normalizing legacy data */
  strictPenaltyVacationEnabled?: boolean;
  strictPenaltyVacationDays?: number;
};

/** يدمج الحقول الجديدة مع بيانات قديمة من التخزين المحلي */
export function normalizeShiftPeriod(p: ShiftPeriod): ShiftPeriod {
  const base = defaultShiftPeriod(p.id);
  const leg = p as ShiftPeriod & LegacyPeriodFields;
  const {
    strictAbsenceDeductEnabled: _legacyDeduct,
    strictAbsenceDeductDays: _legacyDeductDays,
    strictAbsenceWarningEnabled: _legacyWarning,
    strictPenaltyVacationEnabled: _legacyVacation,
    strictPenaltyVacationDays: _legacyVacationDays,
    ...rest
  } = leg;
  const balanceDays = Math.min(
    99,
    Math.max(1, Number(leg.strictPenaltyBalanceDays ?? leg.strictAbsenceDeductDays) || 1),
  );
  return {
    ...base,
    ...rest,
    checkIn: { ...base.checkIn, ...p.checkIn },
    checkOut: { ...base.checkOut, ...p.checkOut },
    strictMode: Boolean(p.strictMode),
    strictPenaltyWarning: Boolean(leg.strictPenaltyWarning ?? leg.strictAbsenceWarningEnabled),
    strictPenaltyBalanceEnabled: Boolean(leg.strictPenaltyBalanceEnabled ?? leg.strictAbsenceDeductEnabled),
    strictPenaltyBalanceDays: balanceDays,
  };
}

export function normalizeShiftTemplate(t: ShiftTemplate): ShiftTemplate {
  return {
    ...t,
    weekDays: t.weekDays.map((wd) => ({
      ...wd,
      periods: wd.periods.map(normalizeShiftPeriod),
    })),
  };
}

/** Saudi-style week starting Saturday: Fri–Sat rest, Sun–Thu work with one default period each. */
export function defaultWorkWeekPeriods(makePeriodId: (day: number, i: number) => string): TemplateDayConfig[] {
  const days: WeekDayIndex[] = [6, 0, 1, 2, 3, 4, 5];
  return days.map((day) => {
    if (day === 5 || day === 6) {
      return { day, isRest: true, periods: [] };
    }
    return {
      day,
      isRest: false,
      periods: [defaultShiftPeriod(makePeriodId(day, 0))],
    };
  });
}
