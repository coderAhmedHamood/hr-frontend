'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { appendEmployeeAudit } from '@/features/hr/organization/employees/lib/employee-audit-log/append';
import { diffEmployeeShallowAudit } from '@/features/hr/organization/employees/lib/employee-audit-log/diff-employee';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { buildPersonalEmployeeUpdatePayload } from '@/features/hr/organization/employees/services/employee-update.service';
import type { Employee } from '@/features/hr/organization/employees/types';
import type { EmployeeProfileSectionId } from '@/features/hr/organization/employees/constants/EmployeeProfileSections';
import type { EmployeeProfileDraft } from '@/features/hr/organization/employees/components/employee-profile-field';

export function useEmployeeProfilePersonal(
  employee: Employee,
  activeSection: EmployeeProfileSectionId,
  onUpdated?: (updated: Employee) => void,
) {
  type Draft = EmployeeProfileDraft;
  const [editingPersonal, setEditingPersonal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>(() => ({ ...employee }));

  React.useEffect(() => {
    setDraft({ ...employee });
    setEditingPersonal(false);
  }, [employee.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = React.useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSavePersonal = React.useCallback(async () => {
    setSaving(true);
    try {
      const updated = await employeesApi.update(
        employee.id,
        buildPersonalEmployeeUpdatePayload(draft),
      );
      const before = { ...employee };
      const rows = diffEmployeeShallowAudit(before, draft, 'personal');
      if (rows.length) appendEmployeeAudit(employee.id, rows);
      if (onUpdated) {
        onUpdated({
          ...employee,
          ...draft,
          name: updated.nameAr ?? draft.name,
          nameEn: updated.nameEn ?? '',
          email: updated.email ?? '',
          phone: updated.phone ?? '',
        });
      }
      toast.success('تم حفظ البيانات بنجاح');
      setEditingPersonal(false);
    } catch (e) {
      toast.error(handleApiError(e, 'employee.update').displayMessage);
    } finally {
      setSaving(false);
    }
  }, [employee, draft, onUpdated]);

  const handleCancelPersonal = React.useCallback(() => {
    setDraft({ ...employee });
    setEditingPersonal(false);
  }, [employee]);

  const totalSalary =
    draft.baseSalary + draft.housingAllowance + draft.transportAllowance + draft.otherAllowances;
  const netSalary = totalSalary - draft.gosi;

  const yearsOfService = (() => {
    const start = new Date(draft.startDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return (diff / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
  })();

  React.useEffect(() => {
    if (activeSection !== 'personal' && editingPersonal) {
      setDraft({ ...employee });
      setEditingPersonal(false);
    }
  }, [activeSection, editingPersonal, employee]);

  return {
    draft,
    setDraft,
    editingPersonal,
    setEditingPersonal,
    saving,
    updateField,
    handleSavePersonal,
    handleCancelPersonal,
    totalSalary,
    netSalary,
    yearsOfService,
  };
}
