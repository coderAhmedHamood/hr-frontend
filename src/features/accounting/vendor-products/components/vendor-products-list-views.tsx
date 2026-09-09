'use client';

import * as React from 'react';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { formatAccountingAmount } from '@/features/accounting/_shared/lib/format-accounting-amount';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import type { AccountingProduct } from '@/features/accounting/domain/types/accounting-product';
import type { VendorProductsDirectoryModel } from '@/features/accounting/vendor-products/hooks/useVendorProductsDirectoryModel';
import { formatNumber } from '@/shared/utils';

export function VendorProductsListViews({ model }: { model: VendorProductsDirectoryModel }) {
  const { products, view, router, deleteProduct, resetDeps, t } = model;
  const typeLabel = React.useCallback((item: AccountingProduct) => {
    if (item.type === 'product') return t.products.product;
    if (item.type === 'service') return t.products.service;
    return t.products.consumable;
  }, [t.products]);

  const columns = React.useCallback((requestDelete: (id: string) => void): ColumnDef<AccountingProduct>[] => [
    {
      key: 'product',
      title: t.products.name,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Package className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{item.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {item.internalReference || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      title: t.products.type,
      render: (item) => <Badge variant={item.type === 'service' ? 'gold' : 'subtle'}>{typeLabel(item)}</Badge>,
    },
    {
      key: 'category',
      title: t.products.category,
      className: 'text-muted-foreground',
      render: (item) => item.category,
    },
    {
      key: 'sale-price',
      title: t.products.salePrice,
      render: (item) => <span dir="ltr" className="font-mono">{formatAccountingAmount(item.salesPrice, 'SAR')}</span>,
    },
    {
      key: 'cost',
      title: t.products.cost,
      className: 'text-muted-foreground',
      render: (item) => <span dir="ltr" className="font-mono">{formatAccountingAmount(item.cost, 'SAR')}</span>,
    },
    {
      key: 'on-hand',
      title: t.products.onHand,
      render: (item) => item.type === 'product' ? (
        <span dir="ltr">{formatNumber(item.onHandQty ?? 0)} {item.uom}</span>
      ) : '—',
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
  ], [t, typeLabel]);

  return (
    <AccountingDirectoryViews
      items={products}
      view={view}
      columns={columns}
      getId={(item) => item.id}
      onOpen={(item) => router.push(accountingRoutes.vendorProductDetail(item.id))}
      onDelete={deleteProduct}
      emptyIcon={Package}
      emptyTitle={t.common.noResults}
      deleteTitle={t.vendorProducts.deleteTitle}
      deleteDescription={t.vendorProducts.deleteDescription}
      deleteConfirmLabel={t.common.delete}
      resetDeps={resetDeps}
      renderCard={(item, actions) => (
        <DirectoryGridCard interactive onClick={actions.open}>
          <DirectoryGridCardHeader>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DirectoryGridCardTitle>{item.name}</DirectoryGridCardTitle>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {item.internalReference || '—'}
                </p>
              </div>
            </div>
            <Badge variant={item.type === 'service' ? 'gold' : 'subtle'}>{typeLabel(item)}</Badge>
          </DirectoryGridCardHeader>
          <DirectoryGridCardMeta>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.products.category}</span>
              <span className="truncate">{item.category}</span>
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.products.salePrice}</span>
              <span dir="ltr" className="font-mono font-semibold">{formatAccountingAmount(item.salesPrice, 'SAR')}</span>
            </DirectoryGridCardMetaRow>
            {item.type === 'product' ? (
              <DirectoryGridCardMetaRow>
                <span className="text-muted-foreground">{t.products.onHand}</span>
                <span dir="ltr">{formatNumber(item.onHandQty ?? 0)} {item.uom}</span>
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
