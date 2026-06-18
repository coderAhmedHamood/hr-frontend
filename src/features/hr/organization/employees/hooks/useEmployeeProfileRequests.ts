'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  employeeProfileApi,
  type WorkflowRequestSummaryDto,
} from '@/features/hr/organization/employees/lib/api/employee-profile';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

export type RequestStatusFilter = 'all' | WorkflowRequestSummaryDto['status'];

export type EmployeeWorkflowRequest = {
  id: string;
  employeeId: string;
  type: string;
  title: string;
  status: WorkflowRequestSummaryDto['status'];
  submittedAt: string;
  decidedAt: string | null;
  requestTypeNameAr: string;
  subtypeNameAr: string | null;
  requestCategory: string | null;
  sourceTable: string;
};

export type WorkflowRequestsCounts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
};

const EMPTY_COUNTS: WorkflowRequestsCounts = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  cancelled: 0,
};

function mapWorkflowRequest(employeeId: string, row: WorkflowRequestSummaryDto): EmployeeWorkflowRequest {
  return {
    id: row.id,
    employeeId,
    type: row.requestTypeSlug,
    title: row.title,
    status: row.status,
    submittedAt: row.submittedAt,
    decidedAt: row.decidedAt,
    requestTypeNameAr: row.requestTypeNameAr,
    subtypeNameAr: row.subtypeNameAr,
    requestCategory: row.requestCategory,
    sourceTable: row.sourceTable,
  };
}

export function useEmployeeProfileRequests(employee: Employee, listEnabled = true) {
  const [requestsError, setRequestsError] = React.useState<string | null>(null);
  const [requestsCounts, setRequestsCounts] = React.useState<WorkflowRequestsCounts>(EMPTY_COUNTS);
  const [requestStatusFilter, setRequestStatusFilter] = React.useState<RequestStatusFilter>('all');

  React.useEffect(() => {
    if (!employee.id) return;
    let cancelled = false;
    void employeeProfileApi
      .getRequests(employee.id, { page: 1, pageSize: 1 })
      .then((res) => {
        if (!cancelled) setRequestsCounts(res.counts);
      })
      .catch(() => {
        if (!cancelled) setRequestsCounts(EMPTY_COUNTS);
      });
    return () => { cancelled = true; };
  }, [employee.id]);

  const loadRequestsPage = React.useCallback(async (page: number, pageSize: number) => {
    setRequestsError(null);
    try {
      const res = await employeeProfileApi.getRequests(employee.id, {
        page,
        pageSize,
        ...(requestStatusFilter !== 'all' ? { status: requestStatusFilter } : {}),
      });
      setRequestsCounts(res.counts);
      return {
        items: res.submittedRequests.map((row) => mapWorkflowRequest(employee.id, row)),
        total: res.pagination.total,
      };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employee-profile.requests');
      setRequestsError(displayMessage);
      return { items: [] as EmployeeWorkflowRequest[], total: 0 };
    }
  }, [employee.id, requestStatusFilter]);

  const {
    items: employeeRequests,
    loading: requestsLoading,
    pagination: requestsPagination,
    total: requestsTotal,
    reload: reloadRequests,
  } = useServerDirectoryPagination<EmployeeWorkflowRequest>(loadRequestsPage, {
    enabled: listEnabled && !!employee.id,
    resetDeps: [employee.id, requestStatusFilter],
  });

  const hasRequestFilters = requestStatusFilter !== 'all';

  return {
    employeeRequests,
    requestsLoading,
    requestsPagination,
    requestsTotal,
    requestsCounts,
    requestsError,
    requestStatusFilter,
    setRequestStatusFilter,
    hasRequestFilters,
    reloadRequests,
  };
}
