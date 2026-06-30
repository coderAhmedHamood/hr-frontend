'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';

export type LogoProps = {
  className?: string;
  /** Max width/height in px — image scales down with object-contain. */
  size?: number;
  src?: string | null;
  alt?: string;
};

export function Logo({ className, size = 40, src, alt = 'Rose HR' }: LogoProps) {
  const [mounted, setMounted] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  const resolvedSrc = src?.trim() || null;
  if (!mounted || !resolvedSrc || failed) return null;

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden', className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={alt}
        className="max-h-full max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function LogoWithText({
  className,
  src,
  alt,
}: {
  className?: string;
  src?: string | null;
  alt?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Logo size={40} src={src} alt={alt} />
      <div className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold tracking-tight">روز</span>
        <span className="text-[10px] text-muted-foreground tracking-wider uppercase">rose HR</span>
      </div>
    </div>
  );
}
