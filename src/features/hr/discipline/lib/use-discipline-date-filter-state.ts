'use client';

import * as React from 'react';
import {
  DEFAULT_DATE_FILTER_META,
  EMPTY_PERIOD_RANGE,
  type DateFilterTab,
} from '@/features/hr/discipline/lib/discipline-date-filter';

export type DisciplineDateFilterMeta = { tab: DateFilterTab; hasRestriction: boolean };

export function useDisciplineDateFilterState() {
  const [dateBounds, setDateBounds] = React.useState<{ from: string; to: string }>(() => ({
    ...EMPTY_PERIOD_RANGE,
  }));
  const [dateMeta, setDateMeta] = React.useState<DisciplineDateFilterMeta>(() => ({
    ...DEFAULT_DATE_FILTER_META,
  }));

  const onDateBoundsChange = React.useCallback((bounds: { from: string; to: string }) => {
    setDateBounds(bounds);
  }, []);

  const onDateFilterMetaChange = React.useCallback((meta: DisciplineDateFilterMeta) => {
    setDateMeta(meta);
  }, []);

  return {
    dateBounds,
    setDateBounds,
    dateMeta,
    setDateMeta,
    onDateBoundsChange,
    onDateFilterMetaChange,
  };
}
