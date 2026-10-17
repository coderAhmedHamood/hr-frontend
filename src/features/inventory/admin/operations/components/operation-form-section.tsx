'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';
import { OPERATION_FORM_SECTION } from '@/features/inventory/admin/operations/components/operation-form-ui';

type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

/** Stacked section for create-operation dialog (no tabs). */
export function OperationFormSection({ title, description, children, className }: Props) {
  return (
    <section className={cn(OPERATION_FORM_SECTION, className)}>
      {title || description ? (
        <div className="mb-4 space-y-1 border-b border-border/60 pb-3">
          {title ? <h3 className="text-sm font-semibold text-foreground sm:text-base">{title}</h3> : null}
          {description ? (
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
