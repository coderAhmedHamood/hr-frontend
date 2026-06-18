'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MinimalDropdown } from '@/features/hr/requests/components/shared-ui';
import { cn } from '@/shared/utils';

export const DISCIPLINE_PAGE_SIZE_OPTIONS = [30, 60, 90, 120, 150] as const;
export const DEFAULT_DISCIPLINE_PAGE_SIZE = 30;
export const DEFAULT_PAGE_SIZE = DEFAULT_DISCIPLINE_PAGE_SIZE;

const PAGE_SIZE_DROPDOWN_OPTIONS = DISCIPLINE_PAGE_SIZE_OPTIONS.map((n) => ({
  value: String(n),
  label: `${n}`,
}));

export interface StickyPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: readonly number[];
  className?: string;
}

function buildPageRange(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | '…')[] = [1];
  if (page > 3) pages.push('…');
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    if (!pages.includes(i)) pages.push(i);
  }
  if (page < totalPages - 2) pages.push('…');
  if (!pages.includes(totalPages)) pages.push(totalPages);
  return pages;
}

export function StickyPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DISCIPLINE_PAGE_SIZE_OPTIONS,
  className,
}: StickyPaginationProps) {
  const pages = React.useMemo(() => buildPageRange(page, totalPages), [page, totalPages]);

  const dropdownOptions = React.useMemo(
    () =>
      pageSizeOptions.map((n) => ({
        value: String(n),
        label: `${n}`,
      })),
    [pageSizeOptions],
  );

  if (total === 0) return null;

  return (
    <div
      role="navigation"
      aria-label="التصفح بين الصفحات"
      className={cn(
        'flex shrink-0 items-center justify-center gap-3 rounded-xl border border-border/70 bg-card/95 px-3 py-1.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80',
        className,
      )}
    >
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-lg border-border/70"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-0.5 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              type="button"
              variant={p === page ? 'default' : 'ghost'}
              size="icon"
              className={cn(
                'h-7 min-w-7 rounded-lg px-1.5 text-xs tabular-nums',
                p === page && 'bg-primary text-primary-foreground shadow-sm',
              )}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-lg border-border/70"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="الصفحة التالية"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
      </div>

      <MinimalDropdown
        value={String(pageSize)}
        onChange={(v) => onPageSizeChange(Number(v))}
        options={dropdownOptions.length > 0 ? dropdownOptions : PAGE_SIZE_DROPDOWN_OPTIONS}
        hideSelectedCheck
        className="h-7 w-[3.6rem] gap-1 rounded-lg border-border/70 bg-muted/20 px-2 text-[11px] shadow-none"
        contentClassName="min-w-0 p-0.5"
        optionClassName="px-2 py-1.5 text-[11px]"
      />
    </div>
  );
}
