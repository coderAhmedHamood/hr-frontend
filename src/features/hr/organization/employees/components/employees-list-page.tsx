'use client';

import { useEmployeesListModel } from '@/features/hr/organization/employees/hooks/useEmployeesListModel';
import { EmployeesListViews } from '@/features/hr/organization/employees/components/employees-list-views';
import { ForbiddenState } from '@/components/shared/forbidden-state';

export default function EmployeesListPage() {
  const model = useEmployeesListModel();

  if (model.accessDenied) {
    return <ForbiddenState />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EmployeesListViews model={model} />
    </div>
  );
}
