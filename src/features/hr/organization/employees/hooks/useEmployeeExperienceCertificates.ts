'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  experienceCertificatesApi,
  type CreateExperienceCertificateDto,
  type ExperienceCertificateDto,
} from '@/features/hr/organization/employees/lib/api/experience-certificates';

export function useEmployeeExperienceCertificates(employee: Employee, enabled: boolean) {
  const companyId = useDefaultCompanyId() ?? '';
  const createdBy = useAuthStore((s) => s.user?.email ?? s.accessProfile?.email ?? null);

  const [items, setItems] = React.useState<ExperienceCertificateDto[]>([]);
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
      const res = await experienceCertificatesApi.getAll({
        companyId,
        employeeId: employee.id,
        page: 1,
        limit: 200,
      });
      setItems(res.items);
      setTotal(res.pagination.total);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'experience-certificates.load');
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
    async (input: Omit<CreateExperienceCertificateDto, 'companyId' | 'employeeId' | 'createdBy'>) => {
      if (!companyId) {
        toast.error('لم يتم تحديد الشركة');
        return null;
      }
      setSaving(true);
      try {
        const created = await experienceCertificatesApi.create({
          ...input,
          companyId,
          employeeId: employee.id,
          createdBy: createdBy ?? undefined,
        });
        toast.success('تم إنشاء شهادة الخبرة كمسودة');
        await reload();
        return created;
      } catch (err) {
        handleApiError(err, 'experience-certificates.create');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [companyId, createdBy, employee.id, reload],
  );

  const getById = React.useCallback(async (id: string) => {
    try {
      return await experienceCertificatesApi.getById(id);
    } catch (err) {
      handleApiError(err, 'experience-certificates.get');
      return null;
    }
  }, []);

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
  };
}
