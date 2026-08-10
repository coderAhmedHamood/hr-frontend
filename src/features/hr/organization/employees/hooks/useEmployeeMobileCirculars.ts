'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  employeeMobileCircularsApi,
  type CreateEmployeeMobileCircularDto,
  type EmployeeMobileCircularDto,
} from '@/features/hr/organization/employees/lib/api/employee-mobile-circulars';

function localTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useEmployeeMobileCirculars(employee: Employee, enabled: boolean) {
  const companyId = useDefaultCompanyId() ?? '';
  const createdBy = useAuthStore((s) => s.user?.email ?? s.accessProfile?.email ?? null);

  const [items, setItems] = React.useState<EmployeeMobileCircularDto[]>([]);
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
      const res = await employeeMobileCircularsApi.getAll({
        companyId,
        employeeId: employee.id,
        page: 1,
        limit: 200,
      });
      setItems(res.items);
      setTotal(res.pagination.total);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employee-mobile-circulars.load');
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
    async (
      input?: Partial<
        Omit<CreateEmployeeMobileCircularDto, 'companyId' | 'employeeId' | 'createdBy'>
      >,
    ) => {
      if (!companyId) {
        toast.error('لم يتم تحديد الشركة');
        return null;
      }
      setSaving(true);
      try {
        const created = await employeeMobileCircularsApi.create({
          companyId,
          employeeId: employee.id,
          circularDate: input?.circularDate ?? localTodayIso(),
          nationalId: input?.nationalId ?? employee.nationalId ?? null,
          notes: input?.notes ?? null,
          createdBy: createdBy ?? undefined,
        });
        toast.success('تم إنشاء تعميم الجوال كمسودة');
        await reload();
        return created;
      } catch (err) {
        handleApiError(err, 'employee-mobile-circulars.create');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [companyId, createdBy, employee.id, employee.nationalId, reload],
  );

  const getById = React.useCallback(async (id: string) => {
    try {
      return await employeeMobileCircularsApi.getById(id);
    } catch (err) {
      handleApiError(err, 'employee-mobile-circulars.get');
      return null;
    }
  }, []);

  const sendToEmployee = React.useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        const updated = await employeeMobileCircularsApi.sendToEmployee(id, {
          updatedBy: createdBy,
        });
        toast.success('تم إرسال تعميم الجوال للموظف');
        await reload();
        return updated;
      } catch (err) {
        handleApiError(err, 'employee-mobile-circulars.send');
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
