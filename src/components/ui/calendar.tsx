'use client';

import * as React from 'react';
import {
  DayPicker,
  getDefaultClassNames,
  formatCaption,
  formatMonthDropdown,
  formatWeekNumber,
  formatYearDropdown,
} from 'react-day-picker';
import { arSA } from 'date-fns/locale';

import { cn, toWesternDigits } from '@/shared/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const LATIN_NUMERAL_FORMATTERS: NonNullable<CalendarProps['formatters']> = {
  formatDay: (date) => String(date.getDate()),
  formatCaption: (month, options, dateLib) =>
    toWesternDigits(formatCaption(month, options, dateLib)),
  formatMonthDropdown: (month, dateLib) =>
    toWesternDigits(formatMonthDropdown(month, dateLib)),
  formatYearDropdown: (year, dateLib) =>
    toWesternDigits(formatYearDropdown(year, dateLib)),
  formatWeekNumber: (weekNumber) => (weekNumber < 10 ? `0${weekNumber}` : `${weekNumber}`),
};

function Calendar({ className, classNames, locale = arSA, showOutsideDays = true, formatters, weekStartsOn = 6, ...props }: CalendarProps & { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      locale={locale}
      weekStartsOn={weekStartsOn}
      showOutsideDays={showOutsideDays}
      formatters={{ ...LATIN_NUMERAL_FORMATTERS, ...formatters }}
      className={cn('p-2', className)}
      classNames={{ ...defaults, ...classNames }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
