'use client';

import { DatePickerInput, type DatePickerInputProps } from '@/components/ui/date-picker-input';

const HOLIDAY_REF_YEAR = 2000;

function monthDayToYmd(mmdd: string): string {
  if (!/^\d{2}-\d{2}$/.test(mmdd.trim())) return '';
  return `${HOLIDAY_REF_YEAR}-${mmdd}`;
}

function ymdToMonthDay(ymd: string): string {
  const [, month, day] = ymd.split('-');
  if (!month || !day) return '';
  return `${month}-${day}`;
}

type MonthDayPickerInputProps = Omit<DatePickerInputProps, 'value' | 'onChange' | 'minDate' | 'maxDate'> & {
  /** Month-day value as MM-DD */
  value: string;
  onChange: (mmdd: string) => void;
};

export function MonthDayPickerInput({ value, onChange, ...props }: MonthDayPickerInputProps) {
  return (
    <DatePickerInput
      value={monthDayToYmd(value)}
      onChange={(ymd) => onChange(ymdToMonthDay(ymd))}
      minDate={`${HOLIDAY_REF_YEAR}-01-01`}
      maxDate={`${HOLIDAY_REF_YEAR}-12-31`}
      {...props}
    />
  );
}
