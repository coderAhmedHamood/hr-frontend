import type { EmployeeResponseDto } from '@/features/hr/organization/employees/lib/api/employees';
import type { ContractStatus, ContractType } from '@/features/hr/contracts/types';
import {
  CONTRACT_STATUS_AR,
  CONTRACT_TYPE_AR,
} from '@/features/hr/attendance/checkpoint-links/constants/checkpoint-links-panel';

export function employeeSearchHaystack(e: EmployeeResponseDto): string {
  const addressTokens = (e.address ?? '')
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const st = e.contractStatus as ContractStatus;
  const ct = e.contractType as ContractType;
  return [
    e.nameAr,
    e.nameEn,
    e.employeeCode,
    e.email,
    e.phone,
    e.nationality,
    e.position,
    e.address,
    e.nationalId,
    e.contractStatus,
    CONTRACT_STATUS_AR[st] ?? '',
    e.contractType,
    CONTRACT_TYPE_AR[ct] ?? '',
    ...addressTokens,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
