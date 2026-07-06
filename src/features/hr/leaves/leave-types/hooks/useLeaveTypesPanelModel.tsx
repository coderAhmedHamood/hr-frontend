'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveDirectoryLoadFailure } from '@/features/hr/lib/api/directory-load-error';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { leaveTypesApi } from '@/features/hr/leaves/leave-types/lib/api/leave-types';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import type { HRLeaveTypeRecord } from '@/features/hr/leaves/leave-types/types';
import { slugify } from '@/features/hr/requests/lib/types';
import {
  createLeaveType,
  deleteLeaveType,
  mapLeaveTypeResponse,
  updateLeaveType,
} from '@/features/hr/leaves/leave-types/services/leave-types.service';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  organizationListStatusQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';

export type LeaveTypeDraft = Omit<HRLeaveTypeRecord, 'id' | 'updatedAt'>;
export type LeaveTypeProperty = 'paid' | 'deductsFromBalance';

const EMPTY_DRAFT: LeaveTypeDraft = {
  code: '',
  nameAr: '',
  nameEn: '',
  paid: true,
  deductsFromBalance: false,
  requiresApproval: true,
  maxDaysPerRequest: null,
  sortOrder: 0,
  isActive: true,
};

export function getLeaveTypeProperty(draft: LeaveTypeDraft): LeaveTypeProperty {
  return draft.deductsFromBalance ? 'deductsFromBalance' : 'paid';
}

export function useLeaveTypesPanelModel() {
  const [items, setItems] = React.useState<HRLeaveTypeRecord[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);
  const [apiAccessDenied, setApiAccessDenied] = React.useState(false);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );
  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<LeaveTypeDraft>(EMPTY_DRAFT);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    setListError(null);
    try {
      const scope = await resolveOrganizationScope();
      const cid = scope.companyId ?? null;
      setCompanyId(cid);
      const res = await leaveTypesApi.getAll({
        ...(cid ? { companyId: cid, page, limit: pageSize } : { page, limit: pageSize }),
        ...organizationListStatusQuery(archiveScope),
      });
      const mapped = res.items.map(mapLeaveTypeResponse).sort((a, b) => a.sortOrder - b.sortOrder);
      setItems(mapped);
      setApiAccessDenied(false);
      return { items: mapped, total: res.pagination.total };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'leave-types.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [archiveScope]);

  const {
    items: sorted,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<HRLeaveTypeRecord>(loadPage, {
    resetDeps: [archiveScope],
  });

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setDraft({ ...EMPTY_DRAFT, sortOrder: items.length + 1 });
    setError(null);
    setOpen(true);
  }, [items.length]);

  const openEdit = React.useCallback((item: HRLeaveTypeRecord) => {
    setEditId(item.id);
    setDraft({
      code: item.code,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      paid: item.paid,
      deductsFromBalance: item.deductsFromBalance,
      requiresApproval: item.requiresApproval,
      maxDaysPerRequest: item.maxDaysPerRequest,
      sortOrder: item.sortOrder,
      isActive: true,
    });
    setError(null);
    setOpen(true);
  }, []);

  const patch = React.useCallback(<K extends keyof LeaveTypeDraft>(k: K, v: LeaveTypeDraft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  const setProperty = React.useCallback((property: LeaveTypeProperty) => {
    setDraft((d) => ({
      ...d,
      paid: property === 'paid',
      deductsFromBalance: property === 'deductsFromBalance',
    }));
  }, []);

  const save = React.useCallback(async () => {
    if (!draft.nameAr.trim()) {
      setError('الاسم مطلوب');
      return;
    }
    if (!companyId) {
      setError('تعذر تحديد الشركة');
      return;
    }
    setError(null);
    try {
      const nameAr = draft.nameAr.trim();
      if (editId) {
        await updateLeaveType(editId, {
          nameAr,
          nameEn: nameAr,
          paid: draft.paid,
          deductsFromBalance: draft.deductsFromBalance,
          requiresApproval: draft.requiresApproval,
          maxDaysPerRequest: draft.maxDaysPerRequest,
          sortOrder: draft.sortOrder,
          isActive: true,
        });
      } else {
        await createLeaveType({
          companyId,
          code: slugify(nameAr) || `lt-${Date.now().toString(36)}`,
          nameAr,
          nameEn: nameAr,
          paid: draft.paid,
          deductsFromBalance: draft.deductsFromBalance,
          requiresApproval: draft.requiresApproval,
          maxDaysPerRequest: draft.maxDaysPerRequest,
          sortOrder: draft.sortOrder,
          isActive: true,
        });
      }
      await reload();
      setOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'leave-types.save');
      setError(displayMessage);
    }
  }, [companyId, draft, editId, reload]);

  const remove = React.useCallback(async () => {
    if (!confirmId) return;
    try {
      await deleteLeaveType(confirmId);
      setConfirmId(null);
      await reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'leave-types.delete');
      setError(displayMessage);
    }
  }, [confirmId, reload]);

  return {
    items,
    sorted,
    loading,
    pagination,
    listError,
    accessDenied: apiAccessDenied,
    open,
    setOpen,
    editId,
    draft,
    error,
    confirmId,
    setConfirmId,
    openCreate,
    openEdit,
    patch,
    setProperty,
    save,
    remove,
    archiveScope,
    setArchiveScope,
  };
}
