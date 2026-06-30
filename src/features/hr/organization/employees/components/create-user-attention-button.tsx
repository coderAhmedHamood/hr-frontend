'use client';

import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';

type Props = {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'default';
};

/** Primary CTA with a 3-pulse dot on the top-start corner to draw attention. */
export function CreateUserAttentionButton({ onClick, className, size = 'sm' }: Props) {
  return (
    <div className={cn('relative inline-flex', className)}>
      <span
        className="pointer-events-none absolute -top-1 start-0 z-10 flex h-3 w-3 -translate-x-1/2"
        aria-hidden
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70 [animation-iteration-count:3] [animation-duration:1.1s]" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
      </span>
      <Button type="button" size={size} className="gap-2 shadow-sm" onClick={onClick}>
        <UserPlus className="h-3.5 w-3.5" />
        إنشاء حساب مستخدم
      </Button>
    </div>
  );
}
