'use client';

import * as React from 'react';
import {
  DayPicker,
  getDefaultClassNames,
} from 'react-day-picker';
import { arSA } from 'date-fns/locale';

import { cn } from '@/shared/utils';

export const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
] as const;

function formatMonthCaption(month: Date): string {
  return `${AR_MONTHS[month.getMonth()]} ${month.getFullYear()}`;
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const DATE_FORMATTERS: NonNullable<CalendarProps['formatters']> = {
  formatDay: (date) => String(date.getDate()),
  formatCaption: (month) => formatMonthCaption(month),
  formatMonthDropdown: (month) => AR_MONTHS[month.getMonth()],
  formatYearDropdown: (yearDate) => String(yearDate.getFullYear()),
  formatWeekNumber: (weekNumber) => (weekNumber < 10 ? `0${weekNumber}` : `${weekNumber}`),
};

function Calendar({
  className,
  classNames,
  locale = arSA,
  showOutsideDays = true,
  formatters,
  weekStartsOn = 6,
  ...props
}: CalendarProps & { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      locale={locale}
      weekStartsOn={weekStartsOn}
      showOutsideDays={showOutsideDays}
      formatters={{ ...DATE_FORMATTERS, ...formatters }}
      className={cn('p-2', className)}
      classNames={{
        ...defaults,
        weekday: cn(defaults.weekday, 'text-[10px] font-semibold tracking-wide text-muted-foreground'),
        day_button: cn(
          defaults.day_button,
          'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors',
        ),
        outside: cn(defaults.outside, 'text-muted-foreground/35'),
        ...classNames,
      }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
