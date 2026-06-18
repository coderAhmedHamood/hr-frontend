import {
  checkInPointLinksApi,
  type CheckInPointLinkResponseDto,
} from '@/features/hr/attendance/lib/api/check-in-point-links';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import type { AttendanceCheckInPointLink } from '@/features/hr/attendance/lib/types';
import { randomUUID } from '@/shared/utils';

export function mapCheckInPointLinkResponse(dto: CheckInPointLinkResponseDto): AttendanceCheckInPointLink {
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    checkInPointId: dto.checkInPointId,
    batchId: dto.batchId ?? undefined,
    effectiveFrom: dto.effectiveFrom ?? undefined,
    linkActive: dto.linkActive,
  };
}

export async function loadCheckInPointLinks() {
  const scope = await resolveOrganizationScope();
  const res = await checkInPointLinksApi.getAll(
    scope.companyId ? { companyId: scope.companyId, limit: 500 } : { limit: 500 },
  );
  return {
    items: res.items.map(mapCheckInPointLinkResponse),
    companyId: scope.companyId ?? res.items[0]?.companyId ?? null,
  };
}

export async function createCheckInPointLinkBatch(input: {
  companyId: string;
  effectiveFrom: string;
  pairs: { employeeId: string; checkInPointId: string }[];
}) {
  const batchId = randomUUID();
  const res = await checkInPointLinksApi.createBulk({
    companyId: input.companyId,
    links: input.pairs,
    batchId,
    effectiveFrom: input.effectiveFrom,
    linkActive: true,
  });
  return res.items.map(mapCheckInPointLinkResponse);
}

export async function deleteCheckInPointLinkBatch(links: AttendanceCheckInPointLink[]) {
  await Promise.all(links.map((l) => checkInPointLinksApi.remove(l.id)));
}
