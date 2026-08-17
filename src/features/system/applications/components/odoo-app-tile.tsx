'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';

export function OdooAppTile({
  icon: Icon,
  label,
  caption,
  tileClass,
  href,
  external,
  onClick,
  muted,
  overlay,
}: {
  icon: LucideIcon;
  label: string;
  caption?: string;
  tileClass: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  muted?: boolean;
  overlay?: ReactNode;
}) {
  const inner = (
    <>
      <span className="relative">
        <span className={cn('odoo-app-square', tileClass, muted && 'odoo-app-square-muted')}>
          <Icon className="odoo-app-icon" strokeWidth={2} />
        </span>
        {overlay}
      </span>
      <span className="odoo-app-label">{label}</span>
      {caption ? <span className="text-xs text-muted-foreground">{caption}</span> : null}
    </>
  );

  const className =
    'group odoo-app-tile flex flex-col items-center gap-2 text-center outline-none focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}
