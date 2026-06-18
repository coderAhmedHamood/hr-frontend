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
    <div dir="rtl" className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background -mx-4 sm:-mx-6">
      <div className="shrink-0 border-b border-border/60 bg-card/50 backdrop-blur-md">
        <div className="px-3 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={hrOrganizationRoutes.employees} className="hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
              <span className="hidden sm:inline">الموظفون</span>
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-medium truncate max-w-[140px] sm:max-w-[200px]">{employee.name}</span>
          </div>
        </div>
      </div>

      <div className="md:hidden shrink-0 border-b border-border/60 bg-card/30">
        <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/40">
          <Avatar className="h-9 w-9 ring-2 ring-background shadow-xs shrink-0">
            <AvatarImage src={employee.avatar} alt={employee.name} />
            <AvatarFallback className="text-xs font-arabic-display bg-primary text-primary-foreground">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{employee.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{employee.position}</div>
          </div>
          <StatusBadge status={employee.contractStatus} />
        </div>
        <div className="flex overflow-x-auto scrollbar-hide gap-0.5 px-2 py-1.5">
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

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden md:flex w-72 lg:w-80 shrink-0 min-h-0 border-l border-border/60 bg-card/30 flex-col overflow-hidden">
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
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/20"
        >
          <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
