'use client';

import * as React from 'react';
import { Check, GripVertical, Layers, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCatalogAttributes } from '@/features/ecommerce/admin/attributes/hooks/use-catalog-attributes';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { ProductVariantsPanel } from '@/features/ecommerce/admin/products/components/product-variants-panel';
import { dedupeAttributeValues } from '@/features/ecommerce/admin/products/lib/product-variants';
import {
  normalizeAttributeValue,
  type CatalogAttribute,
} from '@/features/ecommerce/domain/types/catalog-attribute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  getValues: UseFormGetValues<ProductFormInput>;
  productId?: string | null;
};

type ProductAttributeLine = ProductFormInput['attributes'][number];

function newLineId() {
  return `pline-${Math.random().toString(36).slice(2, 9)}`;
}

function newValueClientKey() {
  return `pval-${Math.random().toString(36).slice(2, 9)}`;
}

function catalogToLine(attribute: CatalogAttribute): ProductAttributeLine {
  return {
    id: newLineId(),
    attributeId: attribute.id,
    nameAr: attribute.nameAr,
    displayType: attribute.displayType,
    createVariant: attribute.createVariant,
    values: dedupeAttributeValues(
      attribute.values.map((raw) => {
        const value = normalizeAttributeValue(raw, attribute.displayType);
        return {
          id: newValueClientKey(),
          catalogAttributeValueId: value.id,
          nameAr: value.nameAr,
          freeText: value.freeText,
          defaultExtraPrice: value.defaultExtraPrice,
          colorHex: value.colorHex,
          imageUrl: value.imageUrl,
        };
      }),
    ),
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
        <img src={resolveUploadUrl(value.imageUrl)} alt="" className="h-4 w-4 shrink-0 rounded-full object-cover" />
      ) : null}
      {value.nameAr}
    </span>
  );
}

export function ProductAttributesTab({ control, errors, register, setValue, getValues, productId }: Props) {
  const companyId = getStorefrontCompanyId();
  const { data: catalogData, isLoading } = useCatalogAttributes({ companyId, limit: 100 });
  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: 'attributes',
    keyName: '_key',
  });
  const watched = useWatch({ control, name: 'attributes' }) ?? [];

  const catalog = (catalogData?.items ?? []).filter((item) => item.isActive);
  const linkedIds = new Set(fields.map((field) => field.attributeId).filter(Boolean));
  const available = catalog.filter((item) => !linkedIds.has(item.id));

  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerSearch, setPickerSearch] = React.useState('');
  const [configureIndex, setConfigureIndex] = React.useState<number | null>(null);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  const configureLine = configureIndex !== null ? watched[configureIndex] : null;
  const configureCatalog = configureLine?.attributeId
    ? catalog.find((item) => item.id === configureLine.attributeId)
    : undefined;

  const [selectedValueIds, setSelectedValueIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (configureIndex === null || !configureLine) return;
    if (configureCatalog) {
      setSelectedValueIds(
        new Set(
          configureLine.values
            .map((value) => value.catalogAttributeValueId)
            .filter((id): id is string => Boolean(id)),
        ),
      );
      return;
    }
    setSelectedValueIds(new Set(configureLine.values.map((value) => value.id)));
  }, [configureIndex, configureLine, configureCatalog]);

  const filteredAvailable = pickerSearch.trim()
    ? available.filter((item) => item.nameAr.toLowerCase().includes(pickerSearch.trim().toLowerCase()))
    : available;

  function applyFromCatalog(attributeId: string) {
    const attribute = catalog.find((item) => item.id === attributeId);
    if (!attribute || linkedIds.has(attribute.id)) return;
    append(catalogToLine(attribute));
    setPickerOpen(false);
    setPickerSearch('');
  }

  function openConfigure(index: number) {
    setConfigureIndex(index);
  }

  function saveConfigure() {
    if (configureIndex === null || !configureLine) return;

    if (configureCatalog) {
      const existingByCatalogId = new Map(
        configureLine.values
          .filter((value) => value.catalogAttributeValueId)
          .map((value) => [value.catalogAttributeValueId!, value]),
      );
      const nextValues = configureCatalog.values
        .filter((raw) => selectedValueIds.has(raw.id))
        .map((raw) => {
          const value = normalizeAttributeValue(raw, configureLine.displayType);
          const existing = existingByCatalogId.get(value.id);
          if (existing) {
            return {
              ...existing,
              nameAr: value.nameAr,
              freeText: value.freeText,
              defaultExtraPrice: value.defaultExtraPrice,
              colorHex: value.colorHex,
              imageUrl: value.imageUrl,
              catalogAttributeValueId: value.id,
            };
          }
          return {
            id: newValueClientKey(),
            catalogAttributeValueId: value.id,
            nameAr: value.nameAr,
            freeText: value.freeText,
            defaultExtraPrice: value.defaultExtraPrice,
            colorHex: value.colorHex,
            imageUrl: value.imageUrl,
          };
        });

      if (nextValues.length === 0) return;
      update(configureIndex, {
        ...configureLine,
        values: dedupeAttributeValues(nextValues),
      });
      setConfigureIndex(null);
      return;
    }

    const sourceValues = configureLine.values;
    const nextValues = dedupeAttributeValues(
      sourceValues.filter((value) => selectedValueIds.has(value.id)),
    );
    if (nextValues.length === 0) return;
    update(configureIndex, { ...configureLine, values: nextValues });
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-semibold text-foreground">الخصائص والمتغيرات</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            اختياري — اربط خصائص مثل اللون أو المقاس لإنشاء متغيرات SKU. المنتجات البسيطة يمكن تركها فارغة.
          </p>
        </div>
        <Button type="button" size="sm" className="shrink-0 gap-1.5" onClick={() => setPickerOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          إضافة خاصية
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/40 px-4 py-10 text-center">
          <Layers className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">لا توجد خصائص بعد.</p>
          <Button type="button" variant="outline" size="sm" className="mt-1 gap-1.5" onClick={() => setPickerOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            إضافة خاصية
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => {
            const line = watched[index] ?? field;
            return (
              <div
                key={field._key}
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
                  'flex flex-wrap items-start gap-3 rounded-2xl border border-border/80 bg-card/60 p-3 transition-colors sm:items-center sm:p-3.5',
                  dragIndex === index && 'border-primary/40 bg-primary/5',
                )}
              >
                <button
                  type="button"
                  className="mt-1 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing sm:mt-0"
                  aria-label="إعادة ترتيب"
                  tabIndex={-1}
                >
                  <GripVertical className="h-4 w-4" />
                </button>

                <div className="min-w-28 shrink-0">
                  <p className="text-sm font-semibold text-foreground">{line.nameAr}</p>
                  {errors.attributes?.[index]?.nameAr ? (
                    <p className="mt-0.5 text-xs text-destructive">{errors.attributes[index]?.nameAr?.message}</p>
                  ) : null}
                </div>

                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  {line.values.map((value) => (
                    <ValuePill key={value.id} displayType={line.displayType} value={value} />
                  ))}
                  {line.values.length === 0 ? (
                    <span className="text-xs text-muted-foreground">لا قيم محددة</span>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs"
                    onClick={() => openConfigure(index)}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    تهيئة
                  </Button>
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add-attribute picker — search + list, replaces the old dropdown-inside-dropdown flow. */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className={cn(dialogShellContentClass, 'max-w-md sm:max-w-md')}>
          <div className={cn(dialogShellHeaderClass, 'space-y-3')}>
            <DialogTitle className="text-base font-semibold">إضافة خاصية</DialogTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                value={pickerSearch}
                onChange={(event) => setPickerSearch(event.target.value)}
                placeholder="ابحث عن خاصية…"
                className="h-10 pe-9"
              />
            </div>
          </div>
          <div className={cn(dialogShellBodyClass, 'space-y-1.5')}>
            {isLoading ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">جاري التحميل…</p>
            ) : filteredAvailable.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                {available.length === 0
                  ? 'لا توجد خصائص متاحة. أنشئها من قائمة الخصائص أولًا.'
                  : 'لا نتائج مطابقة للبحث.'}
              </p>
            ) : (
              filteredAvailable.map((attribute) => (
                <button
                  key={attribute.id}
                  type="button"
                  onClick={() => applyFromCatalog(attribute.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-primary/5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Layers className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{attribute.nameAr}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {attribute.values.length} قيمة متاحة
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Configure values — tap-to-toggle chips instead of a checkbox list. */}
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
            <div className="flex flex-wrap gap-2">
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
                  <button
                    key={value.id}
                    type="button"
                    onClick={() => toggleValue(value.id)}
                    aria-pressed={checked}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                      checked
                        ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                        : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5',
                    )}
                  >
                    {checked ? <Check className="h-3.5 w-3.5" /> : null}
                    {configureLine?.displayType === 'color' && value.colorHex ? (
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-border/60"
                        style={{ backgroundColor: value.colorHex }}
                      />
                    ) : null}
                    {value.nameAr}
                  </button>
                );
              })}
            </div>
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
        <ProductVariantsPanel
          control={control}
          register={register}
          setValue={setValue}
          getValues={getValues}
          productId={productId}
        />
      </div>
    </div>
  );
}
