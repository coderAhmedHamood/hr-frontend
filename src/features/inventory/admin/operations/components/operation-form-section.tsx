'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';
import { OPERATION_FORM_SECTION } from '@/features/inventory/admin/operations/components/operation-form-ui';

type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

/** Stacked section for create-operation dialog (no tabs). */
export function OperationFormSection({ title, description, children, className }: Props) {
  return (
    <section className={cn(OPERATION_FORM_SECTION, className)}>
      <div className="mb-4 space-y-1 border-b border-border/60 pb-3">
        <h3 className="text-sm font-semibold text-foreground sm:text-base">{title}</h3>
        {description ? (
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
