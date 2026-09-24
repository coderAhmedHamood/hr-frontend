'use client';

import * as React from 'react';
import Link from 'next/link';
import { ExternalLink, Plus, Star, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useWatch, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import {
  type ProductFormInput,
  type ProductFormValues,
} from '@/features/ecommerce/admin/products/schemas/product-schema';
import { useCatalogUoms } from '@/features/ecommerce/admin/catalog-uoms/hooks/use-catalog-uoms';
import type { CatalogUom } from '@/features/ecommerce/admin/catalog-uoms/lib/api/catalog-uoms';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
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

function resolveUomFieldErrors(
  errors: FieldErrors<ProductFormInput>,
  fieldPath: UomFieldPath,
): FieldErrors<ProductFormInput>['uomLines'] | undefined {
  if (fieldPath === 'uomLines') return errors.uomLines;
  const match = /^variants\.(\d+)\.uomLines$/.exec(fieldPath);
  if (!match) return undefined;
  const variantErrors = errors.variants?.[Number(match[1])];
  return variantErrors && typeof variantErrors === 'object' && 'uomLines' in variantErrors
    ? (variantErrors as { uomLines?: FieldErrors<ProductFormInput>['uomLines'] }).uomLines
    : undefined;
}

const TEMPLATE_SPECS: Array<{ match: string[]; relativeQuantity: number; isReference?: boolean }> = [
  { match: ['حبة', 'piece'], relativeQuantity: 1, isReference: true },
  { match: ['علبة', 'pack'], relativeQuantity: 6 },
  { match: ['كرتون', 'carton', 'box'], relativeQuantity: 72 },
];

export function ProductUomLinesEditor({ control, errors, setValue, fieldPath, compact }: Props) {
  const companyId = getStorefrontCompanyId();
  const { data: catalogData } = useCatalogUoms({ companyId, ensureDefaults: true, limit: 200 });
  const catalogItems = React.useMemo(
    () => [...(catalogData?.items ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.nameAr.localeCompare(b.nameAr, 'ar')),
    [catalogData?.items],
  );

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: fieldPath as 'uomLines',
    keyName: '_key',
  });

  const [addSelectKey, setAddSelectKey] = React.useState(0);
  const linesWatch = useWatch({ control, name: fieldPath as 'uomLines' }) ?? [];

  function setReference(index: number) {
    fields.forEach((_, rowIndex) => {
      setValue(`${fieldPath}.${rowIndex}.isReference` as 'uomLines.0.isReference', rowIndex === index, {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (rowIndex === index) {
        setValue(`${fieldPath}.${rowIndex}.relativeQuantity` as 'uomLines.0.relativeQuantity', 1, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    });
  }

  function applyCatalogToIndex(index: number, item: CatalogUom) {
    setValue(`${fieldPath}.${index}.catalogUomId` as 'uomLines.0.catalogUomId', item.id, { shouldDirty: true });
    setValue(`${fieldPath}.${index}.nameAr` as 'uomLines.0.nameAr', item.nameAr, { shouldDirty: true });
    setValue(`${fieldPath}.${index}.packagingType` as 'uomLines.0.packagingType', item.packagingType, {
      shouldDirty: true,
    });
  }

  function appendFromCatalog(item: CatalogUom) {
    const currentLines = linesWatch as Array<{ catalogUomId?: string | null }>;
    const lonelyPlaceholder =
      currentLines.length === 1 && !currentLines[0]?.catalogUomId?.trim();

    const row = {
      id: newUomId(),
      catalogUomId: item.id,
      nameAr: item.nameAr,
      uneceCode: item.uneceCode ?? '',
      relativeQuantity: 1,
      isReference: true,
      packagingType: item.packagingType,
    };

    if (lonelyPlaceholder) {
      replace([row]);
    } else {
      append({
        ...row,
        isReference: fields.length === 0,
      });
    }
    setAddSelectKey((key) => key + 1);
  }

  function applyStandardTemplate() {
    const picked: Array<{ item: CatalogUom; spec: (typeof TEMPLATE_SPECS)[number] }> = [];
    for (const spec of TEMPLATE_SPECS) {
      const item = catalogItems.find(
        (row) =>
          spec.match.some((token) => row.nameAr.includes(token) || row.code.toLowerCase() === token.toLowerCase()),
      );
      if (item) picked.push({ item, spec });
    }
    if (picked.length === 0) return;
    replace(
      picked.map(({ item, spec }, index) => ({
        id: newUomId(),
        catalogUomId: item.id,
        nameAr: item.nameAr,
        uneceCode: item.uneceCode ?? '',
        relativeQuantity: spec.relativeQuantity,
        isReference: spec.isReference === true || index === 0,
        packagingType: item.packagingType,
      })),
    );
  }

  const uomErrors = resolveUomFieldErrors(errors, fieldPath);
  const usedCatalogIds = new Set(
    (linesWatch as Array<{ catalogUomId?: string | null }>).map((line) => line.catalogUomId).filter(Boolean),
  );
  const availableCatalogItems = catalogItems.filter((item) => !usedCatalogIds.has(item.id));

  return (
    <div className="space-y-3">
      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">
            ⭐ = الوحدة المرجعية (1). «كمية نسبية» = عدد وحدات المرجع داخل هذا الطرد.
          </p>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href={inventoryAdminRoutes.catalogUoms} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              إدارة الكتالوج
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <th className="w-12 px-2 py-2.5 text-center font-medium">مرجع</th>
              <th className="min-w-[140px] px-3 py-2.5 text-start font-medium">من الكتالوج</th>
              <th className="min-w-[100px] px-3 py-2.5 text-start font-medium">الاسم</th>
              <th className="w-28 px-3 py-2.5 text-start font-medium">كمية نسبية</th>
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field._key} className="border-b border-border last:border-0 align-middle">
                <td className="px-2 py-2 text-center">
                  <Controller
                    control={control}
                    name={`${fieldPath}.${index}.isReference` as 'uomLines.0.isReference'}
                    render={({ field: refField }) => (
                      <button
                        type="button"
                        onClick={() => setReference(index)}
                        title="الوحدة المرجعية"
                        aria-pressed={refField.value}
                        className={cn(
                          'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                          refField.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/30',
                        )}
                      >
                        <Star className={cn('h-4 w-4', refField.value && 'fill-current')} />
                      </button>
                    )}
                  />
                </td>
                <td className="px-3 py-2">
                  <Controller
                    control={control}
                    name={`${fieldPath}.${index}.catalogUomId` as 'uomLines.0.catalogUomId'}
                    render={({ field: catalogField }) => {
                      const rowCatalogError =
                        Array.isArray(uomErrors) &&
                        uomErrors[index] &&
                        typeof uomErrors[index] === 'object' &&
                        'catalogUomId' in uomErrors[index]!
                          ? (uomErrors[index] as { catalogUomId?: { message?: string } }).catalogUomId?.message
                          : undefined;
                      return (
                      <Select
                        value={catalogField.value ?? ''}
                        onValueChange={(value) => {
                          const item = catalogItems.find((row) => row.id === value);
                          if (item) applyCatalogToIndex(index, item);
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            'h-9 w-full max-w-[180px]',
                            rowCatalogError && 'border-destructive',
                          )}
                        >
                          <SelectValue placeholder="اختر وحدة" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalogItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nameAr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      );
                    }}
                  />
                  {Array.isArray(uomErrors) &&
                  uomErrors[index] &&
                  typeof uomErrors[index] === 'object' &&
                  'catalogUomId' in uomErrors[index]! ? (
                    <p className="mt-1 text-[10px] text-destructive">
                      {(uomErrors[index] as { catalogUomId?: { message?: string } }).catalogUomId?.message}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <Controller
                    control={control}
                    name={`${fieldPath}.${index}.nameAr` as 'uomLines.0.nameAr'}
                    render={({ field: nameField }) => (
                      <Input className="h-9" value={nameField.value} readOnly tabIndex={-1} title="من الكتالوج" />
                    )}
                  />
                </td>
                <td className="px-3 py-2">
                  <Controller
                    control={control}
                    name={`${fieldPath}.${index}.relativeQuantity` as 'uomLines.0.relativeQuantity'}
                    render={({ field: qtyField }) => (
                      <Controller
                        control={control}
                        name={`${fieldPath}.${index}.isReference` as 'uomLines.0.isReference'}
                        render={({ field: refField }) => (
                          <Input
                            type="number"
                            step="0.00001"
                            min={0}
                            dir="ltr"
                            className="h-9 w-24"
                            disabled={refField.value}
                            value={refField.value ? '1' : qtyField.value == null ? '' : String(qtyField.value)}
                            onChange={(event) => qtyField.onChange(Number(event.target.value))}
                          />
                        )}
                      />
                    )}
                  />
                </td>
                <td className="px-2 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="حذف"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {uomErrors?.message ? <p className="text-xs text-destructive">{uomErrors.message}</p> : null}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/10 px-3 py-2.5">
        {availableCatalogItems.length > 0 ? (
          <Select
            key={addSelectKey}
            onValueChange={(value) => {
              const item = catalogItems.find((row) => row.id === value);
              if (item) appendFromCatalog(item);
            }}
          >
            <SelectTrigger className="h-9 w-56 gap-2 border-primary/30 bg-background">
              <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
              <SelectValue placeholder="إضافة وحدة من الكتالوج…" />
            </SelectTrigger>
            <SelectContent>
              {availableCatalogItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-xs text-muted-foreground">
            {catalogItems.length === 0
              ? 'لا توجد وحدات في الكتالوج بعد.'
              : 'كل وحدات الكتالوج مربوطة بهذا المنتج.'}{' '}
            <Link href={inventoryAdminRoutes.catalogUoms} className="text-primary underline-offset-2 hover:underline">
              أضِف وحدة في الكتالوج
            </Link>
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs"
          disabled={catalogItems.length === 0}
          onClick={applyStandardTemplate}
        >
          قالب: حبة → علبة → كرتون
        </Button>
      </div>
    </div>
  );
}
