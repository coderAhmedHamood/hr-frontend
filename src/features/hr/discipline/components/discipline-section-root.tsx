'use client';

import type { HRDisciplineSection } from '@/features/hr/discipline/lib/types';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { ViolationTypesClient } from '@/features/hr/discipline/violation-types/components/violation-types-client';
import { DisciplineApprovalClient } from '@/features/hr/discipline/approval-assignment/components/discipline-approval-client';
import { ViolationCasesClient } from '@/features/hr/discipline/violation-cases/components/violation-cases-client';
import { NoticesClient } from '@/features/hr/discipline/notices/components/notices-client';
import { CircularsClient } from '@/features/hr/discipline/circulars/components/circulars-client';
import { InvestigationsClient } from '@/features/hr/discipline/investigations/components/investigations-client';
import { DeductionsClient } from '@/features/hr/discipline/deductions/components/deductions-client';
import { AppealsClient } from '@/features/hr/discipline/appeals/components/appeals-client';
import { DisciplineAuditLogClient } from '@/features/hr/discipline/audit-log/components/discipline-audit-log-client';
interface Props {
  section: HRDisciplineSection;
  titleAr: string;
  titleEn: string;
}

export function HRDisciplineSectionRoot({ section, titleAr }: Props) {
  useSetPageTitle({ titleAr, descriptionAr: 'الانضباط الوظيفي وإدارة المخالفات', iconName: 'ShieldAlert' });
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {section === 'violation-types' && <ViolationTypesClient />}
      {section === 'approval-assignment' && <DisciplineApprovalClient />}
      {section === 'violation-cases' && <ViolationCasesClient />}
      {section === 'notices' && <NoticesClient />}
      {section === 'circulars' && <CircularsClient />}
      {section === 'investigations' && <InvestigationsClient />}
      {section === 'deductions' && <DeductionsClient />}
      {section === 'appeals' && <AppealsClient />}
      {section === 'audit-log' && <DisciplineAuditLogClient />}
    </div>
  );
}
