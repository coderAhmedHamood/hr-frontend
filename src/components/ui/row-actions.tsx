'use client';

import * as React from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/shared/utils';

export type RowPrimaryAction = {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'success' | 'destructive' | 'default' | 'warning' | 'primary';
  icon?: React.ReactNode;
  disabled?: boolean;
};

export type RowMenuItem = {
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  separator?: boolean;
};

interface RowActionsProps {
  /** Always-visible buttons (e.g. approve / reject). Only rendered when array is non-empty. */
  primaryActions?: RowPrimaryAction[];
  /** Items shown in the 3-dots dropdown. */
  menuItems: RowMenuItem[];
  className?: string;
}

const PRIMARY_VARIANT_CLASS: Record<NonNullable<RowPrimaryAction['variant']>, string> = {
  success: 'border-success/40 bg-success/10 text-success hover:bg-success/20',
  destructive: 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20',
  default: 'border-border bg-muted/60 text-foreground hover:bg-muted',
  warning: 'border-warning/40 bg-warning/10 text-warning hover:bg-warning/20',
  primary: 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20',
};

export function RowActions({ primaryActions, menuItems, className }: RowActionsProps) {
  const hasPrimary = primaryActions && primaryActions.length > 0;

  return (
    <div className={cn('flex items-center justify-end gap-1', className)} onClick={(e) => e.stopPropagation()}>
      {hasPrimary && primaryActions.map((action, i) => (
        <button
          key={i}
          type="button"
          disabled={action.disabled}
          onClick={(e) => { e.stopPropagation(); action.onClick(e); }}
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors disabled:opacity-50',
            PRIMARY_VARIANT_CLASS[action.variant ?? 'default'],
          )}
        >
          {action.icon}
          {action.label}
        </button>
      ))}

      {menuItems.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground data-[state=open]:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">الإجراءات</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {menuItems.map((item, i) => (
              <React.Fragment key={i}>
                {item.separator && i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  className={cn(
                    'gap-2 text-sm',
                    item.destructive && 'text-destructive focus:text-destructive focus:bg-destructive/10',
                  )}
                  onClick={(e) => { e.stopPropagation(); item.onClick?.(e); }}
                  asChild={!!item.href}
                >
                  {item.href ? (
                    <a href={item.href} onClick={(e) => e.stopPropagation()}>
                      {item.icon}
                      {item.label}
                    </a>
                  ) : (
                    <>
                      {item.icon}
                      {item.label}
                    </>
                  )}
                </DropdownMenuItem>
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
