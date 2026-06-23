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
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  ORGANIZATION_ARCHIVE_SCOPE_OPTIONS,
  organizationActiveListArchiveQuery,
  organizationListArchiveQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import { filterApprovalAssignableRequestTypes } from '@/features/hr/requests/approval-assignment/lib/approval-assignable-request-types';

export type { RequestApprovalTemplateResponseDto as ApprovalTemplate };
export type { RequestApprovalMode };
export type { ApiRequestType as RequestTypeOption };

export function useApprovalAssignmentModel() {
  const companyId = useDefaultCompanyId();
  const [requestTypes, setRequestTypes] = React.useState<ApiRequestType[]>([]);
  const [employees, setEmployees] = React.useState<{ id: string; nameAr: string }[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);
  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as RequestApprovalTemplateResponseDto[], total: 0 };
    try {
      const tplRes = await requestApprovalTemplatesApi.getAll({
        companyId,
        page,
        limit: pageSize,
        ...organizationListArchiveQuery(archiveScope),
      });
      setListError(null);
      return { items: tplRes.items, total: tplRes.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'request-approval-assignments.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [companyId, archiveScope]);

  const {
    items,
    loading,
    pagination,
    reload: reloadList,
  } = useServerDirectoryPagination<RequestApprovalTemplateResponseDto>(loadPage, {
    enabled: !!companyId,
    resetDeps: [companyId, archiveScope],
  });

  const reloadReferenceData = React.useCallback(async () => {
    if (!companyId) return;
    try {
      const [rtRes, empRes] = await Promise.all([
        requestTypesApi.list({ companyId, limit: 200, ...organizationActiveListArchiveQuery() }),
        employeesApi.getAll({ companyId, limit: 500, ...organizationActiveListArchiveQuery() }),
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

  const approvalRequestTypes = React.useMemo(
    () => filterApprovalAssignableRequestTypes(requestTypes),
    [requestTypes],
  );

  const templates = React.useMemo(() => {
    const allowedIds = new Set(approvalRequestTypes.map((rt) => rt.id));
    return items
      .map((tpl) => ({
        ...tpl,
        requestTypes: tpl.requestTypes.filter((rt) => allowedIds.has(rt.requestTypeId)),
      }))
      .filter((tpl) => tpl.requestTypes.length > 0);
  }, [items, approvalRequestTypes]);

  return {
    templates,
    requestTypes: approvalRequestTypes,
    employees,
    loading,
    listError,
    pagination,
    archiveScope,
    setArchiveScope,
    archiveScopeOptions: ORGANIZATION_ARCHIVE_SCOPE_OPTIONS,
    reload,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
