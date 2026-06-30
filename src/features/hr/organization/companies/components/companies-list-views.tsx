'use client';

import * as React from 'react';
import { Building2, Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableRowActions } from '@/components/ui/table-cells';
import {
  DirectoryGrid,
  DirectoryGridCard,
  DirectoryGridCardFooter,
  DirectoryGridCardHeader,
  DirectoryGridCardMeta,
  DirectoryGridCardMetaRow,
  DirectoryGridCardTitle,
} from '@/components/ui/directory-grid-card';
import { EmptyState } from '@/components/ui/shared-dialogs';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import type { CompanyRow } from '@/features/hr/organization/companies/constants/companies-directory';
import type { CompaniesDirectoryModel } from '@/features/hr/organization/companies/hooks/useCompaniesDirectoryModel';

export function CompaniesListViews({ model }: { model: CompaniesDirectoryModel }) {
  const { companies, layoutView, pagination, loading, setViewRow, openEdit, setConfirmId, perms } = model;

  const columns = React.useMemo((): ColumnDef<CompanyRow>[] => [
    {
      key: 'name',
      title: 'الشركة',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.nameAr}</span>
        </div>
      ),
    },
    {
      key: 'city',
      title: 'المدينة',
      className: 'text-muted-foreground',
      render: (row) => row.city ?? '—',
    },
    {
      key: 'contact',
      title: 'التواصل',
      className: 'text-muted-foreground text-xs',
      render: (row) => <span dir="ltr">{row.email ?? row.phone ?? '—'}</span>,
    },
    {
      key: 'cr',
      title: 'السجل التجاري',
      className: 'text-muted-foreground text-xs',
      render: (row) => <span dir="ltr">{row.commercialRegistrationNo ?? '—'}</span>,
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => (
        row.isActive ? (
          <Badge variant="outline" className="text-[10px] border-success/40 text-success">نشط</Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">غير نشط</Badge>
        )
      ),
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'text-start w-16',
      render: (row) => (
        <TableRowActions
          menuItems={[
            ...(perms.canUpdate
              ? [{ label: 'تعديل', onClick: (e: React.MouseEvent) => { e.stopPropagation(); openEdit(row); } }]
              : []),
            ...(perms.canDelete
              ? [{
                  label: 'حذف',
                  onClick: (e: React.MouseEvent) => { e.stopPropagation(); setConfirmId(row.id); },
                  destructive: true,
                  separator: true,
                }]
              : []),
          ]}
        />
      ),
    },
  ], [openEdit, perms.canDelete, perms.canUpdate, setConfirmId]);

  if (!loading && companies.length === 0) {
    return <EmptyState icon={Building2} title="لا توجد شركات" description="أضف شركة جديدة للبدء." />;
  }

  return (
    <DirectoryPagedViews
      items={companies}
      serverPagination={pagination}
      loading={loading}
    >
      {(pageItems) => layoutView === 'grid' ? (
    <DirectoryGrid>
      {pageItems.map((row) => (
        <DirectoryGridCard key={row.id} interactive onClick={() => setViewRow(row)}>
          <DirectoryGridCardHeader>
            <DirectoryGridCardTitle>{row.nameAr}</DirectoryGridCardTitle>
            {row.isActive ? (
              <Badge variant="outline" className="text-[10px]">نشط</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-destructive">غير نشط</Badge>
            )}
          </DirectoryGridCardHeader>
          <DirectoryGridCardMeta>
            <DirectoryGridCardMetaRow dir="ltr">
              <span className="text-muted-foreground">الرمز</span>
              <span>{row.code}</span>
            </DirectoryGridCardMetaRow>
            {row.city && (
              <DirectoryGridCardMetaRow>
                <span className="text-muted-foreground">المدينة</span>
                <span>{row.city}</span>
              </DirectoryGridCardMetaRow>
            )}
          </DirectoryGridCardMeta>
          <DirectoryGridCardFooter>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewRow(row)}><Eye className="h-4 w-4" /></Button>
            {perms.canUpdate ? (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
            ) : null}
            {perms.canDelete ? (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setConfirmId(row.id)}><Trash2 className="h-4 w-4" /></Button>
            ) : null}
          </DirectoryGridCardFooter>
        </DirectoryGridCard>
      ))}
    </DirectoryGrid>
  ) : (
    <DataTable
      variant="directory"
      alwaysShowTable
      columns={columns}
      data={pageItems}
      keyExtractor={(row) => row.id}
      onRowClick={(row) => setViewRow(row)}
    />
  )}
    </DirectoryPagedViews>
  );
}
