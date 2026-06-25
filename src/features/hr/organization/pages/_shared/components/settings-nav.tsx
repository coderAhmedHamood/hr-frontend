'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  hrSettingsNavGroups,
  isHrSettingsPathActive,
} from '@/features/hr/organization/pages/_shared/constants/nav';
import { cn } from '@/shared/utils';

export function SettingsNav() {
  const pathname = usePathname();
  const items = hrSettingsNavGroups.flatMap((g) => g.items);

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/20 p-1 shadow-soft"
      aria-label="أقسام الإعدادات"
    >
      {items.map((item) => {
        const active = isHrSettingsPathActive(pathname, item.slug);
        const Icon = item.icon;

        return (
          <Link
            key={item.slug}
            href={item.href}
            className={cn(
              'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-all sm:px-4 sm:text-sm',
              active
                ? 'bg-card text-foreground shadow-soft ring-1 ring-border/60'
                : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
            {item.labelAr}
          </Link>
        );
      })}
    </nav>
  );
}
