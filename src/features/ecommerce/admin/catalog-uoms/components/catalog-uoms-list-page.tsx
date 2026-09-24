'use client';

import * as React from 'react';
import { Plus, Ruler } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCatalogUoms } from '@/features/ecommerce/admin/catalog-uoms/hooks/use-catalog-uoms';
import {
  createCatalogUom,
  type CatalogUom,
} from '@/features/ecommerce/admin/catalog-uoms/lib/api/catalog-uoms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { useQueryClient } from '@tanstack/react-query';

export function CatalogUomsListPage() {
  const companyId = getStorefrontCompanyId();
  const queryClient = useQueryClient();
  const { data, isLoading } = useCatalogUoms({ companyId, ensureDefaults: true, limit: 200 });
  const [nameAr, setNameAr] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  async function handleAdd() {
    if (!nameAr.trim()) return;
    setSaving(true);
    try {
      await createCatalogUom({ companyId, nameAr: nameAr.trim() });
      setNameAr('');
      await queryClient.invalidateQueries({ queryKey: ['catalog-uoms'] });
    } finally {
      setSaving(false);
    }
  }

  const columns: ColumnDef<CatalogUom>[] = [
    { key: 'nameAr', title: 'الاسم', render: (row) => row.nameAr },
    { key: 'code', title: 'الرمز', render: (row) => <span dir="ltr">{row.code}</span> },
    { key: 'packagingType', title: 'نوع الطرد', render: (row) => row.packagingType },
  ];

  return (
    <div className="space-y-6">
      <SetPageTitle
        titleAr="وحدات القياس"
        descriptionAr="كتالوج مشترك: حبة، علبة، كرتون… تُ reused في كل المنتجات."
        iconName="Ruler"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">كتالوج وحدات القياس</h1>
            <p className="text-xs text-muted-foreground">
              حبة، علبة، كرتون… تُعرَّف مرة وتُ reused في كل المنتجات. عند أول فتح تُ seed تلقائياً.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="اسم وحدة جديدة — مثال: شrink"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
        />
        <Button type="button" className="gap-1.5" disabled={saving || !nameAr.trim()} onClick={() => void handleAdd()}>
          <Plus className="h-4 w-4" />
          إضافة
        </Button>
      </div>

      <DataTable
        variant="directory"
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyText="لا توجد وحدات بعد."
      />
    </div>
  );
}
