'use client';

import * as React from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCatalogUoms } from '@/features/ecommerce/admin/catalog-uoms/hooks/use-catalog-uoms';
import { useCatalogUomMutations } from '@/features/ecommerce/admin/catalog-uoms/hooks/use-catalog-uom-mutations';
import { CatalogUomFormDialog } from '@/features/ecommerce/admin/catalog-uoms/components/catalog-uom-form-dialog';
import { DeleteCatalogUomDialog } from '@/features/ecommerce/admin/catalog-uoms/components/delete-catalog-uom-dialog';
import type { CatalogUom, CatalogUomCategory } from '@/features/ecommerce/admin/catalog-uoms/lib/api/catalog-uoms';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

const CATEGORY_LABELS_AR: Record<CatalogUomCategory, string> = {
  countable: 'معدود',
  bulk: 'غير معدود',
};

export function CatalogUomsListPage() {
  const companyId = getStorefrontCompanyId();
  const { data, isLoading, isError } = useCatalogUoms({ companyId, ensureDefaults: true, limit: 200 });
  const { remove } = useCatalogUomMutations();

  const [formState, setFormState] = React.useState<{ open: boolean; uom: CatalogUom | null }>({
    open: false,
    uom: null,
  });
  const [uomToDelete, setUomToDelete] = React.useState<CatalogUom | null>(null);

  const openCreate = () => setFormState({ open: true, uom: null });
  const openEdit = (uom: CatalogUom) => setFormState({ open: true, uom });

  usePageHeaderActions(
    () => (
      <PageHeaderPrimaryButton icon={Plus} label="إضافة وحدة" disabled={!companyId} onClick={openCreate} />
    ),
    [companyId],
  );

  const columns: ColumnDef<CatalogUom>[] = [
    {
      key: 'name',
      title: 'الاسم',
      render: (row) => (
        <div>
          <div className="font-medium">{row.nameAr}</div>
          {!row.isActive ? (
            <Badge variant="secondary" className="mt-1 text-[10px]">
              غير نشطة
            </Badge>
          ) : null}
        </div>
      ),
    },
    { key: 'code', title: 'الرمز', render: (row) => <span dir="ltr">{row.code}</span> },
    { key: 'packagingType', title: 'نوع الطرد', render: (row) => row.packagingType },
    { key: 'category', title: 'الفئة', render: (row) => CATEGORY_LABELS_AR[row.category] },
    { key: 'order', title: 'الترتيب', render: (row) => row.displayOrder },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label="تعديل" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="حذف"
            onClick={() => setUomToDelete(row)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="وحدات القياس"
        descriptionAr="كتالوج مشترك بين المنتجات — عرّف الحبة والعلبة والكرتون هنا، ثم اربطها بالمنتج بالكمية النسبية."
        iconName="Ruler"
      />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل وحدات القياس.</p> : null}

      <DataTable
        variant="directory"
        className="sto-table-host"
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyText="لا توجد وحدات. اضغط «إضافة وحدة»."
      />

      <CatalogUomFormDialog
        open={formState.open}
        uom={formState.uom}
        onOpenChange={(open) => setFormState((prev) => ({ ...prev, open }))}
      />

      <DeleteCatalogUomDialog
        open={Boolean(uomToDelete)}
        uom={uomToDelete}
        onOpenChange={(open) => {
          if (!open) setUomToDelete(null);
        }}
        isDeleting={remove.isPending}
        onConfirm={async (uom) => {
          if (!companyId) return;
          await remove.mutateAsync({ id: uom.id, companyId });
          setUomToDelete(null);
        }}
      />
    </div>
  );
}
