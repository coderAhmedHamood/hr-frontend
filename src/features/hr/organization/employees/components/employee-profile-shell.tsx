'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn, getInitials } from '@/shared/utils';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';

type Props = {
  model: EmployeeProfileModel;
  children: React.ReactNode;
};

export function EmployeeProfileShell({ model, children }: Props) {
  const { employee, SECTIONS, activeSection, setActiveSection, contentRef, counts } = model;

  /** Persisted Zustand slices are empty on SSR; defer badges until after mount to avoid hydration mismatch. */
  const [countsReady, setCountsReady] = React.useState(false);
  React.useEffect(() => {
    setCountsReady(true);
  }, []);

  const showCount = (n: number | undefined) => countsReady && n !== undefined && n > 0;

  return (
    <div dir="rtl" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background w-full">
      <div className="shrink-0 border-b border-border/60 bg-card/50 backdrop-blur-md">
        <div className="flex h-12 min-w-0 items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <Link href={hrOrganizationRoutes.employees} className="flex shrink-0 items-center gap-1 transition-colors hover:text-foreground">
              <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
              <span className="hidden sm:inline">الموظفون</span>
            </Link>
            <span className="shrink-0 text-muted-foreground/40">/</span>
            <span className="min-w-0 truncate font-medium text-foreground">{employee.name}</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-border/60 bg-card/30 md:hidden">
        <div className="flex min-w-0 items-center gap-3 border-b border-border/40 px-4 py-2.5">
          <Avatar className="h-9 w-9 shrink-0 shadow-xs ring-2 ring-background">
            <AvatarImage src={employee.avatar} alt={employee.name} />
            <AvatarFallback className="bg-primary font-arabic-display text-xs text-primary-foreground">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{employee.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{employee.position}</div>
          </div>
          <div className="shrink-0">
            <StatusBadge status={employee.contractStatus} />
          </div>
        </div>
        <div className="flex max-w-full gap-0.5 overflow-x-auto overscroll-x-contain px-4 py-1.5 scrollbar-hide">
          {SECTIONS.map((s) => {
            const isActive = activeSection === s.id;
            const count = counts[s.id];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                <s.icon className="h-3.5 w-3.5 shrink-0" />
                {s.label}
                {showCount(count) && (
                  <span
                    className={cn(
                      'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] tabular-nums',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <aside className="hidden min-h-0 w-72 shrink-0 flex-col overflow-hidden border-l border-border/60 bg-card/30 md:flex lg:w-80">
          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2 px-2">
              الأقسام
            </div>
            <div className="space-y-0.5">
              {SECTIONS.map((s) => {
                const isActive = activeSection === s.id;
                const count = counts[s.id];
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all text-right',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <s.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
                    <span className="flex-1  text-right">{s.label}</span>
                    {showCount(count) && (
                      <Badge variant={isActive ? 'gold' : 'subtle'} className="h-5 min-w-5 px-1.5 text-[10px] tabular-nums">
                        {count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        <main
          ref={contentRef}
          className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain bg-muted/20"
        >
          <div className="mx-auto w-full min-w-0 max-w-5xl p-4 sm:p-6 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
