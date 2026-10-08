'use client';

import type { ReactNode } from 'react';
import { useModuleEnablementContext } from '@/features/auth/hooks/use-system-owner';
import { isModuleEnabledFor } from '@/shared/modules/registry';
import { ExpensesProvider } from '@/features/expenses/components/expenses-provider';
import { SimulationBar } from '@/features/expenses/components/common';

export default function ExpensesAppLayout({ children }: { children: ReactNode }) {
  const { companyId, ...moduleContext } = useModuleEnablementContext();
  const enabled = isModuleEnabledFor('expenses', companyId, moduleContext);
  return (
    <div className="expenses-app flex min-h-0 flex-1 flex-col gap-3 animate-fade-in">
      {enabled ? (
        <ExpensesProvider>
          <SimulationBar />
          {children}
        </ExpensesProvider>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          تطبيق «المصاريف والعهد المالية» غير مفعّل لهذه الشركة. يفعّله مالك النظام من إعدادات الشركة.
        </div>
      )}
    </div>
  );
}
