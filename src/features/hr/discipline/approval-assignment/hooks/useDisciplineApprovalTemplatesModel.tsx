'use client';

import * as React from 'react';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { violationTypesApi } from '@/features/hr/discipline/lib/api/violation-types';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { disciplineApprovalTemplatesApi } from '@/features/hr/discipline/lib/api/discipline-approval-templates';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveDirectoryLoadFailure } from '@/features/hr/lib/api/directory-load-error';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  organizationActiveListStatusQuery,
  organizationListStatusQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import type {
  DisciplineApprovalTemplateResponseDto,
  CreateDisciplineApprovalTemplateDto,
  UpdateDisciplineApprovalTemplateDto,
  ApprovalMode,
} from '@/features/hr/discipline/lib/api/discipline-approval-templates';

export type { DisciplineApprovalTemplateResponseDto as ApprovalTemplate };
export type { ApprovalMode };

export type ViolationTypeOption = { id: string; nameAr: string; code: string; isActive: boolean };
export type EmployeeOption = { id: string; nameAr: string };

export function useDisciplineApprovalTemplatesModel() {
  const companyId = useDefaultCompanyId();
  const [violationTypes, setViolationTypes] = React.useState<ViolationTypeOption[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeOption[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);
  const [apiAccessDenied, setApiAccessDenied] = React.useState(false);
  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as DisciplineApprovalTemplateResponseDto[], total: 0 };
    try {
      const tplRes = await disciplineApprovalTemplatesApi.getAll({
        companyId,
        page,
        limit: pageSize,
        ...organizationListStatusQuery(archiveScope),
      });
      setListError(null);
      setApiAccessDenied(false);
      return { items: tplRes.items, total: tplRes.pagination.total };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'discipline-approval-assignments.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [companyId, archiveScope]);

  const {
    items: templates,
    loading,
    pagination,
    reload: reloadList,
  } = useServerDirectoryPagination<DisciplineApprovalTemplateResponseDto>(loadPage, {
    enabled: !!companyId,
    resetDeps: [companyId, archiveScope],
  });

  const reloadReferenceData = React.useCallback(async () => {
    if (!companyId) return;
    try {
      const [typesRes, empRes] = await Promise.all([
        violationTypesApi.getAll({ companyId, limit: 200, ...organizationActiveListStatusQuery() }),
        employeesApi.getAll({ companyId, limit: 500 }),
      ]);
      setViolationTypes(
        typesRes.items.map((t) => ({ id: t.id, nameAr: t.nameAr, code: t.code, isActive: t.isActive })),
      );
      setEmployees(empRes.items.map((e) => ({ id: e.id, nameAr: e.nameAr })));
    } catch {
      setViolationTypes([]);
      setEmployees([]);
    }
  }, [companyId]);

  React.useEffect(() => {
    void reloadReferenceData();
  }, [reloadReferenceData]);

  const createTemplate = React.useCallback(
    async (payload: Omit<CreateDisciplineApprovalTemplateDto, 'companyId'>) => {
      if (!companyId) throw new Error('no company');
      const res = await disciplineApprovalTemplatesApi.create({ ...payload, companyId });
      await reloadList();
      return res;
    },
    [companyId, reloadList],
  );

  const updateTemplate = React.useCallback(
    async (id: string, patch: UpdateDisciplineApprovalTemplateDto) => {
      const res = await disciplineApprovalTemplatesApi.update(id, patch);
      await reloadList();
      return res;
    },
    [reloadList],
  );

  const deleteTemplate = React.useCallback(async (id: string) => {
    await disciplineApprovalTemplatesApi.remove(id);
    await reloadList();
  }, [reloadList]);

  return {
    templates,
    violationTypes,
    employees,
    companyId,
    loading,
    pagination,
    listError,
    accessDenied: apiAccessDenied,
    archiveScope,
    setArchiveScope,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
