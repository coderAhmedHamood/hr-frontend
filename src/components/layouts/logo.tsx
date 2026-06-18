import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/shared/utils';

export function Logo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/logo.webp"
      alt="Rose HR"
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
      priority
    />
  );
}

export function LogoWithText({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Logo size={40} />
      <div className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold tracking-tight">روز</span>
        <span className="text-[10px] text-muted-foreground tracking-wider uppercase">rose HR</span>
      </div>
    </div>
  );
}
