import type { RecruitmentArchiveScope } from '@/features/hr/recruitment/lib/api/types';

export const RECRUITMENT_ARCHIVE_SCOPE_DEFAULT: RecruitmentArchiveScope = 'active';

export const RECRUITMENT_ARCHIVE_SCOPE_OPTIONS: readonly {
  value: RecruitmentArchiveScope;
  label: string;
}[] = [
  { value: 'active', label: 'غير مؤرشف' },
  { value: 'archived', label: 'مؤرشف' },
  { value: 'all', label: 'الكل' },
];

export function recruitmentListArchiveQuery(
  scope: RecruitmentArchiveScope = RECRUITMENT_ARCHIVE_SCOPE_DEFAULT,
): { archiveScope: RecruitmentArchiveScope } {
  return { archiveScope: scope };
}
