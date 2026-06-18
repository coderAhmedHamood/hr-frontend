'use client';

import * as React from 'react';
import { UserCircle, Eye, Pencil, Trash2 } from 'lucide-react';
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
import { EmptyState } from '@/features/hr/requests/components/shared-ui';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import { USER_TYPE_LABELS } from '@/features/hr/organization/contacts/hooks/useContactsDirectoryModel';
import type { UserRecord, ContactsDirectoryModel } from '@/features/hr/organization/contacts/hooks/useContactsDirectoryModel';

type Props = { model: ContactsDirectoryModel };

function statusBadge(user: UserRecord) {
  if (!user.isActive) return <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">غير نشط</Badge>;
  if (!user.canSignIn) return <Badge variant="outline" className="text-[10px]">لا يمكن الدخول</Badge>;
  return <Badge variant="outline" className="text-[10px] border-success/40 text-success dark:text-success">نشط</Badge>;
}

function primaryCompanyLabel(row: UserRecord, model: ContactsDirectoryModel) {
  const link = row.companies.find((c) => c.isDefault) ?? row.companies[0];
  if (link) return model.companyLinkLabel(link);
  if (row.defaultCompanyId) {
    const c = model.companies.find((x) => x.id === row.defaultCompanyId);
    return c?.nameAr ?? row.defaultCompanyId.slice(0, 8);
  }
  return '—';
}

function primaryBranchLabel(row: UserRecord, model: ContactsDirectoryModel) {
  const link = row.branches.find((b) => b.isDefault) ?? row.branches[0];
  if (link) return model.branchLinkLabel(link);
  if (row.defaultBranchId) {
    const b = model.branches.find((x) => x.id === row.defaultBranchId);
    return b?.nameAr ?? row.defaultBranchId.slice(0, 8);
  }
  return '—';
}

export function ContactsListViews({ model }: Props) {
  const { users, loading, pagination, listError, layoutView, setViewRow, openEdit, setConfirmId, formatDate } = model;

  const columns = React.useMemo((): ColumnDef<UserRecord>[] => [
    {
      key: 'name',
      title: 'الاسم',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.fullNameAr ?? row.email}</span>
        </div>
      ),
    },
    {
      key: 'email',
      title: 'البريد',
      className: 'text-muted-foreground',
      render: (row) => <span dir="ltr">{row.email}</span>,
    },
    {
      key: 'userType',
      title: 'النوع',
      render: (row) => (
        <Badge variant="outline" className="text-[10px]">
          {USER_TYPE_LABELS[row.userType ?? ''] ?? row.userType ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'company',
      title: 'الشركة',
      className: 'text-muted-foreground text-xs',
      render: (row) => primaryCompanyLabel(row, model),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => statusBadge(row),
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'text-start w-16',
      render: (row) => (
        <TableRowActions
          menuItems={[
            { label: 'عرض التفاصيل', onClick: (e) => { e.stopPropagation(); setViewRow(row); } },
            { label: 'تعديل', onClick: (e) => { e.stopPropagation(); openEdit(row); } },
            { label: 'حذف', onClick: (e) => { e.stopPropagation(); setConfirmId(row.id); }, destructive: true, separator: true },
          ]}
        />
      ),
    },
  ], [formatDate, model, openEdit, setConfirmId, setViewRow]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl border border-border bg-muted/30" />
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
    <DirectoryPagedViews
      items={users}
      serverPagination={pagination}
      loading={loading}
      empty={<EmptyState icon={UserCircle} title="لا توجد مستخدمون" description="أضف حسابات مستخدمي النظام." />}
    >
      {(pageItems) => layoutView === 'grid' ? (
        <DirectoryGrid>
          {pageItems.map((row) => (
            <UserGridCard
              key={row.id}
              row={row}
              model={model}
              onOpen={() => setViewRow(row)}
              onEdit={() => openEdit(row)}
              onDelete={() => setConfirmId(row.id)}
            />
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

function UserGridCard({
  row,
  model,
  onOpen,
  onEdit,
  onDelete,
}: {
  row: UserRecord;
  model: ContactsDirectoryModel;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DirectoryGridCard interactive onClick={onOpen}>
      <DirectoryGridCardHeader>
        <DirectoryGridCardTitle>{row.fullNameAr ?? row.email}</DirectoryGridCardTitle>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {USER_TYPE_LABELS[row.userType ?? ''] ?? row.userType ?? '—'}
        </Badge>
      </DirectoryGridCardHeader>
      <DirectoryGridCardMeta>
        <DirectoryGridCardMetaRow dir="ltr">
          <span className="text-muted-foreground">البريد</span>
          <span className="truncate">{row.email}</span>
        </DirectoryGridCardMetaRow>
        <DirectoryGridCardMetaRow>
          <span className="text-muted-foreground">الشركة</span>
          <span className="truncate">{primaryCompanyLabel(row, model)}</span>
        </DirectoryGridCardMetaRow>
        <DirectoryGridCardMetaRow>
          <span className="text-muted-foreground">الفرع</span>
          <span className="truncate">{primaryBranchLabel(row, model)}</span>
        </DirectoryGridCardMetaRow>
        <DirectoryGridCardMetaRow>
          <span className="text-muted-foreground">الإسناد</span>
          <span>{row.companies.length} شركة · {row.branches.length} فرع</span>
        </DirectoryGridCardMetaRow>
      </DirectoryGridCardMeta>
      <DirectoryGridCardFooter>
        {statusBadge(row)}
        <div className="ms-auto flex gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض" onClick={onOpen}><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="تعديل" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="حذف" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </DirectoryGridCardFooter>
    </DirectoryGridCard>
  );
}
