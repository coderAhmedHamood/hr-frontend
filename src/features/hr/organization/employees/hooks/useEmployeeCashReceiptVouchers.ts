'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  cashReceiptVouchersApi,
  type CashReceiptVoucherDto,
  type CreateCashReceiptVoucherDto,
} from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';

export function useEmployeeCashReceiptVouchers(employee: Employee, enabled: boolean) {
  const companyId = useDefaultCompanyId() ?? '';
  const createdBy = useAuthStore((s) => s.user?.email ?? s.accessProfile?.email ?? null);

  const [items, setItems] = React.useState<CashReceiptVoucherDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const reload = React.useCallback(async () => {
    if (!enabled || !employee.id || !companyId) {
      setItems([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await cashReceiptVouchersApi.getAll({
        companyId,
        employeeId: employee.id,
        page: 1,
        limit: 200,
      });
      setItems(res.items);
      setTotal(res.pagination.total);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'cash-receipt-vouchers.load');
      setError(displayMessage);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [companyId, employee.id, enabled]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const create = React.useCallback(
    async (input: Omit<CreateCashReceiptVoucherDto, 'companyId' | 'employeeId' | 'createdBy'>) => {
      if (!companyId) {
        toast.error('لم يتم تحديد الشركة');
        return null;
      }
      setSaving(true);
      try {
        const created = await cashReceiptVouchersApi.create({
          ...input,
          companyId,
          employeeId: employee.id,
          createdBy: createdBy ?? undefined,
        });
        toast.success('تم إنشاء سند الراتب كمسودة');
        await reload();
        return created;
      } catch (err) {
        handleApiError(err, 'cash-receipt-vouchers.create');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [companyId, createdBy, employee.id, reload],
  );

  const getById = React.useCallback(async (id: string) => {
    try {
      return await cashReceiptVouchersApi.getById(id);
    } catch (err) {
      handleApiError(err, 'cash-receipt-vouchers.get');
      return null;
    }
  }, []);

  const sendToEmployee = React.useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        const updated = await cashReceiptVouchersApi.sendToEmployee(id, {
          updatedBy: createdBy,
        });
        toast.success('تم إرسال سند الراتب للموظف للتوقيع');
        await reload();
        return updated;
      } catch (err) {
        handleApiError(err, 'cash-receipt-vouchers.send');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [createdBy, reload],
  );

  return {
    companyId,
    items,
    total,
    loading,
    error,
    saving,
    reload,
    create,
    getById,
    sendToEmployee,
  };
}
