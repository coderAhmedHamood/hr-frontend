'use client';

import type { ReactNode } from 'react';
import { EmptyState } from '@/components/ui/shared-dialogs';
import { ForbiddenState } from '@/components/shared/forbidden-state';

type DirectoryPageGateProps = {
  /** Client-side or API 403 on the main page load. */
  accessDenied?: boolean;
  listError?: string | null;
  loading?: boolean;
  forbiddenTitle?: string;
  loadErrorTitle?: string;
  children: ReactNode;
};

/**
 * Early gate for directory/list pages: ForbiddenState for missing page permission,
 * EmptyState for other load failures, loading spinner, then page content.
 */
export function DirectoryPageGate({
  accessDenied = false,
  listError = null,
  loading = false,
  forbiddenTitle,
  loadErrorTitle = 'تعذر التحميل',
  children,
}: DirectoryPageGateProps) {
  if (accessDenied) {
    return <ForbiddenState title={forbiddenTitle} />;
  }
  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">جاري التحميل…</div>
    );
  }
  if (listError) {
    return <EmptyState title={loadErrorTitle} description={listError} />;
  }
  return <>{children}</>;
}
