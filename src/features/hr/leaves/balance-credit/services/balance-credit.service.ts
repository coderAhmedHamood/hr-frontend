import {
  balanceCreditsApi,
  type BalanceCreditRequestResponseDto,
  type BalanceCreditStatus,
  type CreateBalanceCreditRequestDto,
  type CreateBulkBalanceCreditRequestDto,
} from '@/features/hr/leaves/balance-credit/lib/api/balance-credits';
import { employeeLeaveBalancesApi } from '@/features/hr/leaves/balance-credit/lib/api/employee-leave-balances';
import {
  leaveTypeNameAr,
  loadCompanyLeaveTypes,
  resolveDefaultLeaveTypeId,
} from '@/features/hr/leaves/lib/leave-types-utils';
import type { LeaveTypeResponseDto } from '@/features/hr/leaves/leave-types/lib/api/leave-types';
import type {
  BalanceCreditEmployeeOption,
  BalanceCreditFilterOption,
  LeaveBalanceCreditRequest,
} from '@/features/hr/leaves/balance-credit/types';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi } from '@/features/hr/organization/lib/api/departments';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { mapEmployeesToPickerOptions } from '@/features/hr/lib/use-employee-filter-picker';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import { toIso } from '@/features/hr/lib/map-dto';

export type LoadBalanceCreditParams = {
  employeeId?: string;
  status?: BalanceCreditStatus;
};

export function mapBalanceCreditResponse(
  dto: BalanceCreditRequestResponseDto,
  employeeNames: Map<string, string>,
  leaveTypes: LeaveTypeResponseDto[],
): LeaveBalanceCreditRequest {
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    employeeNameAr: employeeNames.get(dto.employeeId) ?? dto.employeeId,
    leaveTypeId: dto.leaveTypeId,
    leaveTypeNameAr: leaveTypeNameAr(leaveTypes, dto.leaveTypeId),
    daysAdded: dto.daysAdded,
    reasonAr: dto.reasonAr ?? '',
    status: dto.status,
    createdAt: toIso(dto.createdAt),
    decidedAt: dto.decidedAt ? toIso(dto.decidedAt) : undefined,
  };
}

export async function loadBalanceCreditDirectory(params?: LoadBalanceCreditParams) {
  const scope = await resolveOrganizationScope();
  const companyId = scope.companyId;

  const listQuery = companyId ? { companyId, limit: 1000 } : { limit: 1000 };

  const [creditsRes, typesRes, balancesRes, employeesRes, branchesRes, departmentsRes] =
    await Promise.all([
      balanceCreditsApi.getAll({ ...(companyId ? { companyId } : {}), limit: 1000, ...(params?.employeeId ? { employeeId: params.employeeId } : {}), ...(params?.status ? { status: params.status } : {}) }),
      loadCompanyLeaveTypes(companyId ? { companyId, limit: 200, isActive: true } : { limit: 200, isActive: true }),
      employeeLeaveBalancesApi.getAll(listQuery),
      employeesApi.getAll({ ...listQuery, ...organizationActiveListStatusQuery() }),
      companyId ? branchesApi.getAll({ companyId, limit: 100, ...organizationActiveListStatusQuery() }) : branchesApi.getAll({ limit: 100, ...organizationActiveListStatusQuery() }),
      companyId ? departmentsApi.getAll({ companyId, limit: 200, ...organizationActiveListStatusQuery() }) : departmentsApi.getAll({ limit: 200, ...organizationActiveListStatusQuery() }),
    ]);

  const credits = ensurePaginatedResult(creditsRes);
  const types = { items: typesRes.items, pagination: typesRes.pagination };
  const balances = ensurePaginatedResult(balancesRes);
  const employees = ensurePaginatedResult(employeesRes);
  const branches = ensurePaginatedResult(branchesRes);
  const departments = ensurePaginatedResult(departmentsRes);

  const employeeNames = new Map(
    employees.items.map((e) => [e.id, e.nameAr?.trim() || e.nameEn?.trim() || '—'] as const),
  );

  const employeeOptions: BalanceCreditEmployeeOption[] = employees.items.map((e) => ({
    id: e.id,
    name: e.nameAr?.trim() || e.nameEn?.trim() || '—',
    branchId: e.branchId ?? undefined,
    departmentId: e.departmentId ?? undefined,
  }));

  const employeePickerOptions = mapEmployeesToPickerOptions(employees.items);

  const branchOptions: BalanceCreditFilterOption[] = [
    { value: 'all', label: 'جميع الفروع' },
    ...branches.items.map((b) => ({ value: b.id, label: b.nameAr })),
  ];

  const departmentOptions: BalanceCreditFilterOption[] = [
    { value: 'all', label: 'جميع الأقسام' },
    ...departments.items.map((d) => ({ value: d.id, label: d.nameAr })),
  ];

  const leaveTypes = types.items;
  const defaultLeaveTypeId = typesRes.defaultLeaveTypeId ?? resolveDefaultLeaveTypeId(leaveTypes);

  const balancesByEmployeeType: Record<string, Record<string, { used: number; total: number }>> = {};
  for (const group of balances.items) {
    balancesByEmployeeType[group.employeeId] ??= {};
    for (const row of group.leaveTypes) {
      balancesByEmployeeType[group.employeeId][row.leaveTypeId] = {
        used: row.usedDays,
        total: row.totalDays,
      };
    }
  }

  return {
    companyId,
    leaveTypes,
    defaultLeaveTypeId,
    defaultLeaveTypeNameAr: leaveTypeNameAr(leaveTypes, defaultLeaveTypeId),
    creditRequests: credits.items.map((row) => mapBalanceCreditResponse(row, employeeNames, leaveTypes)),
    balancesByEmployeeType,
    employeeOptions,
    employeePickerOptions,
    branchOptions,
    departmentOptions,
    employeeById: new Map(employeeOptions.map((e) => [e.id, e])),
  };
}

export async function createBalanceCreditRequest(payload: CreateBalanceCreditRequestDto) {
  return balanceCreditsApi.create(payload);
}

export async function createBulkBalanceCreditRequest(payload: CreateBulkBalanceCreditRequestDto) {
  return balanceCreditsApi.bulkCreate(payload);
}

export async function approveBalanceCreditRequest(id: string) {
  return balanceCreditsApi.update(id, { status: 'approved' });
}

export async function rejectBalanceCreditRequest(id: string) {
  return balanceCreditsApi.update(id, { status: 'rejected' });
}

