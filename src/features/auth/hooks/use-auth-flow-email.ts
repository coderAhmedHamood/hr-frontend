'use client';

import * as React from 'react';
import type { UseFormReset } from 'react-hook-form';

export function normalizeAuthFlowEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isLikelyAuthFlowEmail(raw: string): boolean {
  const value = normalizeAuthFlowEmail(raw);
  return value.includes('@') && value.length >= 3;
}

export function readAuthFlowEmailFromParams(searchParams: URLSearchParams | null): string {
  if (!searchParams) return '';
  const email = searchParams.get('email')?.trim() ?? '';
  return isLikelyAuthFlowEmail(email) ? normalizeAuthFlowEmail(email) : '';
}

export function buildAuthFlowHref(path: string, email?: string | null): string {
  const normalized = email ? normalizeAuthFlowEmail(email) : '';
  if (!isLikelyAuthFlowEmail(normalized)) return path;
  return `${path}?${new URLSearchParams({ email: normalized }).toString()}`;
}

/** Prefills an auth email field from `?email=` when navigating from login or sibling flows. */
export function useAuthFlowEmailPrefill<T extends { email: string }>(
  reset: UseFormReset<T>,
) {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefilled = readAuthFlowEmailFromParams(new URLSearchParams(window.location.search));
    if (prefilled) {
      reset({ email: prefilled } as T);
    }
  }, [reset]);
}
