import type { HRDisciplineCircularAudience } from '@/features/hr/discipline/lib/types';
import { CIRCULAR_AUDIENCE_LABELS } from '@/features/hr/discipline/lib/types';

export type CircularDraftAudienceShape = {
  audience: HRDisciplineCircularAudience;
  branchIds: Set<string>;
  departmentIds: Set<string>;
  targetEmployeeIds: Set<string>;
};

export type CircularAudienceLookups = {
  branchNameById?: Record<string, string>;
  departmentNameById?: Record<string, string>;
};

export type BuiltCircularAudience = {
  audienceSummaryAr: string;
  branchIds: string[];
  branchNamesArSnapshot: string;
  departmentIds: string[];
  departmentNamesArSnapshot: string;
  targetEmployeeIds: string[];
};

export function tryBuildCircularAudienceSnapshot(
  draft: CircularDraftAudienceShape,
  lookups?: CircularAudienceLookups,
): { ok: true; data: BuiltCircularAudience } | { ok: false; error: string } {
  switch (draft.audience) {
    case 'all':
      return {
        ok: true,
        data: {
          audienceSummaryAr: CIRCULAR_AUDIENCE_LABELS.all,
          branchIds: [],
          branchNamesArSnapshot: '',
          departmentIds: [],
          departmentNamesArSnapshot: '',
          targetEmployeeIds: [],
        },
      };
    case 'employees': {
      const targetEmployeeIds = [...draft.targetEmployeeIds];
      if (targetEmployeeIds.length === 0) {
        return { ok: false, error: 'اختر موظفاً واحداً على الأقل' };
      }
      return {
        ok: true,
        data: {
          audienceSummaryAr:
            targetEmployeeIds.length === 1 ? 'موظف واحد محدد' : `${targetEmployeeIds.length} موظفين محددين`,
          branchIds: [],
          branchNamesArSnapshot: '',
          departmentIds: [],
          departmentNamesArSnapshot: '',
          targetEmployeeIds,
        },
      };
    }
    case 'branch': {
      const branchIds = [...draft.branchIds];
      if (branchIds.length === 0) {
        return { ok: false, error: 'اختر فرعاً واحداً على الأقل' };
      }
      const bNames = branchIds.map((id) => lookups?.branchNameById?.[id] ?? id);
      const branchNamesArSnapshot = bNames.join('، ');
      const audienceSummaryAr =
        branchIds.length === 1 ? `فرع: ${bNames[0]}` : `فروع (${branchIds.length}): ${branchNamesArSnapshot}`;
      return {
        ok: true,
        data: {
          audienceSummaryAr,
          branchIds,
          branchNamesArSnapshot,
          departmentIds: [],
          departmentNamesArSnapshot: '',
          targetEmployeeIds: [],
        },
      };
    }
    case 'department': {
      const departmentIds = [...draft.departmentIds];
      if (departmentIds.length === 0) {
        return { ok: false, error: 'اختر قسماً واحداً على الأقل' };
      }
      const dNames = departmentIds.map((id) => lookups?.departmentNameById?.[id] ?? id);
      const departmentNamesArSnapshot = dNames.join('، ');
      const audienceSummaryAr =
        departmentIds.length === 1 ? `قسم: ${dNames[0]}` : `أقسام (${departmentIds.length}): ${departmentNamesArSnapshot}`;
      return {
        ok: true,
        data: {
          audienceSummaryAr,
          branchIds: [],
          branchNamesArSnapshot: '',
          departmentIds,
          departmentNamesArSnapshot,
          targetEmployeeIds: [],
        },
      };
    }
    default:
      return {
        ok: true,
        data: {
          audienceSummaryAr: '—',
          branchIds: [],
          branchNamesArSnapshot: '',
          departmentIds: [],
          departmentNamesArSnapshot: '',
          targetEmployeeIds: [],
        },
      };
  }
}
