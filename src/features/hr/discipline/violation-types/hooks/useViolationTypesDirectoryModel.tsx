'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { violationTypesApi } from '@/features/hr/discipline/lib/api/violation-types';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import type { HRViolationDeductionKind, HRViolationTypeRecord } from '@/features/hr/discipline/lib/types';
import { slugify } from '@/features/hr/requests/lib/types';
import {
  createViolationType,
  deleteViolationType,
  mapViolationTypeResponse,
  updateViolationType,
} from '@/features/hr/discipline/violation-types/services/violation-types.service';

export interface ViolationTypeDraftForm {
  code: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
  hasDeduction: boolean;
  deductionKind: HRViolationDeductionKind;
  deductionValue: number;
  needsWarning: boolean;
  needsInvestigation: boolean;
}

const EMPTY: ViolationTypeDraftForm = {
  code: '',
  nameAr: '',
  sortOrder: 1,
  isActive: true,
  hasDeduction: false,
  deductionKind: 'none',
  deductionValue: 0,
  needsWarning: false,
  needsInvestigation: false,
};

export function useViolationTypesDirectoryModel() {
  const [types, setTypes] = React.useState<HRViolationTypeRecord[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<ViolationTypeDraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    setListError(null);
    try {
      const scope = await resolveOrganizationScope();
      const cid = scope.companyId ?? null;
      setCompanyId(cid);
      const res = await violationTypesApi.getAll({
        ...(cid ? { companyId: cid, page, limit: pageSize } : { page, limit: pageSize }),
      });
      const items = res.items.map(mapViolationTypeResponse);
      setTypes(items);
      return { items, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'violation-types.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, []);

  const {
    items: pagedTypes,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<HRViolationTypeRecord>(loadPage);

  const openCreate = React.useCallback(() => {
    setDraft(EMPTY);
    setEditId(null);
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = React.useCallback((t: HRViolationTypeRecord) => {
    setDraft({
      code: t.code,
      nameAr: t.nameAr,
      sortOrder: t.sortOrder,
      isActive: t.isActive,
      hasDeduction: t.hasDeduction,
      deductionKind: t.deductionKind,
      deductionValue: t.deductionValue,
      needsWarning: t.needsWarning,
      needsInvestigation: t.needsInvestigation,
    });
    setEditId(t.id);
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const set = React.useCallback((patch: Partial<ViolationTypeDraftForm>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!draft.nameAr.trim()) {
      setFormError('الاسم مطلوب');
      return;
    }
    if (!companyId) {
      setFormError('تعذر تحديد الشركة');
      return;
    }
    setFormError(null);
    const nameAr = draft.nameAr.trim();
    const deductionKind = draft.hasDeduction ? draft.deductionKind : ('none' as const);
    try {
      if (editId) {
        await updateViolationType(editId, {
          nameAr,
          nameEn: nameAr,
          sortOrder: draft.sortOrder,
          isActive: draft.isActive,
          hasDeduction: draft.hasDeduction,
          deductionKind,
          deductionValue: draft.hasDeduction ? draft.deductionValue : null,
          needsWarning: draft.needsWarning,
          needsInvestigation: draft.needsInvestigation,
          needsApproval: false,
          approvalTemplateId: null,
        });
      } else {
        await createViolationType({
          companyId,
          code: slugify(nameAr) || `vt-${Date.now().toString(36)}`,
          nameAr,
          nameEn: nameAr,
          sortOrder: draft.sortOrder,
          isActive: draft.isActive,
          hasDeduction: draft.hasDeduction,
          deductionKind,
          deductionValue: draft.hasDeduction ? draft.deductionValue : null,
          needsWarning: draft.needsWarning,
          needsInvestigation: draft.needsInvestigation,
          needsApproval: false,
          approvalTemplateId: null,
        });
      }
      toast.success(editId ? 'تم تحديث نوع المخالفة' : 'تمت إضافة نوع المخالفة');
      setDrawerOpen(false);
      await reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'violation-types.save');
      setFormError(displayMessage);
    }
  }, [companyId, draft, editId, reload]);

  const handleDelete = React.useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteViolationType(deleteId);
      toast.success('تم الحذف');
      setDeleteId(null);
      await reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'violation-types.delete');
      toast.error(displayMessage);
    }
  }, [deleteId, reload]);

  return {
    types: pagedTypes,
    loading,
    pagination,
    listError,
    drawerOpen,
    setDrawerOpen,
    editId,
    draft,
    formError,
    deleteId,
    setDeleteId,
    openCreate,
    openEdit,
    set,
    handleSave,
    handleDelete,
  };
}
