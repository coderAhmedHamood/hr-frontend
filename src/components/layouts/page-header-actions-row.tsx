'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';

/** Horizontal action strip for topbar row 2 — stays on one row on small screens. */
export function PageHeaderActionsRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex max-w-[52%] shrink-0 flex-row flex-nowrap items-center gap-1 overflow-x-auto overscroll-x-contain sm:max-w-none sm:gap-2',
        '[&_button]:shrink-0 [&_a]:shrink-0',
        'max-sm:[&_button]:px-2 max-sm:[&_a]:px-2',
        'max-sm:[&_button]:gap-0 max-sm:[&_a]:gap-0',
        /* Hide button/link labels on mobile — icons stay sized via explicit svg dimensions */
        'max-sm:[&_button]:text-[0px] max-sm:[&_a]:text-[0px]',
        'max-sm:[&_button_span]:hidden max-sm:[&_a_span]:hidden',
        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}
