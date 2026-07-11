'use client';

import { Smartphone } from 'lucide-react';
import { cn } from '@/shared/utils';
import { isMobilePermission } from '@/features/system/permissions/constants/permission-platforms';

type Props = {
  code: string;
  resource?: string | null;
  action?: string | null;
  className?: string;
};

export function PermissionPlatformIcons({ code, resource, action, className }: Props) {
  if (!isMobilePermission(code, resource, action)) return null;

  return (
    <span
      className={cn('inline-flex shrink-0 items-center', className)}
      title="مطلوبة على الجوال"
    >
      <Smartphone
        className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
        aria-label="الجوال"
      />
    </span>
  );
}

export function PermissionPlatformLegend() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <Smartphone className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
      مطلوبة على الجوال
    </span>
  );
}
