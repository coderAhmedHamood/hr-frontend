'use client';

import Link from 'next/link';
import { Plus, Ruler, Star, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import {
  PACKAGING_TYPE_OPTIONS,
  createDefaultUomLines,
  type ProductFormInput,
  type ProductFormValues,
} from '@/features/ecommerce/admin/products/schemas/product-schema';
import { useCatalogUoms } from '@/features/ecommerce/admin/catalog-uoms/hooks/use-catalog-uoms';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';

type UomFieldPath = 'uomLines' | `variants.${number}.uomLines`;

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  errors: FieldErrors<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  fieldPath: UomFieldPath;
  compact?: boolean;
};

function newUomId() {
  return `uom-${Math.random().toString(36).slice(2, 9)}`;
}

export function ProductUomLinesEditor({ control, errors, setValue, fieldPath, compact }: Props) {
  const companyId = getStorefrontCompanyId();
  const { data: catalogData } = useCatalogUoms({ companyId, ensureDefaults: true });
  const catalogItems = catalogData?.items ?? [];

  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldPath as 'uomLines',
    keyName: '_key',
  });

  function setReference(index: number) {
    fields.forEach((_, rowIndex) => {
      setValue(`${fieldPath}.${rowIndex}.isReference` as 'uomLines.0.isReference', rowIndex === index, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  }

  function applyCatalog(index: number, catalogUomId: string) {
    const item = catalogItems.find((row) => row.id === catalogUomId);
    if (!item) return;
    setValue(`${fieldPath}.${index}.catalogUomId` as 'uomLines.0.catalogUomId', catalogUomId, { shouldDirty: true });
    setValue(`${fieldPath}.${index}.nameAr` as 'uomLines.0.nameAr', item.nameAr, { shouldDirty: true });
    setValue(`${fieldPath}.${index}.packagingType` as 'uomLines.0.packagingType', item.packagingType, {
      shouldDirty: true,
    });
  }

  const uomErrors = fieldPath === 'uomLines' ? errors.uomLines : undefined;

  return (
    <div className="space-y-2">
      {!compact ? (
        <p className="text-[11px] text-muted-foreground">
          اختر من{' '}
          <Link href={ecommerceAdminRoutes.catalogUoms} className="text-primary underline-offset-2 hover:underline">
            كتالوج وحدات القياس
          </Link>{' '}
          ثم عدّل الكمية النسبية. الوحدة المرجعية = 1 والباقي يتفرع منها.
        </p>
      ) : null}

      {fields.map((field, index) => (
        <div key={field._key} className="rounded-2xl border border-border/80 bg-card/60 p-3 sm:p-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <Controller
              control={control}
              name={`${fieldPath}.${index}.isReference` as 'uomLines.0.isReference'}
              render={({ field: refField }) => (
                <button
                  type="button"
                  onClick={() => setReference(index)}
                  title="اجعلها الوحدة المرجعية"
                  aria-pressed={refField.value}
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                    refField.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary',
                  )}
                >
                  <Star className={cn('h-4 w-4', refField.value && 'fill-current')} />
                </button>
              )}
            />

            <Controller
              control={control}
              name={`${fieldPath}.${index}.catalogUomId` as 'uomLines.0.catalogUomId'}
              render={({ field: catalogField }) => (
                <Select
                  value={catalogField.value ?? ''}
                  onValueChange={(value) => applyCatalog(index, value)}
                >
                  <SelectTrigger aria-label="من الكتالوج" className="h-10 w-36 shrink-0">
                    <SelectValue placeholder="من الكتالوج" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            <Controller
              control={control}
              name={`${fieldPath}.${index}.nameAr` as 'uomLines.0.nameAr'}
              render={({ field: nameField }) => (
                <Input
                  placeholder="اسم الوحدة"
                  className="h-10 min-w-32 flex-1"
                  value={nameField.value}
                  onChange={nameField.onChange}
                />
              )}
            />

            <Controller
              control={control}
              name={`${fieldPath}.${index}.packagingType` as 'uomLines.0.packagingType'}
              render={({ field: typeField }) => (
                <Select value={typeField.value} onValueChange={typeField.onChange}>
                  <SelectTrigger aria-label="نوع الطرد" className="h-10 w-28 shrink-0">
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

            <Controller
              control={control}
              name={`${fieldPath}.${index}.relativeQuantity` as 'uomLines.0.relativeQuantity'}
              render={({ field: qtyField }) => (
                <div className="relative w-24 shrink-0">
                  <Input
                    type="number"
                    step="0.00001"
                    min={0}
                    dir="rtl"
                    className="h-10"
                    title="كم حبة مرجعية داخل هذه الوحدة"
                    value={qtyField.value == null ? '' : String(qtyField.value)}
                    onChange={(event) => qtyField.onChange(Number(event.target.value))}
                  />
                </div>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              aria-label="حذف الوحدة"
              onClick={() => remove(index)}
              disabled={fields.length <= 1}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      {uomErrors?.message ? <p className="text-xs text-destructive">{uomErrors.message}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            append({
              id: newUomId(),
              catalogUomId: null,
              nameAr: '',
              uneceCode: '',
              relativeQuantity: 1,
              isReference: false,
              packagingType: 'pack',
            })
          }
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة وحدة / طرد
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => {
            const defaults = createDefaultUomLines();
            defaults.forEach((line, i) => {
              if (i === 0) return;
              append({ ...line, catalogUomId: null });
            });
          }}
        >
          قالب: حبة → علبة → كرتون
        </Button>
        <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Ruler className="h-3.5 w-3.5" />
          <Star className="h-3 w-3" /> = المرجع (1)
        </p>
      </div>
    </div>
  );
}
