'use client';

import * as React from 'react';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import {
  requestApprovalTemplatesApi,
  type RequestApprovalTemplateResponseDto,
  type CreateRequestApprovalTemplateDto,
  type UpdateRequestApprovalTemplateDto,
  type RequestApprovalMode,
} from '@/features/hr/requests/lib/api/approval-templates';
import { requestTypesApi, type ApiRequestType } from '@/features/hr/requests/lib/api/request-types';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

export type { RequestApprovalTemplateResponseDto as ApprovalTemplate };
export type { RequestApprovalMode };
export type { ApiRequestType as RequestTypeOption };

export function useApprovalAssignmentModel() {
  const companyId = useDefaultCompanyId();
  const [requestTypes, setRequestTypes] = React.useState<ApiRequestType[]>([]);
  const [employees, setEmployees] = React.useState<{ id: string; nameAr: string }[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

  const isActiveFilter = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as RequestApprovalTemplateResponseDto[], total: 0 };
    try {
      const tplRes = await requestApprovalTemplatesApi.getAll({
        companyId,
        page,
        limit: pageSize,
        ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
      });
      setListError(null);
      return { items: tplRes.items, total: tplRes.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'request-approval-assignments.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [companyId, isActiveFilter]);

  const {
    items: templates,
    loading,
    pagination,
    reload: reloadList,
  } = useServerDirectoryPagination<RequestApprovalTemplateResponseDto>(loadPage, {
    enabled: !!companyId,
    resetDeps: [companyId, statusFilter],
  });

  const reloadReferenceData = React.useCallback(async () => {
    if (!companyId) return;
    try {
      const [rtRes, empRes] = await Promise.all([
        requestTypesApi.list({ companyId, limit: 200 }),
        employeesApi.getAll({ companyId, limit: 500 }),
      ]);
      setRequestTypes(rtRes.items);
      setEmployees(empRes.items.map((e) => ({ id: e.id, nameAr: e.nameAr })));
    } catch {
      setRequestTypes([]);
      setEmployees([]);
    }
  }, [companyId]);

  React.useEffect(() => {
    void reloadReferenceData();
  }, [reloadReferenceData]);

  const reload = React.useCallback(async (_params?: { isActive?: boolean }) => {
    await reloadList();
  }, [reloadList]);

  const createTemplate = React.useCallback(
    async (payload: Omit<CreateRequestApprovalTemplateDto, 'companyId'>) => {
      if (!companyId) throw new Error('no company');
      const res = await requestApprovalTemplatesApi.create({ ...payload, companyId });
      await reloadList();
      return res;
    },
    [companyId, reloadList],
  );

  const updateTemplate = React.useCallback(
    async (id: string, patch: UpdateRequestApprovalTemplateDto) => {
      const res = await requestApprovalTemplatesApi.update(id, patch);
      await reloadList();
      return res;
    },
    [reloadList],
  );

  const deleteTemplate = React.useCallback(async (id: string) => {
    await requestApprovalTemplatesApi.remove(id);
    await reloadList();
  }, [reloadList]);

  return {
    templates,
    requestTypes,
    employees,
    loading,
    listError,
    pagination,
    statusFilter,
    setStatusFilter,
    reload,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
