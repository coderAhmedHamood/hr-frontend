'use client';

import * as React from 'react';
import {
  attendanceEventsApi,
  type NextEventTypeResponseDto,
} from '@/features/hr/attendance/lib/api/attendance-events';

function localTimezoneOffsetMinutes() {
  return -new Date().getTimezoneOffset();
}

export function useNextEventType(params: {
  employeeId: string | null | undefined;
  companyId: string;
  workDate: string;
  enabled?: boolean;
}) {
  const { employeeId, companyId, workDate, enabled = true } = params;
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<NextEventTypeResponseDto | null>(null);

  React.useEffect(() => {
    if (!enabled || !employeeId || !companyId || !workDate) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void attendanceEventsApi
      .getNextEventType({
        employeeId,
        companyId,
        workDate,
        timezoneOffsetMinutes: localTimezoneOffsetMinutes(),
      })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId, companyId, workDate, enabled]);

  const nextEventType =
    data?.nextEventType === 'check_out' ? ('check_out' as const) : ('check_in' as const);

  return { loading, data, nextEventType, message: data?.message ?? null };
}
