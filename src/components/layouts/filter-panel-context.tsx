'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

/* ── Types ────────────────────────────────────────────────────────────── */
export type FilterFieldType = 'text' | 'select' | 'multiselect' | 'daterange';

export interface FilterOption { label: string; value: string }

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  options?: FilterOption[];
  placeholder?: string;
}

export type FilterValues = Record<string, string | string[]>;

/* ── Context ──────────────────────────────────────────────────────────── */
interface Ctx {
  open: boolean;
  setOpen(v: boolean): void;
  fields: FilterField[];
  setFields(f: FilterField[]): void;
  values: FilterValues;
  setValue(key: string, val: string | string[]): void;
  reset(): void;
  activeCount: number;
}

const noop = () => {};
export const FilterPanelContext = React.createContext<Ctx>({
  open: false, setOpen: noop,
  fields: [], setFields: noop,
  values: {}, setValue: noop,
  reset: noop, activeCount: 0,
});

export function FilterPanelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [fields, setFields] = React.useState<FilterField[]>([]);
  const [values, setValues] = React.useState<FilterValues>({});

  // Reset filter values on navigation (fields are owned by `usePageFilters` per page).
  React.useEffect(() => {
    setValues({});
    setOpen(false);
  }, [pathname]);

  const setValue = React.useCallback((key: string, val: string | string[]) => {
    setValues(prev => {
      const current = prev[key];
      if (Array.isArray(val) && Array.isArray(current)) {
        if (val.length === current.length && val.every((v, i) => v === current[i])) return prev;
      } else if (current === val) {
        return prev;
      }
      return { ...prev, [key]: val };
    });
  }, []);

  const reset = React.useCallback(() => setValues({}), []);

  const activeCount = Object.entries(values).filter(([, v]) =>
    Array.isArray(v) ? v.length > 0 : v && v !== 'all' && v !== '',
  ).length;

  return (
    <FilterPanelContext value={{ open, setOpen, fields, setFields, values, setValue, reset, activeCount }}>
      {children}
    </FilterPanelContext>
  );
}

export function useFilterPanel() {
  return React.useContext(FilterPanelContext);
}

/** Register page-level filters; cleans up on unmount / route change */
export function usePageFilters(config: FilterField[]) {
  const pathname = usePathname();
  const { setFields, values, setValue, reset } = useFilterPanel();
  const configRef = React.useRef(config);
  configRef.current = config;
  React.useLayoutEffect(() => {
    setFields(configRef.current);
    return () => setFields([]);
  }, [pathname, setFields]);
  return { values, setValue, reset };
}
