'use client';

import * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/shared/utils';

type PageHeaderPrimaryButtonProps = ButtonProps & {
  icon: React.ElementType;
  label: string;
};

/** Primary topbar action — icon-only on small screens, icon + label from sm up. */
export function PageHeaderPrimaryButton({
  icon: Icon,
  label,
  className,
  children,
  ...props
}: PageHeaderPrimaryButtonProps) {
  return (
    <Button
      variant="luxe"
      size="sm"
      aria-label={label}
      className={cn('h-8 shrink-0 gap-1.5 px-2 sm:px-3', className)}
      {...props}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">{children ?? label}</span>
    </Button>
  );
}
