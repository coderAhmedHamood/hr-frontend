'use client';

import * as React from 'react';
import { Mail, Eye, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ContractTypeLabel, StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell, TableRowActions } from '@/components/ui/table-cells';
import {
  DirectoryGrid,
  DirectoryGridCard,
  DirectoryGridCardFooter,
  DirectoryGridCardHeader,
  DirectoryGridCardMeta,
  DirectoryGridCardMetaRow,
  DirectoryGridCardTitle,
} from '@/components/ui/directory-grid-card';
import { NewEmployeeDrawer } from '@/features/hr/organization/employees/components/new-employee-drawer';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { ConfirmationModal } from '@/components/ui/shared-dialogs';
import { EmptyState } from '@/components/ui/shared-dialogs';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import { formatCurrency, getInitials } from '@/shared/utils';
import type { EmployeesListModel } from '@/features/hr/organization/employees/hooks/useEmployeesListModel';
import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';

type Props = { model: EmployeesListModel };
type FilteredRow = EmployeesListModel['filtered'][number];

export function EmployeesListViews({ model }: Props) {
  const {
    router, employees, filtered, loading, pagination, listError,
    view, newEmpOpen, setNewEmpOpen, pdfOpen, setPdfOpen,
    employeesPrintable, reloadEmployees,
    deleteId, setDeleteId, handleDelete,
  } = model;

  const columns = React.useMemo((): ColumnDef<FilteredRow>[] => [
    {
      key: 'employee',
      title: 'الموظف',
      render: (emp) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 ring-1 ring-border shrink-0">
            <AvatarImage src={emp.avatar ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(emp.nameAr)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate">{emp.nameAr}</p>
            {emp.employeeCode && (
              <p className="text-xs text-muted-foreground truncate font-mono">{emp.employeeCode}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      title: 'المسمى',
      className: 'text-muted-foreground',
      render: (emp) => emp.position ?? '—',
    },
    {
      key: 'contractType',
      title: 'نوع العقد',
      render: (emp) => <ContractTypeLabel type={emp.contractType ?? ''} />,
    },
    {
      key: 'contractStatus',
      title: 'حالة العقد',
      render: (emp) => (
        <StatusBadge status={emp.contractStatus ?? 'active'} className="text-[11px]" />
      ),
    },
    {
      key: 'startDate',
      title: 'تاريخ الالتحاق',
      className: 'text-muted-foreground',
      render: (emp) => <TableDateCell value={emp.startDate} />,
    },
    {
      key: 'nationality',
      title: 'الجنسية',
      className: 'text-muted-foreground',
      render: (emp) => emp.nationality ?? '—',
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'text-start w-16',
      render: (emp) => (
        <TableRowActions
          menuItems={[
            { label: 'حذف', onClick: (e) => { e.stopPropagation(); setDeleteId(emp.id); }, destructive: true },
          ]}
        />
      ),
    },
  ], [setDeleteId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-muted/30" />
        ))}
      </div>
    );
  }

  if (listError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {listError}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 animate-fade-in">
      <PdfPreviewExportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title="معاينة تصدير سجل الموظفين"
        fileName="employees-register.pdf"
        printable={employeesPrintable}
      />
      <NewEmployeeDrawer open={newEmpOpen} onOpenChange={setNewEmpOpen} onCreated={reloadEmployees} />

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="حذف الموظف"
        description="هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="لا توجد نتائج — جرّب تعديل الفلاتر" />
      ) : (
        <DirectoryPagedViews
          items={filtered}
          serverPagination={pagination}
          loading={loading}
        >
          {(pageItems) => view === 'table' ? (
        <DataTable
          variant="directory"
          alwaysShowTable
          columns={columns}
          data={pageItems}
          keyExtractor={(emp) => emp.id}
          onRowClick={(emp) => router.push(hrOrganizationRoutes.employee(emp.id))}
        />
      ) : (
        <DirectoryGrid>
          {pageItems.map((emp) => (
            <EmployeeGridCard
              key={emp.id}
              emp={emp}
              onOpen={() => router.push(hrOrganizationRoutes.employee(emp.id))}
              onDelete={() => setDeleteId(emp.id)}
            />
          ))}
        </DirectoryGrid>
      )}
        </DirectoryPagedViews>
      )}
    </div>
  );
}

function EmployeeGridCard({
  emp,
  onOpen,
  onDelete,
}: {
  emp: FilteredRow;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <DirectoryGridCard interactive onClick={onOpen}>
      <DirectoryGridCardHeader>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 ring-1 ring-border shrink-0">
            <AvatarImage src={emp.avatar ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(emp.nameAr)}</AvatarFallback>
          </Avatar>
          <DirectoryGridCardTitle className="truncate">{emp.nameAr}</DirectoryGridCardTitle>
        </div>
        {emp.nationality && (
          <span className="shrink-0 text-[10px] text-muted-foreground">{emp.nationality}</span>
        )}
      </DirectoryGridCardHeader>
      <DirectoryGridCardMeta>
        <DirectoryGridCardMetaRow>
          <span className="text-muted-foreground">الكود</span>
          <span className="font-mono text-xs">{emp.employeeCode}</span>
        </DirectoryGridCardMetaRow>
        {emp.position && (
          <DirectoryGridCardMetaRow>
            <span className="text-muted-foreground">المسمى</span>
            <span className="truncate">{emp.position}</span>
          </DirectoryGridCardMetaRow>
        )}
        {emp.contractStatus && (
          <DirectoryGridCardMetaRow>
            <span className="text-muted-foreground">حالة العقد</span>
            <StatusBadge status={emp.contractStatus} className="text-[10px]" />
          </DirectoryGridCardMetaRow>
        )}
        {emp.email && (
          <DirectoryGridCardMetaRow dir="ltr">
            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{emp.email}</span>
          </DirectoryGridCardMetaRow>
        )}
      </DirectoryGridCardMeta>
      <DirectoryGridCardFooter>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض" onClick={onOpen}><Eye className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="حذف" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </DirectoryGridCardFooter>
    </DirectoryGridCard>
  );
}
