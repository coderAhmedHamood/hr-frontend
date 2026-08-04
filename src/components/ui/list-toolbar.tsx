import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Input } from '@/components/ui/input';

interface ListToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function ListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
  className,
}: ListToolbarProps) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 ps-9"
          />
        </div>
        {filters}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
