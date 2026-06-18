import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  employeesApi,
  type CreateEmployeeUserAccountDto,
} from '@/features/hr/organization/employees/lib/api/employees';
import type { UserResponseDto } from '@/features/hr/organization/lib/api/users';
import { resolveEmployeeCompanyId } from '@/features/hr/organization/employees/services/employee-company.service';
import {
  linkedCompanyIdSet,
  pickLinkedCompanyId,
} from '@/features/hr/organization/employees/utils/resolve-linked-company-id';

export async function resolveEmployeeUserAccountCompanyId(employeeId: string): Promise<string> {
  const { accessProfile } = useAuthStore.getState();
  const defaultCompanyId = getDefaultCompanyId();
  const linked = linkedCompanyIdSet(accessProfile?.companies.map((c) => c.companyId) ?? []);

  let assignmentCompanyId: string | null = null;
  try {
    assignmentCompanyId = await resolveEmployeeCompanyId(employeeId);
  } catch {
    assignmentCompanyId = null;
  }

  if (assignmentCompanyId && !linked.has(assignmentCompanyId)) {
    throw new Error(
      'الموظف معيّن لشركة لا يمكنك إدارتها — غيّر الشركة النشطة من القائمة العلوية',
    );
  }

  const resolved = pickLinkedCompanyId(
    [
      assignmentCompanyId,
      defaultCompanyId,
      accessProfile?.defaultCompanyId,
      accessProfile?.companies[0]?.companyId,
    ],
    linked,
  );

  if (!resolved) {
    throw new Error(
      'لا توجد شركة مرتبطة بحسابك — سجّل الخروج وأعد الدخول أو راجع صلاحياتك مع المسؤول',
    );
  }

  return resolved;
}

export async function createEmployeeUserAccount(
  payload: CreateEmployeeUserAccountDto,
): Promise<UserResponseDto> {
  return employeesApi.createUserAccount(payload);
}

export function resolveCreatedUserId(
  response: UserResponseDto | { userId?: string | null; user?: { id?: string } | null; id?: string },
): string | null {
  if ('userId' in response && response.userId) return response.userId;
  if ('user' in response && response.user?.id) return response.user.id;
  return response.id ?? null;
}
