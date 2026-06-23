import {
  checkInPointsApi,
  type CheckInPointResponseDto,
  type CreateCheckInPointDto,
  type UpdateCheckInPointDto,
} from '@/features/hr/attendance/lib/api/check-in-points';
import type { AttendanceCheckInPoint } from '@/features/hr/attendance/lib/types';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import { parseCoord } from '@/features/hr/lib/map-dto';

export function mapCheckInPointResponse(dto: CheckInPointResponseDto): AttendanceCheckInPoint {
  return {
    id: dto.id,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? undefined,
    latitude: parseCoord(dto.latitude),
    longitude: parseCoord(dto.longitude),
    radiusMeters: dto.radiusMeters,
    isActive: dto.isActive,
  };
}

export async function loadCheckInPoints(companyId: string) {
  const res = await checkInPointsApi.getAll({ companyId, limit: 200, ...organizationActiveListStatusQuery() });
  return { items: res.items.map(mapCheckInPointResponse) };
}

export async function createCheckInPoint(payload: CreateCheckInPointDto) {
  return checkInPointsApi.create(payload);
}

export async function updateCheckInPoint(id: string, payload: UpdateCheckInPointDto) {
  return checkInPointsApi.update(id, payload);
}

export async function deleteCheckInPoint(id: string) {
  return checkInPointsApi.remove(id);
}
