'use client';

import { Link2, Loader2 } from 'lucide-react';
import { SearchableDropdown } from '@/components/ui/shared-dialogs';
import { cn } from '@/shared/utils';

type Props = {
  options: Array<{ value: string; label: string; sub?: string }>;
  loading?: boolean;
  linking?: boolean;
  disabled?: boolean;
  onSelect: (userId: string) => void;
  className?: string;
};

export function EmployeeLinkUserDropdown({
  options,
  loading,
  linking,
  disabled,
  onSelect,
  className,
}: Props) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="relative min-w-[12rem] max-w-[18rem] flex-1">
        <SearchableDropdown
          value=""
          onChange={onSelect}
          options={options}
          placeholder={loading ? 'جاري تحميل المستخدمين…' : `ربط مستخدم موجود… (${options.length})`}
          disabled={disabled || loading || linking || options.length === 0}
          listClassName="max-h-[min(70vh,28rem)]"
          contentClassName="min-w-[min(100vw-2rem,20rem)]"
          className="w-full"
        />
        {linking ? (
          <Loader2 className="pointer-events-none absolute end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-primary" />
        ) : null}
      </div>
    </div>
  );
}
