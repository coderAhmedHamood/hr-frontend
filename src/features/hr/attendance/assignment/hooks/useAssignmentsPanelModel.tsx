'use client';

import * as React from 'react';
import type { AssignmentTargetType } from '@/features/hr/attendance/lib/types';
import type { MultiSelectOption } from '@/components/ui/multi-select';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { shiftTemplatesApi, type ShiftTemplateResponseDto } from '@/features/hr/attendance/lib/api/shift-templates';
import { shiftAssignmentsApi, type GroupedByTemplateItem, type UnassignedEmployeeResponseDto } from '@/features/hr/attendance/lib/api/shift-assignments';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';

type BatchRow = {
  id: string;
  batchId?: string;
  templateId: string;
  effectiveFrom: string;
  targetType: AssignmentTargetType;
  targetId: string;
  targetLabel: string;
  employeeCode: string;
  isActive: boolean;
};

type Batch = {
  batchId: string;
  rows: BatchRow[];
  templateId: string | undefined;
  templateName: string;
  colorHex: string;
  effectiveFrom: string | undefined;
  totalAssignments: number;
  activeAssignments: number;
};

function mapGroupedToBatch(group: GroupedByTemplateItem): Batch {
  return {
    batchId: group.shiftTemplate.id,
    templateId: group.shiftTemplate.id,
    templateName: group.shiftTemplate.nameAr,
    colorHex: group.shiftTemplate.colorHex,
    effectiveFrom: group.employees[0]?.effectiveFrom,
    totalAssignments: group.totalAssignments,
    activeAssignments: group.activeAssignments,
    rows: group.employees.map((emp) => ({
      id: emp.assignmentId,
      batchId: emp.batchId ?? undefined,
      templateId: group.shiftTemplate.id,
      effectiveFrom: emp.effectiveFrom,
      targetType: 'employee' as AssignmentTargetType,
      targetId: emp.employeeId,
      targetLabel: emp.employeeNameAr,
      employeeCode: emp.employeeCode,
      isActive: emp.isActive,
    })),
  };
}

export function useAssignmentsPanelModel() {
  const companyId = useDefaultCompanyId() ?? '';

  const [shiftTemplates, setShiftTemplates] = React.useState<ShiftTemplateResponseDto[]>([]);
  const [unassignedEmployees, setUnassignedEmployees] = React.useState<UnassignedEmployeeResponseDto[]>([]);
  const [loadingUnassigned, setLoadingUnassigned] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [templateId, setTemplateId] = React.useState('');
  const [effectiveFrom, setEffectiveFrom] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const [editOpen, setEditOpen] = React.useState(false);
  const [editBatchId, setEditBatchId] = React.useState<string | null>(null);
  const [editEffectiveFrom, setEditEffectiveFrom] = React.useState('');
  const [editIsActive, setEditIsActive] = React.useState(true);
  const [unlinkTarget, setUnlinkTarget] = React.useState<{ assignmentId: string; employeeName: string } | null>(null);
  const [unlinking, setUnlinking] = React.useState(false);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as Batch[], total: 0 };
    try {
      const res = await shiftAssignmentsApi.getGroupedByTemplate({ companyId, page, limit: pageSize });
      return { items: res.items.map(mapGroupedToBatch), total: res.pagination.total };
    } catch {
      return { items: [], total: 0 };
    }
  }, [companyId]);

  const {
    items: batches,
    loading,
    pagination,
    reload: reloadAssignments,
  } = useServerDirectoryPagination<Batch>(loadPage, {
    enabled: !!companyId,
    resetDeps: [companyId],
  });

  React.useEffect(() => {
    if (!companyId) return;
    void shiftTemplatesApi.getAll({ limit: 200, companyId, ...organizationActiveListStatusQuery() })
      .then((res) => setShiftTemplates(res.items))
      .catch(() => setShiftTemplates([]));
  }, [companyId]);

  const reloadUnassignedEmployees = React.useCallback(async (asOfDate: string) => {
    if (!companyId) {
      setUnassignedEmployees([]);
      return;
    }
    setLoadingUnassigned(true);
    try {
      const res = await fetchAllPaginatedItems((page, limit) =>
        shiftAssignmentsApi.getUnassignedEmployees({ companyId, asOfDate, page, limit }),
      );
      setUnassignedEmployees(res.items);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'shift-assignments.unassigned-employees');
      toast.error(displayMessage);
      setUnassignedEmployees([]);
    } finally {
      setLoadingUnassigned(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    if (!open || !companyId) return;
    void reloadUnassignedEmployees(effectiveFrom);
  }, [open, companyId, effectiveFrom, reloadUnassignedEmployees]);

  const activeTemplates = React.useMemo(() => shiftTemplates.filter((t) => t.isActive), [shiftTemplates]);

  const openNew = React.useCallback(() => {
    setTemplateId(activeTemplates[0]?.id ?? '');
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setSelectedIds(new Set());
    setOpen(true);
  }, [activeTemplates]);

  const submit = React.useCallback(async () => {
    if (!templateId || selectedIds.size === 0 || !companyId) return;

    const employeeIds = [...selectedIds];
    if (employeeIds.length === 0) return;

    try {
      await shiftAssignmentsApi.bulkCreate({
        companyId,
        shiftTemplateId: templateId,
        employeeIds,
        effectiveFrom,
        isActive: true,
      });
      await reloadAssignments();
      toast.success('تم ربط الموظفين بالقالب');
      setOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'shift-assignments.bulk-create');
      toast.error(displayMessage);
    }
  }, [templateId, selectedIds, companyId, effectiveFrom, reloadAssignments]);

  const editBatch = React.useMemo(
    () => (editBatchId ? batches.find((b) => b.batchId === editBatchId) ?? null : null),
    [batches, editBatchId],
  );

  const openEdit = React.useCallback((batchId: string) => {
    const batch = batches.find((b) => b.batchId === batchId);
    if (!batch) return;
    setEditBatchId(batchId);
    setEditEffectiveFrom(batch.effectiveFrom ?? new Date().toISOString().slice(0, 10));
    setEditIsActive(batch.rows.some((r) => r.isActive));
    setEditOpen(true);
  }, [batches]);

  const submitEdit = React.useCallback(async () => {
    if (!editBatchId || !editBatch) return;
    try {
      await Promise.all(
        editBatch.rows.map((row) =>
          shiftAssignmentsApi.update(row.id, {
            effectiveFrom: editEffectiveFrom,
            isActive: editIsActive,
          }),
        ),
      );
      await reloadAssignments();
      toast.success('تم حفظ التعديلات');
      setEditOpen(false);
      setEditBatchId(null);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'shift-assignments.update');
      toast.error(displayMessage);
    }
  }, [editBatchId, editBatch, editEffectiveFrom, editIsActive, reloadAssignments]);

  const requestUnlink = React.useCallback((assignmentId: string, employeeName: string) => {
    setUnlinkTarget({ assignmentId, employeeName });
  }, []);

  const confirmUnlink = React.useCallback(async () => {
    if (!unlinkTarget) return;
    setUnlinking(true);
    try {
      await shiftAssignmentsApi.remove(unlinkTarget.assignmentId);
      await reloadAssignments();
      toast.success(`تم إلغاء ربط ${unlinkTarget.employeeName}`);
      setUnlinkTarget(null);

      const remaining = editBatch?.rows.filter((r) => r.id !== unlinkTarget.assignmentId) ?? [];
      if (editOpen && remaining.length === 0) {
        setEditOpen(false);
        setEditBatchId(null);
      }
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'shift-assignments.remove');
      toast.error(displayMessage);
    } finally {
      setUnlinking(false);
    }
  }, [unlinkTarget, reloadAssignments, editBatch, editOpen]);

  const removeAssignmentBatch = React.useCallback(async (batchId: string) => {
    const batch = batches.find((b) => b.batchId === batchId);
    if (!batch) return;
    try {
      await Promise.all(batch.rows.map((row) => shiftAssignmentsApi.remove(row.id)));
      await reloadAssignments();
    } catch { /* ignore */ }
  }, [batches, reloadAssignments]);

  const multiOptions = React.useMemo((): MultiSelectOption[] =>
    unassignedEmployees.map((e) => ({
      value: e.id,
      label: e.nameAr,
      subtitle: e.employeeCode,
    })),
  [unassignedEmployees]);

  React.useEffect(() => {
    const allowedIds = new Set(unassignedEmployees.map((e) => e.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => allowedIds.has(id)));
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) return prev;
      return next;
    });
  }, [unassignedEmployees]);

  return {
    batches,
    loading,
    pagination,
    shiftTemplates,
    removeAssignmentBatch,
    editBatch,
    openEdit,
    submitEdit,
    requestUnlink,
    confirmUnlink,
    unlinkTarget,
    setUnlinkTarget,
    unlinking,
    editOpen,
    setEditOpen,
    editEffectiveFrom,
    setEditEffectiveFrom,
    editIsActive,
    setEditIsActive,
    open,
    setOpen,
    templateId,
    setTemplateId,
    effectiveFrom,
    setEffectiveFrom,
    selectedIds,
    setSelectedIds,
    activeTemplates,
    multiOptions,
    loadingUnassigned,
    openNew,
    submit,
  };
}

export type AssignmentsPanelModel = ReturnType<typeof useAssignmentsPanelModel>;
