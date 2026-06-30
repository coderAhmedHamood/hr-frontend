'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';
import type { GuideBlock } from '@/features/hr/guide/types';

export function ProjectGuideToc({
  blocks,
  className,
  scrollRoot,
}: {
  blocks: GuideBlock[];
  className?: string;
  scrollRoot?: React.RefObject<HTMLElement | null>;
}) {
  const [activeId, setActiveId] = React.useState<string | null>(blocks[0]?.id ?? null);

  React.useEffect(() => {
    const root = scrollRoot?.current ?? null;
    const ids = blocks.map((b) => b.id);
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActiveId(id);
          }
        },
        { root, rootMargin: '-20% 0px -60% 0px', threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [blocks, scrollRoot]);

  if (blocks.length === 0) return null;

  return (
    <nav className={cn('text-sm', className)} aria-label="في هذه الصفحة">
      <p className="mb-3 text-xs font-semibold text-muted-foreground">في هذه الصفحة</p>
      <ul className="space-y-2 border-s-2 border-border/60 ps-3">
        {blocks.map((block) => (
          <li key={block.id}>
            <a
              href={`#${block.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(block.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={cn(
                'block text-xs leading-relaxed transition-colors hover:text-primary',
                activeId === block.id ? 'font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              {block.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
