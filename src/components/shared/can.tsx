'use client';

import { ReactNode } from 'react';
import { useCan } from '@/features/auth/hooks/use-can';

type CanProps = {
  children: ReactNode;
  fallback?: ReactNode;
} & (
  | { when: boolean; permission?: never }
  | { permission: string; when?: never }
);

/** Renders children when the user has access (`when`) or a permission code. */
export function Can({ when, permission, fallback = null, children }: CanProps) {
  const can = useCan();
  const allowed = when !== undefined ? when : can(permission);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
