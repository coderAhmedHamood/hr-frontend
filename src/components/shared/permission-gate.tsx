'use client';

import { ReactNode } from 'react';
import { useCan } from '@/features/auth/hooks/use-can';

interface Props {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({ permission, fallback = null, children }: Props) {
  const can = useCan();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}
