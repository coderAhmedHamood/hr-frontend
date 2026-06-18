import type { Employee } from '@/features/hr/organization/employees/types';
import type { UpdateEmployeeDto } from '@/features/hr/organization/employees/lib/api/employees';

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** PATCH /hr/employees/{id} — personal tab fields only (matches backend schema). */
export function buildPersonalEmployeeUpdatePayload(draft: Employee): UpdateEmployeeDto {
  return {
    nameAr: draft.name?.trim() || undefined,
    email: emptyToNull(draft.email),
    phone: emptyToNull(draft.phone),
    nationalId: emptyToNull(draft.nationalId),
    nationality: emptyToNull(draft.nationality),
    address: emptyToNull(draft.address),
    gender: draft.gender || null,
    birthDate: draft.birthDate || null,
    maritalStatus: draft.maritalStatus || null,
  };
}
