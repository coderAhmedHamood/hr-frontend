'use client';

import * as React from 'react';
import { Mail, MapPin, Phone, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DirectoryGridCard,
  DirectoryGridCardHeader,
  DirectoryGridCardMeta,
  DirectoryGridCardMetaRow,
  DirectoryGridCardTitle,
} from '@/components/ui/directory-grid-card';
import { type ColumnDef } from '@/components/ui/data-table';
import { TableRowActions } from '@/components/ui/table-cells';
import { AccountingDirectoryCardActions } from '@/features/accounting/_shared/components/accounting-directory-card-actions';
import { AccountingDirectoryViews } from '@/features/accounting/_shared/components/accounting-directory-views';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import type { Customer } from '@/features/accounting/domain/types/customer';
import type { CustomersDirectoryModel } from '@/features/accounting/customers/hooks/useCustomersDirectoryModel';

export function CustomersListViews({ model }: { model: CustomersDirectoryModel }) {
  const { customers, view, router, removeCustomer, resetDeps, t } = model;

  const columns = React.useCallback((requestDelete: (id: string) => void): ColumnDef<Customer>[] => [
    {
      key: 'customer',
      title: t.customers.name,
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 ring-1 ring-border">
            <AvatarFallback>{item.name.trim().charAt(0) || '—'}</AvatarFallback>
          </Avatar>
          <span className="truncate font-semibold">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      title: t.customers.type,
      render: (item) => item.type === 'company' ? t.customers.company : t.customers.person,
    },
    {
      key: 'email',
      title: t.customers.email,
      className: 'text-muted-foreground',
      render: (item) => <span dir="ltr">{item.email || '—'}</span>,
    },
    {
      key: 'phone',
      title: t.customers.phone,
      className: 'text-muted-foreground',
      render: (item) => <span dir="ltr">{item.phone || '—'}</span>,
    },
    {
      key: 'country',
      title: t.customers.country,
      className: 'text-muted-foreground',
      render: (item) => item.country || '—',
    },
    {
      key: 'actions',
      title: t.common.actions,
      isActions: true,
      headerClassName: 'text-start w-16',
      render: (item) => (
        <TableRowActions
          menuItems={[{
            label: t.common.delete,
            destructive: true,
            onClick: () => requestDelete(item.id),
          }]}
        />
      ),
    },
  ], [t]);

  return (
    <AccountingDirectoryViews
      items={customers}
      view={view}
      columns={columns}
      getId={(item) => item.id}
      onOpen={(item) => router.push(accountingRoutes.customerDetail(item.id))}
      onDelete={removeCustomer}
      emptyIcon={Users}
      emptyTitle={t.common.noResults}
      deleteTitle={t.customers.deleteTitle}
      deleteDescription={t.customers.deleteDescription}
      deleteConfirmLabel={t.common.delete}
      resetDeps={resetDeps}
      renderCard={(item, actions) => (
        <DirectoryGridCard interactive onClick={actions.open}>
          <DirectoryGridCardHeader>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-9 w-9 ring-1 ring-border">
                <AvatarFallback>{item.name.trim().charAt(0) || '—'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <DirectoryGridCardTitle>{item.name}</DirectoryGridCardTitle>
                <p className="text-[11px] text-muted-foreground">
                  {item.type === 'company' ? t.customers.company : t.customers.person}
                </p>
              </div>
            </div>
          </DirectoryGridCardHeader>
          <DirectoryGridCardMeta>
            {item.email ? (
              <DirectoryGridCardMetaRow dir="ltr">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{item.email}</span>
              </DirectoryGridCardMetaRow>
            ) : null}
            {item.phone ? (
              <DirectoryGridCardMetaRow dir="ltr">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{item.phone}</span>
              </DirectoryGridCardMetaRow>
            ) : null}
            {item.country ? (
              <DirectoryGridCardMetaRow>
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{item.country}</span>
              </DirectoryGridCardMetaRow>
            ) : null}
          </DirectoryGridCardMeta>
          <AccountingDirectoryCardActions
            onOpen={actions.open}
            onDelete={actions.requestDelete}
            openLabel={t.common.open}
            deleteLabel={t.common.delete}
          />
        </DirectoryGridCard>
      )}
    />
  );
}
