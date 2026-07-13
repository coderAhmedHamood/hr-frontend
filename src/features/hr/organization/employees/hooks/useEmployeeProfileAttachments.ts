'use client';

import * as React from 'react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  organizationListArchiveQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  employeeAttachmentsApi,
  type EmployeeAttachmentDto,
  type EmployeeAttachmentUploadInput,
} from '@/features/hr/organization/employees/lib/api/employee-attachments';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

export function useEmployeeProfileAttachments(employee: Employee, listEnabled = true) {
  const companyId = useDefaultCompanyId() ?? '';
  const createdBy = useAuthStore((s) => s.user?.email ?? s.accessProfile?.email ?? null);

  const [attachmentsError, setAttachmentsError] = React.useState<string | null>(null);
  const [attachmentsTotal, setAttachmentsTotal] = React.useState(0);
  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );
  const [documentTypeFilter, setDocumentTypeFilter] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [detailAttachment, setDetailAttachment] = React.useState<EmployeeAttachmentDto | null>(null);

  React.useEffect(() => {
    if (!employee.id || !companyId) return;
    let cancelled = false;
    void employeeAttachmentsApi
      .getAll({
        companyId,
        employeeId: employee.id,
        page: 1,
        limit: 1,
        ...organizationListArchiveQuery(ORGANIZATION_ARCHIVE_SCOPE_DEFAULT),
      })
      .then((res) => {
        if (!cancelled) setAttachmentsTotal(res.pagination.total);
      })
      .catch(() => {
        if (!cancelled) setAttachmentsTotal(0);
      });
    return () => { cancelled = true; };
  }, [companyId, employee.id]);

  const loadAttachmentsPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!employee.id || !companyId) {
      return { items: [] as EmployeeAttachmentDto[], total: 0 };
    }

    setAttachmentsError(null);
    try {
      const res = await employeeAttachmentsApi.getAll({
        companyId,
        employeeId: employee.id,
        page,
        limit: pageSize,
        ...organizationListArchiveQuery(archiveScope),
        ...(documentTypeFilter !== 'all' ? { documentType: documentTypeFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
        sortBy: 'createdAt',
        sortDir: 'DESC',
      });
      setAttachmentsTotal(res.pagination.total);
      return { items: res.items, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employee-attachments.load');
      setAttachmentsError(displayMessage);
      return { items: [] as EmployeeAttachmentDto[], total: 0 };
    }
  }, [archiveScope, companyId, documentTypeFilter, employee.id, search]);

  const {
    items: employeeAttachments,
    loading: attachmentsLoading,
    pagination: attachmentsPagination,
    reload: reloadAttachments,
  } = useServerDirectoryPagination<EmployeeAttachmentDto>(loadAttachmentsPage, {
    enabled: listEnabled && !!employee.id && !!companyId,
    resetDeps: [employee.id, companyId, archiveScope, documentTypeFilter, search],
  });

  const uploadAttachment = React.useCallback(
    async (input: Omit<EmployeeAttachmentUploadInput, 'companyId' | 'employeeId' | 'createdBy'>) => {
      if (!companyId) throw new Error('لم يتم تحديد الشركة');
      return employeeAttachmentsApi.upload({
        ...input,
        companyId,
        employeeId: employee.id,
        createdBy,
      });
    },
    [companyId, createdBy, employee.id],
  );

  const hasAttachmentFilters =
    archiveScope !== ORGANIZATION_ARCHIVE_SCOPE_DEFAULT
    || documentTypeFilter !== 'all'
    || search.trim().length > 0;

  return {
    attachmentsCompanyId: companyId,
    employeeAttachments,
    attachmentsLoading,
    attachmentsPagination,
    attachmentsTotal,
    attachmentsError,
    archiveScope,
    setArchiveScope,
    documentTypeFilter,
    setDocumentTypeFilter,
    search,
    setSearch,
    hasAttachmentFilters,
    uploadOpen,
    setUploadOpen,
    detailAttachment,
    setDetailAttachment,
    uploadAttachment,
    reloadAttachments,
  };
}
