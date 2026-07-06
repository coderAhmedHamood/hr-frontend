'use client';

import * as React from 'react';
import { Loader2, Receipt } from 'lucide-react';
import { MoneyAmount } from '@/components/ui/sar-amount';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useCurrentEmployee } from '@/features/hr/organization/employees/hooks/useCurrentEmployee';
import { usePayslipEmployeeDecision } from '@/features/hr/payroll/components/payslip-employee-decision-actions';
import {
  payslipAcceptanceStatus,
  payslipsApi,
  type PayslipResponseDto,
} from '@/features/hr/payroll/lib/api/payslips';

function periodLabel(row: PayslipResponseDto): string {
  if (row.periodYear && row.periodMonth) {
    return `${row.periodMonth}/${row.periodYear}`;
  }
  return '—';
}

export function EmployeePendingPayslipsSection() {
  const companyId = useDefaultCompanyId();
  const user = useAuthStore(s => s.user);
  const { data: currentEmployee } = useCurrentEmployee();
  const [pending, setPending] = React.useState<PayslipResponseDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const loadPending = React.useCallback(async () => {
    if (!companyId || !currentEmployee?.id) {
      setPending([]);
      return;
    }
    setLoading(true);
    try {
      const result = await payslipsApi.list({
        companyId,
        employeeId: currentEmployee.id,
        limit: 50,
      });
      setPending(
        result.items.filter(
          p => p.status !== 'paid' && payslipAcceptanceStatus(p) === 'pending',
        ),
      );
    } catch (err) {
      handleApiError(err, 'payslips.list');
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, currentEmployee?.id]);

  React.useEffect(() => {
    void loadPending();
  }, [loadPending, refreshKey]);

  const getActor = React.useCallback(() => ({
    name:
      currentEmployee?.nameAr?.trim()
      || currentEmployee?.nameEn?.trim()
      || user?.email
      || 'موظف',
    email: user?.email,
  }), [currentEmployee, user]);

  const decision = usePayslipEmployeeDecision({
    channel: 'dashboard',
    getActor,
    onSuccess: async () => {
      setRefreshKey(k => k + 1);
    },
  });

  if (!currentEmployee?.id) return null;

  if (loading && pending.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 border-t border-border/60 px-3 py-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        جاري تحميل القسائم...
      </div>
    );
  }

  if (pending.length === 0) return null;

  return (
    <>
      <div className="border-t border-border/60 bg-muted/10 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Receipt className="h-3.5 w-3.5 text-primary" />
          قسائم بانتظار موافقتك ({pending.length})
        </div>
      </div>
      <ul className="divide-y divide-border/60 border-b border-border/60">
        {pending.map(row => {
          const busy = decision.busyId === row.id;
          return (
            <li key={row.id} className="px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-right">
                  <p className="text-sm font-medium leading-snug">
                    قسيمة {periodLabel(row)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    الصافي: <MoneyAmount value={row.net} currency={row.currency} className="inline text-[11px]" />
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px] border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={busy}
                    onClick={() => decision.openReject(row)}
                  >
                    رفض
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 px-2 text-[11px] bg-success text-success-foreground hover:bg-success/90"
                    disabled={busy}
                    onClick={() => decision.accept(row)}
                  >
                    موافقة
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {decision.rejectDialog}
    </>
  );
}
