'use client';

import * as React from 'react';
import {
  DayPicker,
  getDefaultClassNames,
  formatWeekNumber,
} from 'react-day-picker';
import { arSA } from 'date-fns/locale';

import { cn } from '@/shared/utils';

function formatMonthCaption(month: Date): string {
  const y = month.getFullYear();
  const m = String(month.getMonth() + 1).padStart(2, '0');
  return `${y}/${m}`;
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const NUMERIC_DATE_FORMATTERS: NonNullable<CalendarProps['formatters']> = {
  formatDay: (date) => String(date.getDate()),
  formatCaption: (month) => formatMonthCaption(month),
  formatMonthDropdown: (month) => formatMonthCaption(month),
  formatYearDropdown: (year) => String(year),
  formatWeekNumber: (weekNumber) => (weekNumber < 10 ? `0${weekNumber}` : `${weekNumber}`),
};

function Calendar({ className, classNames, locale = arSA, showOutsideDays = true, formatters, weekStartsOn = 6, ...props }: CalendarProps & { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      locale={locale}
      weekStartsOn={weekStartsOn}
      showOutsideDays={showOutsideDays}
      formatters={{ ...NUMERIC_DATE_FORMATTERS, ...formatters }}
      className={cn('p-2', className)}
      classNames={{ ...defaults, ...classNames }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
