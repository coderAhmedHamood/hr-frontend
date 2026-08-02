'use client';

import * as React from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCatalogAttributes } from '@/features/ecommerce/admin/attributes/hooks/use-catalog-attributes';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { ProductVariantsPanel } from '@/features/ecommerce/admin/products/components/product-variants-panel';
import {
  normalizeAttributeValue,
  type CatalogAttribute,
} from '@/features/ecommerce/domain/types/catalog-attribute';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';

type Props = {
  control: Control<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  productId?: string | null;
};

type ProductAttributeLine = ProductFormInput['attributes'][number];

function newLineId() {
  return `pline-${Math.random().toString(36).slice(2, 9)}`;
}

function catalogToLine(attribute: CatalogAttribute): ProductAttributeLine {
  return {
    id: newLineId(),
    attributeId: attribute.id,
    nameAr: attribute.nameAr,
    displayType: attribute.displayType,
    createVariant: attribute.createVariant,
    values: attribute.values.map((raw) => {
      const value = normalizeAttributeValue(raw, attribute.displayType);
      return {
        id: value.id,
        nameAr: value.nameAr,
        freeText: value.freeText,
        defaultExtraPrice: value.defaultExtraPrice,
        colorHex: value.colorHex,
        imageUrl: value.imageUrl,
      };
    }),
  };
}

function ValuePill({
  displayType,
  value,
}: {
  displayType: string;
  value: ProductAttributeLine['values'][number];
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-foreground shadow-soft">
      {displayType === 'color' && value.colorHex ? (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: value.colorHex }}
          title={value.colorHex}
        />
      ) : null}
      {displayType === 'image' && value.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value.imageUrl} alt="" className="h-4 w-4 shrink-0 rounded-full object-cover" />
      ) : null}
      {value.nameAr}
    </span>
  );
}

export function ProductAttributesTab({ control, errors, register, setValue, productId }: Props) {
  const companyId = getStorefrontCompanyId();
  const { data: catalogData, isLoading } = useCatalogAttributes({ companyId, limit: 100 });
  const { fields, append, remove, move, update } = useFieldArray({ control, name: 'attributes' });
  const watched = useWatch({ control, name: 'attributes' }) ?? [];

  const catalog = (catalogData?.items ?? []).filter((item) => item.isActive);
  const linkedIds = new Set(fields.map((field) => field.attributeId).filter(Boolean));
  const available = catalog.filter((item) => !linkedIds.has(item.id));

  const [adding, setAdding] = React.useState(false);
  const [configureIndex, setConfigureIndex] = React.useState<number | null>(null);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  const configureLine = configureIndex !== null ? (watched[configureIndex] ?? fields[configureIndex]) : null;
  const configureCatalog = configureLine?.attributeId
    ? catalog.find((item) => item.id === configureLine.attributeId)
    : undefined;

  const [selectedValueIds, setSelectedValueIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (configureIndex === null || !configureLine) return;
    setSelectedValueIds(new Set(configureLine.values.map((value) => value.id)));
  }, [configureIndex, configureLine]);

  function applyFromCatalog(attributeId: string) {
    const attribute = catalog.find((item) => item.id === attributeId);
    if (!attribute || linkedIds.has(attribute.id)) return;
    append(catalogToLine(attribute));
    setAdding(false);
  }

  function openConfigure(index: number) {
    setConfigureIndex(index);
  }

  function saveConfigure() {
    if (configureIndex === null || !configureLine) return;
    const sourceValues = (configureCatalog?.values ?? configureLine.values) as Array<{
      id: string;
      nameAr: string;
      freeText?: string;
      defaultExtraPrice?: number;
      colorHex?: string;
      imageUrl?: string;
      extra?: string;
    }>;
    const nextValues = sourceValues
      .map((raw) => {
        const value = normalizeAttributeValue(raw, configureLine.displayType);
        return {
          id: value.id,
          nameAr: value.nameAr,
          freeText: value.freeText,
          defaultExtraPrice: value.defaultExtraPrice,
          colorHex: value.colorHex,
          imageUrl: value.imageUrl,
        };
      })
      .filter((value) => selectedValueIds.has(value.id));

    if (nextValues.length === 0) return;

    update(configureIndex, {
      ...configureLine,
      values: nextValues,
    });
    setConfigureIndex(null);
  }

  function toggleValue(id: string) {
    setSelectedValueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground">
              <th className="w-8 px-2 py-2.5" aria-hidden />
              <th className="px-3 py-2.5 text-start font-medium">الخاصية</th>
              <th className="px-3 py-2.5 text-start font-medium">القيم</th>
              <th className="w-24 px-2 py-2.5" />
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const line = watched[index] ?? field;
              return (
                <tr
                  key={field.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragIndex === null || dragIndex === index) return;
                    move(dragIndex, index);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={cn(
                    'border-b border-border last:border-0',
                    dragIndex === index && 'bg-muted/40',
                  )}
                >
                  <td className="px-2 py-3 align-middle text-muted-foreground">
                    <button
                      type="button"
                      className="cursor-grab touch-none p-0.5 active:cursor-grabbing"
                      aria-label="إعادة ترتيب"
                      tabIndex={-1}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => openConfigure(index)}
                    >
                      {line.nameAr}
                    </button>
                    {errors.attributes?.[index]?.nameAr ? (
                      <p className="mt-1 text-xs text-destructive">
                        {errors.attributes[index]?.nameAr?.message}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex flex-wrap gap-1.5">
                      {line.values.map((value) => (
                        <ValuePill key={value.id} displayType={line.displayType} value={value} />
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-3 align-middle">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => openConfigure(index)}
                    >
                      تهيئة
                    </Button>
                  </td>
                  <td className="px-2 py-3 align-middle">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="حذف الخاصية"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}

            {fields.length === 0 && !adding ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  لا توجد خصائص بعد. اضغط «إضافة بند» لربط خاصية من التهيئة.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="border-t border-border px-3 py-2.5">
          {adding ? (
            <div className="flex max-w-sm flex-wrap items-center gap-2">
              <Select
                onValueChange={(value) => applyFromCatalog(value)}
                disabled={isLoading || available.length === 0}
              >
                <SelectTrigger aria-label="اختر خاصية" className="h-8">
                  <SelectValue placeholder={isLoading ? 'جاري التحميل…' : 'اختر خاصية…'} />
                </SelectTrigger>
                <SelectContent>
                  {available.map((attribute) => (
                    <SelectItem key={attribute.id} value={attribute.id}>
                      {attribute.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                إلغاء
              </Button>
              {!isLoading && available.length === 0 ? (
                <p className="w-full text-xs text-muted-foreground">
                  لا توجد خصائص متاحة. أنشئها من قائمة الخصائص أولًا.
                </p>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              onClick={() => setAdding(true)}
            >
              إضافة بند
            </button>
          )}
        </div>
      </div>

      <Dialog
        open={configureIndex !== null}
        onOpenChange={(open) => {
          if (!open) setConfigureIndex(null);
        }}
      >
        <DialogContent className={cn(dialogShellContentClass, 'max-w-md sm:max-w-md')}>
          <div className={dialogShellHeaderClass}>
            <DialogTitle className="text-base font-semibold">
              تهيئة {configureLine?.nameAr ?? 'الخاصية'}
            </DialogTitle>
          </div>
          <div className={cn(dialogShellBodyClass, 'space-y-3')}>
            <p className="text-xs text-muted-foreground">
              اختر القيم التي تظهر على هذا المنتج. يمكنك تعديل القيم الأساسية من صفحة الخصائص.
            </p>
            <ul className="space-y-2">
              {(
                (configureCatalog?.values ?? configureLine?.values ?? []) as Array<{
                  id: string;
                  nameAr: string;
                  freeText?: string;
                  defaultExtraPrice?: number;
                  colorHex?: string;
                  imageUrl?: string;
                  extra?: string;
                }>
              ).map((raw) => {
                const value = normalizeAttributeValue(raw, configureLine?.displayType);
                const checked = selectedValueIds.has(value.id);
                return (
                  <li key={value.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted/30">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleValue(value.id)}
                      />
                      {configureLine?.displayType === 'color' && value.colorHex ? (
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-border"
                          style={{ backgroundColor: value.colorHex }}
                        />
                      ) : null}
                      <span className="text-sm">{value.nameAr}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {selectedValueIds.size === 0 ? (
              <p className="text-xs text-destructive">اختر قيمة واحدة على الأقل.</p>
            ) : null}
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
            <Button type="button" onClick={saveConfigure} disabled={selectedValueIds.size === 0}>
              تطبيق
            </Button>
            <Button type="button" variant="outline" onClick={() => setConfigureIndex(null)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="pt-4" id="product-variants-panel">
        <ProductVariantsPanel control={control} register={register} setValue={setValue} productId={productId} />
      </div>
    </div>
  );
}
