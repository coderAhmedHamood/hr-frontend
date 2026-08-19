'use client';

import type { ReactNode } from 'react';
import { SystemOwnerGuard } from '@/features/system-owner/components/system-owner-guard';

export default function SystemOwnerLayout({ children }: { children: ReactNode }) {
  return (
    <SystemOwnerGuard>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </SystemOwnerGuard>
  );
}
