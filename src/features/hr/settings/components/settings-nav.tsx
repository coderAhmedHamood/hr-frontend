'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hrSettingsNavGroups, isHrSettingsPathActive } from '@/features/hr/settings/constants/nav';
import { cn } from '@/shared/utils';

export function SettingsNav() {
  const pathname = usePathname();
  const items = hrSettingsNavGroups.flatMap((g) => g.items);

  return (
    <>
      <nav className="flex gap-1.5 overflow-x-auto pb-1 sm:hidden" aria-label="أقسام الإعدادات">
        {items.map((item) => {
          const active = isHrSettingsPathActive(pathname, item.slug);
          return (
            <Link
              key={item.slug}
              href={item.href}
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

      <nav className="hidden sm:block" aria-label="أقسام الإعدادات">
        <div className="flex flex-wrap gap-1 overflow-x-auto rounded-xl border border-border bg-muted/30 p-1">
          {items.map((item) => {
            const active = isHrSettingsPathActive(pathname, item.slug);
            return (
              <Link
                key={item.slug}
                href={item.href}
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
      </nav>
    </>
  );
}
