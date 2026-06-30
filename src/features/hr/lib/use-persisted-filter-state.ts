'use client';

import * as React from 'react';

export function readPersistedJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writePersistedJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode errors
  }
}

export function hrFiltersKey(
  section: string,
  page: string,
  companyId: string | null | undefined,
  field: string,
): string | null {
  if (!companyId) return null;
  return `hr-filters:${section}:${page}:${companyId}:${field}`;
}

export function attendanceFiltersKey(
  page: 'daily' | 'day-summaries' | 'events',
  companyId: string | null | undefined,
  field: string,
): string | null {
  return hrFiltersKey('attendance', page, companyId, field);
}

export function usePersistedFilterState<T>(
  key: string | null,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const defaultRef = React.useRef(defaultValue);
  defaultRef.current = defaultValue;

  const [value, setValue] = React.useState<T>(() => {
    if (!key) return defaultValue;
    return readPersistedJson<T>(key) ?? defaultValue;
  });

  React.useEffect(() => {
    if (!key) return;
    const stored = readPersistedJson<T>(key);
    setValue(stored ?? defaultRef.current);
  }, [key]);

  React.useEffect(() => {
    if (!key) return;
    writePersistedJson(key, value);
  }, [key, value]);

  return [value, setValue];
}

export function usePersistedEmpIdSet(
  key: string | null,
): [Set<string>, React.Dispatch<React.SetStateAction<Set<string>>>] {
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(() => {
    if (!key) return new Set();
    const stored = readPersistedJson<string[]>(key);
    return new Set(stored ?? []);
  });

  React.useEffect(() => {
    if (!key) return;
    const stored = readPersistedJson<string[]>(key);
    setSelectedEmpIds(new Set(stored ?? []));
  }, [key]);

  React.useEffect(() => {
    if (!key) return;
    writePersistedJson(key, [...selectedEmpIds]);
  }, [key, selectedEmpIds]);

  return [selectedEmpIds, setSelectedEmpIds];
}
