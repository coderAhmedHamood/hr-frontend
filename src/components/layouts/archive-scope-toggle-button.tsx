'use client';

import * as React from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';

export function ArchiveScopeToggleButton({
  scope,
  onScopeChange,
  className,
}: {
  scope: OrganizationArchiveScope;
  onScopeChange: (scope: OrganizationArchiveScope) => void;
  className?: string;
}) {
  const isArchivedView = scope === 'archived';

  return (
    <button
      type="button"
      onClick={() => onScopeChange(isArchivedView ? 'active' : 'archived')}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
        isArchivedView
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200'
          : 'border-border bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground',
        className,
      )}
      title={isArchivedView ? 'العودة إلى القائمة الحالية' : 'عرض البيانات المؤرشفة'}
    >
      {isArchivedView ? (
        <ArchiveRestore className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Archive className="h-3.5 w-3.5 shrink-0" />
      )}
      {isArchivedView ? 'القائمة الحالية' : 'المؤرشف'}
    </button>
  );
}
