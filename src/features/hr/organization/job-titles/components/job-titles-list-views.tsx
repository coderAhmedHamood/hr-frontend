'use client';

import * as React from 'react';
import { Briefcase, Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableRowActions } from '@/components/ui/table-cells';
import {
  DirectoryGrid,
  DirectoryGridCard,
  DirectoryGridCardFooter,
  DirectoryGridCardHeader,
  DirectoryGridCardTitle,
} from '@/components/ui/directory-grid-card';
import { EmptyState } from '@/components/ui/shared-dialogs';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import type { JobTitlesDirectoryModel } from '@/features/hr/organization/job-titles/hooks/useJobTitlesDirectoryModel';
import type { JobTitleTemplateRecord } from '@/features/hr/organization/job-titles/services/job-titles.service';

export function JobTitlesListViews({ model }: { model: JobTitlesDirectoryModel }) {
  const { templates, layoutView, pagination, loading, setViewRow, openEdit, setConfirmId, companyLabel, perms } = model;

  const columns = React.useMemo((): ColumnDef<JobTitleTemplateRecord>[] => [
    {
      key: 'company',
      title: 'الشركة',
      className: 'text-muted-foreground',
      render: (row) => companyLabel(row.companyId),
    },
    {
      key: 'titleAr',
      title: 'المسمى الوظيفي',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.titleAr}</span>
        </div>
      ),
    },
    {
      key: 'description',
      title: 'وصف',
      className: 'max-w-[200px] truncate text-muted-foreground',
      render: (row) => row.descriptionAr ?? '—',
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
  ], [companyLabel, openEdit, perms.canDelete, perms.canUpdate, setConfirmId]);

  return (
    <DirectoryPagedViews
      items={templates}
      serverPagination={pagination}
      loading={loading}
      empty={<EmptyState icon={Briefcase} title="لا توجد قوالب" description="أضف مسميات وظيفية شائعة في شركتك." />}
    >
      {(pageItems) => layoutView === 'grid' ? (
        <DirectoryGrid>
          {pageItems.map((row) => (
            <DirectoryGridCard key={row.id} interactive onClick={() => setViewRow(row)}>
              <DirectoryGridCardHeader>
                <DirectoryGridCardTitle className="leading-snug">{row.titleAr}</DirectoryGridCardTitle>
                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </DirectoryGridCardHeader>
              {row.descriptionAr ? <p className="  text-xs text-muted-foreground">{row.descriptionAr}</p> : null}
              <p className="text-[10px] text-muted-foreground">{companyLabel(row.companyId)}</p>
              <DirectoryGridCardFooter>
                {row.isActive ? (
                  <Badge variant="outline" className="text-[10px]">نشط</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-destructive">غير نشط</Badge>
                )}
                <div className="ms-auto flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض" onClick={() => setViewRow(row)}><Eye className="h-4 w-4" /></Button>
                  {perms.canUpdate ? (
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="تعديل" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                  ) : null}
                  {perms.canDelete ? (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="حذف" onClick={() => setConfirmId(row.id)}><Trash2 className="h-4 w-4" /></Button>
                  ) : null}
                </div>
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
