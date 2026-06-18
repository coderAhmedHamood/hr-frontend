'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { publicHolidaysApi } from '@/features/hr/leaves/public-holidays/lib/api/public-holidays';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import type { HRPublicHolidayRecord } from '@/features/hr/leaves/public-holidays/types';
import { slugify } from '@/features/hr/requests/lib/types';
import {
  createPublicHoliday,
  deletePublicHoliday,
  mapPublicHolidayResponse,
  updatePublicHoliday,
} from '@/features/hr/leaves/public-holidays/services/public-holidays.service';

export type PublicHolidayDraft = Omit<HRPublicHolidayRecord, 'id' | 'updatedAt'>;

const EMPTY_DRAFT: PublicHolidayDraft = {
  code: '',
  nameAr: '',
  nameEn: '',
  date: '',
  recurring: true,
  sortOrder: 0,
  isActive: true,
};

export function usePublicHolidaysPanelModel() {
  const [listError, setListError] = React.useState<string | null>(null);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<PublicHolidayDraft>(EMPTY_DRAFT);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    setListError(null);
    try {
      const scope = await resolveOrganizationScope();
      const cid = scope.companyId ?? null;
      setCompanyId(cid);
      const res = await publicHolidaysApi.getAll(
        cid ? { companyId: cid, page, limit: pageSize } : { page, limit: pageSize },
      );
      const mapped = res.items.map(mapPublicHolidayResponse).sort((a, b) => a.sortOrder - b.sortOrder);
      return { items: mapped, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'public-holidays.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, []);

  const {
    items: sorted,
    loading,
    pagination,
    reload,
    total,
  } = useServerDirectoryPagination<HRPublicHolidayRecord>(loadPage);

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setDraft({ ...EMPTY_DRAFT, sortOrder: total + 1 });
    setError(null);
    setOpen(true);
  }, [total]);

  const openEdit = React.useCallback((item: HRPublicHolidayRecord) => {
    setEditId(item.id);
    setDraft({
      code: item.code,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      date: item.date,
      recurring: item.recurring,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setError(null);
    setOpen(true);
  }, []);

  const patch = React.useCallback(<K extends keyof PublicHolidayDraft>(k: K, v: PublicHolidayDraft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  const save = React.useCallback(async () => {
    if (!draft.nameAr.trim()) {
      setError('الاسم مطلوب');
      return;
    }
    if (!draft.date.match(/^\d{2}-\d{2}$/)) {
      setError('التاريخ يجب أن يكون بصيغة MM-DD (مثال: 09-23)');
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
        await updatePublicHoliday(editId, {
          nameAr,
          nameEn: nameAr,
          monthDay: draft.date,
          recurring: draft.recurring,
          sortOrder: draft.sortOrder,
          isActive: draft.isActive,
        });
      } else {
        await createPublicHoliday({
          companyId,
          code: slugify(nameAr) || `hol-${Date.now().toString(36)}`,
          nameAr,
          nameEn: nameAr,
          monthDay: draft.date,
          recurring: draft.recurring,
          sortOrder: draft.sortOrder,
          isActive: draft.isActive,
        });
      }
      await reload();
      setOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'public-holidays.save');
      setError(displayMessage);
    }
  }, [companyId, draft, editId, reload]);

  const remove = React.useCallback(async () => {
    if (!confirmId) return;
    try {
      await deletePublicHoliday(confirmId);
      setConfirmId(null);
      await reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'public-holidays.delete');
      setError(displayMessage);
    }
  }, [confirmId, reload]);

  return {
    sorted,
    loading,
    pagination,
    listError,
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
    save,
    remove,
  };
}
