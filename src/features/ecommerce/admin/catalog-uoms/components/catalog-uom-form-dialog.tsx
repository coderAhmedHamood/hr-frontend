'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCatalogUomMutations } from '@/features/ecommerce/admin/catalog-uoms/hooks/use-catalog-uom-mutations';
import {
  CATALOG_UOM_FORM_DEFAULT_VALUES,
  catalogUomFormSchema,
  type CatalogUomFormValues,
} from '@/features/ecommerce/admin/catalog-uoms/schemas/catalog-uom-schema';
import {
  catalogUomToFormValues,
  formValuesToCreatePayload,
  formValuesToUpdatePayload,
} from '@/features/ecommerce/admin/catalog-uoms/lib/catalog-uom-form-mapping';
import type { CatalogUom } from '@/features/ecommerce/admin/catalog-uoms/lib/api/catalog-uoms';
import { PACKAGING_TYPE_OPTIONS } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogMaxHeightClass,
} from '@/components/ui/dialog';

type Props = {
  uom?: CatalogUom | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CatalogUomFormDialog({ uom, open, onOpenChange }: Props) {
  const companyId = getStorefrontCompanyId();
  const { create, update } = useCatalogUomMutations();
  const isEditing = Boolean(uom);
  const isSaving = create.isPending || update.isPending;

  const form = useForm<CatalogUomFormValues>({
    resolver: zodResolver(catalogUomFormSchema),
    defaultValues: CATALOG_UOM_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(uom ? catalogUomToFormValues(uom) : CATALOG_UOM_FORM_DEFAULT_VALUES);
  }, [open, uom, form]);

  const onSubmit = async (values: CatalogUomFormValues) => {
    if (!companyId) return;
    if (uom) {
      await update.mutateAsync({
        id: uom.id,
        companyId,
        patch: formValuesToUpdatePayload(values),
      });
    } else {
      await create.mutateAsync(formValuesToCreatePayload(values, companyId));
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogMaxHeightClass} max-w-lg overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل وحدة القياس' : 'إضافة وحدة قياس'}</DialogTitle>
          <DialogDescription>
            الوحدات هنا مشتركة بين كل المنتجات. في المنتج تربطها بالكمية النسبية فقط.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit(onSubmit)(e);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="uom-name-ar">الاسم (عربي) *</Label>
            <Input id="uom-name-ar" {...form.register('nameAr')} />
            {form.formState.errors.nameAr ? (
              <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="uom-packaging">نوع الطرد</Label>
              <Controller
                control={form.control}
                name="packagingType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="uom-packaging">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PACKAGING_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.labelAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uom-category">فئة الاستخدام</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="uom-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="countable">معدود (قطعة، علبة…)</SelectItem>
                      <SelectItem value="bulk">غير معدود (كيلو، لتر…)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="uom-code">الرمز (اختياري)</Label>
              <Input id="uom-code" dir="ltr" {...form.register('code')} placeholder="carton" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uom-unece">UN/ECE (اختياري)</Label>
              <Input id="uom-unece" dir="ltr" {...form.register('uneceCode')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uom-order">ترتيب العرض</Label>
            <Input
              id="uom-order"
              type="number"
              min={0}
              {...form.register('displayOrder', { valueAsNumber: true })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="uom-active">نشطة في الكتالوج</Label>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Switch id="uom-active" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'جاري الحفظ…' : isEditing ? 'حفظ التعديلات' : 'إضافة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
