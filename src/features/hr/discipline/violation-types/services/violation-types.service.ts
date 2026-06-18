import {
  violationTypesApi,
  type CreateViolationTypeDto,
  type UpdateViolationTypeDto,
  type ViolationTypeResponseDto,
} from '@/features/hr/discipline/lib/api/violation-types';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import type { HRViolationDeductionKind, HRViolationTypeRecord } from '@/features/hr/discipline/lib/types';
import { parseCoord, toIso } from '@/features/hr/lib/map-dto';

function mapDeductionKind(kind: string | null): HRViolationDeductionKind {
  if (kind === 'amount' || kind === 'hours' || kind === 'day') return kind;
  return 'none';
}

export function mapViolationTypeResponse(dto: ViolationTypeResponseDto): HRViolationTypeRecord {
  return {
    id: dto.id,
    code: dto.code,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? dto.nameAr,
    sortOrder: dto.sortOrder,
    isActive: dto.isActive,
    hasDeduction: dto.hasDeduction,
    deductionKind: mapDeductionKind(dto.deductionKind),
    deductionValue: parseCoord(dto.deductionValue ?? 0),
    needsWarning: dto.needsWarning,
    needsInvestigation: dto.needsInvestigation,
    needsApproval: dto.needsApproval,
    approvalTemplateId: dto.approvalTemplateId,
    updatedAt: toIso(dto.updatedAt),
  };
}

export async function loadViolationTypes() {
  const scope = await resolveOrganizationScope();
  const res = await violationTypesApi.getAll(
    scope.companyId ? { companyId: scope.companyId, limit: 200 } : { limit: 200 },
  );
  return {
    items: res.items.map(mapViolationTypeResponse),
    companyId: scope.companyId ?? res.items[0]?.companyId ?? null,
  };
}

export async function createViolationType(payload: CreateViolationTypeDto) {
  return violationTypesApi.create(payload);
}

export async function updateViolationType(id: string, payload: UpdateViolationTypeDto) {
  return violationTypesApi.update(id, payload);
}

export async function deleteViolationType(id: string) {
  return violationTypesApi.remove(id);
}
