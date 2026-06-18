'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hrDisciplineNavGroups } from '@/features/hr/discipline/lib/types';
import { cn } from '@/shared/utils';
import { hrDisciplineSectionHref, isDisciplineSectionPathActive } from '@/features/hr/discipline/constants/routes';

export function DisciplineNav() {
  const pathname = usePathname();
  const allItems = hrDisciplineNavGroups.flatMap((g) => g.items);

  return (
    <>
      <nav className="flex gap-1.5 overflow-x-auto pb-1 sm:hidden" aria-label="أقسام الانضباط">
        {allItems.map((item) => {
          const active = isDisciplineSectionPathActive(pathname, item.slug);
          return (
            <Link
              key={item.slug}
              href={hrDisciplineSectionHref(item.slug)}
              className={cn(
                'flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
              )}
            >
              {item.labelAr}
            </Link>
          );
        })}
      </nav>

      <nav className="hidden sm:block" aria-label="أقسام الانضباط">
        <div className="flex flex-wrap gap-1 overflow-x-auto rounded-xl border border-border bg-muted/30 p-1">
          {hrDisciplineNavGroups.map((group) => (
            <div key={group.labelAr || 'ungrouped'} className="flex items-center gap-1">
              {group.labelAr ? (
                <span className="whitespace-nowrap px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                  {group.labelAr}
                </span>
              ) : null}
              {group.items.map((item) => {
                const active = isDisciplineSectionPathActive(pathname, item.slug);
                return (
                  <Link
                    key={item.slug}
                    href={hrDisciplineSectionHref(item.slug)}
                    className={cn(
                      'flex items-center rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all',
                      active ? 'bg-background text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.labelAr}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
