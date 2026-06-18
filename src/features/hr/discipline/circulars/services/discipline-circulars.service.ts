import type {
  HRDisciplineCircularAudience,
  HRDisciplineCircularRecord,
} from '@/features/hr/discipline/lib/types';
import { CIRCULAR_AUDIENCE_LABELS } from '@/features/hr/discipline/lib/types';
import { toIso } from '@/features/hr/lib/map-dto';
import {
  disciplineCircularsApi,
  type CircularAudienceTypeDto,
  type CreateDisciplineCircularDto,
  type DisciplineCircularResponseDto,
  type UpdateDisciplineCircularDto,
} from '@/features/hr/discipline/lib/api/discipline-circulars';

export type CircularNameLookup = {
  branchNameById?: Record<string, string>;
  departmentNameById?: Record<string, string>;
};

export function mapCircularAudienceType(
  dtoType: CircularAudienceTypeDto,
): HRDisciplineCircularAudience {
  switch (dtoType) {
    case 'all_employees':
      return 'all';
    case 'specific_employees':
      return 'employees';
    case 'branches':
      return 'branch';
    case 'departments':
      return 'department';
    default:
      return 'all';
  }
}

export function toCircularAudienceType(
  audience: HRDisciplineCircularAudience,
): CircularAudienceTypeDto {
  switch (audience) {
    case 'employees':
      return 'specific_employees';
    case 'branch':
      return 'branches';
    case 'department':
      return 'departments';
    case 'all':
    default:
      return 'all_employees';
  }
}

function buildAudienceSummary(
  audience: HRDisciplineCircularAudience,
  branchIds: string[],
  departmentIds: string[],
  targetEmployeeIds: string[],
  lookup?: CircularNameLookup,
) {
  if (audience === 'all') {
    return {
      audienceSummaryAr: CIRCULAR_AUDIENCE_LABELS.all,
      branchNamesArSnapshot: '',
      departmentNamesArSnapshot: '',
    };
  }

  if (audience === 'employees') {
    const count = targetEmployeeIds.length;
    return {
      audienceSummaryAr: count === 1 ? 'موظف واحد محدد' : `${count} موظفين محددين`,
      branchNamesArSnapshot: '',
      departmentNamesArSnapshot: '',
    };
  }

  if (audience === 'branch') {
    const names = branchIds.map(
      (id) => lookup?.branchNameById?.[id] ?? id,
    );
    const branchNamesArSnapshot = names.join('، ');
    const audienceSummaryAr =
      names.length === 1
        ? `فرع: ${names[0]}`
        : `فروع (${names.length}): ${branchNamesArSnapshot}`;
    return { audienceSummaryAr, branchNamesArSnapshot, departmentNamesArSnapshot: '' };
  }

  const names = departmentIds.map(
    (id) => lookup?.departmentNameById?.[id] ?? id,
  );
  const departmentNamesArSnapshot = names.join('، ');
  const audienceSummaryAr =
    names.length === 1
      ? `قسم: ${names[0]}`
      : `أقسام (${names.length}): ${departmentNamesArSnapshot}`;
  return { audienceSummaryAr, branchNamesArSnapshot: '', departmentNamesArSnapshot };
}

export function mapDisciplineCircularResponse(
  dto: DisciplineCircularResponseDto,
  lookup?: CircularNameLookup,
): HRDisciplineCircularRecord {
  const audience = mapCircularAudienceType(dto.audienceType);
  const targetIds = dto.audienceTargetIds ?? [];
  const branchIds = audience === 'branch' ? targetIds : [];
  const departmentIds = audience === 'department' ? targetIds : [];
  const targetEmployeeIds = audience === 'employees' ? targetIds : [];
  const summary = buildAudienceSummary(
    audience,
    branchIds,
    departmentIds,
    targetEmployeeIds,
    lookup,
  );

  return {
    id: dto.id,
    date: dto.issueDate,
    titleAr: dto.titleAr ?? '',
    bodyAr: dto.bodyAr,
    audience,
    targetEmployeeIds,
    branchIds,
    branchNamesArSnapshot: summary.branchNamesArSnapshot,
    departmentIds,
    departmentNamesArSnapshot: summary.departmentNamesArSnapshot,
    audienceSummaryAr: summary.audienceSummaryAr,
    sentAt: dto.sentAt ? toIso(dto.sentAt) : null,
    createdAt: toIso(dto.createdAt),
  };
}

export async function createDisciplineCircular(payload: CreateDisciplineCircularDto) {
  return disciplineCircularsApi.create(payload);
}

export async function updateDisciplineCircular(
  id: string,
  payload: UpdateDisciplineCircularDto,
) {
  return disciplineCircularsApi.update(id, payload);
}

export async function deleteDisciplineCircular(id: string) {
  return disciplineCircularsApi.remove(id);
}

export async function sendDisciplineCircular(id: string) {
  return disciplineCircularsApi.send(id);
}
