'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils';
import { GUIDE_CATEGORIES, GUIDE_PAGES } from '@/features/hr/guide/constants/project-guide-content';

export function ProjectGuideSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn('space-y-5 text-sm', className)} aria-label="فهرس الدليل">
      {GUIDE_CATEGORIES.map((category) => {
        const pages = GUIDE_PAGES.filter((p) => p.categoryId === category.id);
        if (pages.length === 0) return null;

        return (
          <section key={category.id} className="space-y-1">
            <h2 className="px-3 pb-2 text-[13px] font-bold text-foreground border-b border-border/70">
              {category.label}
            </h2>
            <ul className="space-y-0.5 pt-1">
              {pages.map((page) => {
                const href = `/hr/guide/${page.slug}`;
                const active = pathname === href;
                return (
                  <li key={page.slug}>
                    <Link
                      href={href}
                      className={cn(
                        'block rounded-lg px-3 py-2 text-[13px] leading-snug transition-colors',
                        active
                          ? 'bg-primary/10 font-semibold text-primary'
                          : 'text-foreground/70 hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      {page.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
