'use client';

import * as React from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCatalogAttributeMutations } from '@/features/ecommerce/admin/attributes/hooks/use-catalog-attributes';
import {
  ATTRIBUTE_DISPLAY_OPTIONS,
  CATALOG_ATTRIBUTE_FORM_DEFAULTS,
  catalogAttributeFormSchema,
  createEmptyAttributeValue,
  normalizeVariantCreationMode,
  type CatalogAttributeFormInput,
  type CatalogAttributeFormValues,
} from '@/features/ecommerce/admin/attributes/schemas/catalog-attribute-schema';
import {
  normalizeAttributeValue,
  type CatalogAttribute,
} from '@/features/ecommerce/domain/types/catalog-attribute';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  attribute?: CatalogAttribute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormValues(attribute: CatalogAttribute): CatalogAttributeFormInput {
  return {
    nameAr: attribute.nameAr,
    displayType: attribute.displayType,
    createVariant: normalizeVariantCreationMode(attribute.createVariant),
    isActive: attribute.isActive,
    values: attribute.values.map((raw) => {
      const value = normalizeAttributeValue(raw, attribute.displayType);
      return {
        id: value.id,
        nameAr: value.nameAr,
        freeText: value.freeText ?? '',
        defaultExtraPrice: value.defaultExtraPrice ?? 0,
        colorHex: value.colorHex ?? '',
        imageUrl: value.imageUrl ?? '',
      };
    }),
  };
}

type PreviewValue = { id: string; nameAr: string; colorHex?: string; imageUrl?: string };

/** Interactive mock of the selected display type, using the values entered so far. */
function AttributeDisplayPreview({
  displayType,
  values,
}: {
  displayType: string;
  values: PreviewValue[];
}) {
  const items = values.filter((value) => value.nameAr?.trim()).slice(0, 8);
  const [selected, setSelected] = React.useState<string[]>([]);

  React.useEffect(() => {
    setSelected([]);
  }, [displayType]);

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">أضف قيمة باسم لرؤية المعاينة هنا.</p>;
  }

  function toggle(id: string) {
    setSelected((prev) => {
      if (displayType === 'multi') {
        return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      }
      return prev.includes(id) ? [] : [id];
    });
  }

  if (displayType === 'select') {
    return (
      <select
        className="h-9 w-52 rounded-lg border border-border bg-background px-2 text-sm"
        value={selected[0] ?? ''}
        onChange={(event) => setSelected(event.target.value ? [event.target.value] : [])}
      >
        <option value="" disabled>
          اختر…
        </option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nameAr}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isSelected = selected.includes(item.id);

        if (displayType === 'multi') {
          return (
            <label
              key={item.id}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm"
            >
              <Checkbox checked={isSelected} onCheckedChange={() => toggle(item.id)} />
              {item.nameAr}
            </label>
          );
        }

        if (displayType === 'radio') {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border',
                  isSelected ? 'border-primary' : 'border-muted-foreground',
                )}
              >
                {isSelected ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
              </span>
              {item.nameAr}
            </button>
          );
        }

        if (displayType === 'image') {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors',
                isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border',
              )}
            >
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveUploadUrl(item.imageUrl)}
                  alt=""
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
                  صورة
                </span>
              )}
              <span className="text-[11px] text-foreground">{item.nameAr}</span>
            </button>
          );
        }

        if (displayType === 'color') {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              title={item.nameAr}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors',
                isSelected ? 'border-primary' : 'border-transparent',
              )}
            >
              <span
                className="h-7 w-7 rounded-full border border-border"
                style={{ backgroundColor: item.colorHex || '#e5e5e5' }}
              />
            </button>
          );
        }

        // pills (default)
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => toggle(item.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              isSelected
                ? 'border-primary bg-primary/10 font-medium text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {item.nameAr}
          </button>
        );
      })}
    </div>
  );
}

export function CatalogAttributeFormDialog({ attribute, open, onOpenChange }: Props) {
  const companyId = getStorefrontCompanyId();
  const { create, update } = useCatalogAttributeMutations();
  const isEditing = Boolean(attribute);
  const isSaving = create.isPending || update.isPending;

  const form = useForm<CatalogAttributeFormInput, unknown, CatalogAttributeFormValues>({
    resolver: zodResolver(catalogAttributeFormSchema),
    defaultValues: CATALOG_ATTRIBUTE_FORM_DEFAULTS,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'values' });
  const displayType = useWatch({ control: form.control, name: 'displayType' });
  const showColor = displayType === 'color';
  const showImage = displayType === 'color' || displayType === 'image';
  const displayHint = ATTRIBUTE_DISPLAY_OPTIONS.find((option) => option.value === displayType)?.hint;
  const previewValues = useWatch({ control: form.control, name: 'values' }) ?? [];

  React.useEffect(() => {
    if (!open) return;
    form.reset(attribute ? toFormValues(attribute) : CATALOG_ATTRIBUTE_FORM_DEFAULTS);
  }, [open, attribute, form]);

  const onSubmit = async (values: CatalogAttributeFormValues) => {
    if (!companyId) return;
    const payload = {
      companyId,
      nameAr: values.nameAr.trim(),
      displayType: values.displayType,
      createVariant: values.createVariant,
      isActive: values.isActive,
      values: values.values.map((value) => ({
        id: value.id,
        nameAr: value.nameAr.trim(),
        freeText: value.freeText?.trim() || undefined,
        defaultExtraPrice: value.defaultExtraPrice ?? 0,
        colorHex:
          values.displayType === 'color' ? value.colorHex?.trim() || undefined : undefined,
        imageUrl:
          values.displayType === 'color' || values.displayType === 'image'
            ? value.imageUrl?.trim() || undefined
            : undefined,
      })),
    };

    if (attribute) {
      await update.mutateAsync({ companyId, id: attribute.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-4xl sm:max-w-4xl')}>
        <div className={dialogShellHeaderClass}>
          <DialogTitle className="text-base font-semibold">
            {isEditing ? 'تعديل الخاصية' : 'خاصية جديدة'}
          </DialogTitle>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit(onSubmit)(event);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={cn(dialogShellBodyClass, 'space-y-5')}>
            <div className="space-y-1 border-b border-border pb-4">
              <p className="text-xs text-muted-foreground">اسم الخاصية</p>
              <Input
                placeholder="مثال: اللون"
                className="h-auto border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
                {...form.register('nameAr')}
              />
              {form.formState.errors.nameAr ? (
                <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>نوع العرض</Label>
                <Controller
                  control={form.control}
                  name="displayType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label="نوع العرض">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-w-md">
                        {ATTRIBUTE_DISPLAY_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            textValue={option.labelAr}
                            className="items-start py-2.5"
                          >
                            <span className="flex flex-col gap-0.5 text-right">
                              <span className="text-sm font-medium leading-snug">{option.labelAr}</span>
                              <span className="text-[11px] font-normal leading-snug text-muted-foreground">
                                {option.hint}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {displayHint ? <p className="text-xs text-muted-foreground">{displayHint}</p> : null}
              </div>

              <div className="flex items-end gap-2 pb-1">
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch checked={field.value} onCheckedChange={field.onChange} id="attr-active" />
                      <Label htmlFor="attr-active">مفعّلة</Label>
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5 rounded-xl border border-dashed border-border bg-muted/20 p-3">
              <Label className="text-xs text-muted-foreground">معاينة</Label>
              <AttributeDisplayPreview displayType={displayType} values={previewValues} />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">قيم الخاصية</p>
                <p className="text-xs text-muted-foreground">
                  أعمدة العرض تتغيّر حسب نوع العرض — البيانات تُنسخ للمنتج ثم للمتجر.
                </p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">القيمة</th>
                      <th className="px-3 py-2 text-start font-medium">نص حر</th>
                      {showColor ? (
                        <th className="px-3 py-2 text-start font-medium">اللون</th>
                      ) : null}
                      {showImage ? (
                        <th className="px-3 py-2 text-start font-medium">
                          {displayType === 'color' ? 'صورة (اختياري)' : 'صورة'}
                        </th>
                      ) : null}
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id} className="border-b border-border last:border-0 align-top">
                        <td className="px-3 py-2">
                          <Input {...form.register(`values.${index}.nameAr`)} placeholder="أحمر" />
                          {form.formState.errors.values?.[index]?.nameAr ? (
                            <p className="mt-1 text-xs text-destructive">
                              {form.formState.errors.values[index]?.nameAr?.message}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            {...form.register(`values.${index}.freeText`)}
                            placeholder="وصف قصير للمتجر"
                          />
                        </td>
                        {showColor ? (
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Controller
                                control={form.control}
                                name={`values.${index}.colorHex`}
                                render={({ field: colorField }) => (
                                  <>
                                    <input
                                      type="color"
                                      aria-label="اختيار اللون"
                                      className="h-9 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                                      value={
                                        colorField.value && /^#[0-9a-fA-F]{6}$/.test(colorField.value)
                                          ? colorField.value
                                          : '#cccccc'
                                      }
                                      onChange={(event) => colorField.onChange(event.target.value)}
                                    />
                                    <Input
                                      dir="ltr"
                                      className="w-28"
                                      placeholder="#ef4444"
                                      value={colorField.value ?? ''}
                                      onChange={colorField.onChange}
                                    />
                                  </>
                                )}
                              />
                            </div>
                            {form.formState.errors.values?.[index]?.colorHex ? (
                              <p className="mt-1 text-xs text-destructive">
                                {form.formState.errors.values[index]?.colorHex?.message}
                              </p>
                            ) : null}
                          </td>
                        ) : null}
                        {showImage ? (
                          <td className="px-3 py-2">
                            <Input
                              dir="ltr"
                              placeholder="https://…"
                              {...form.register(`values.${index}.imageUrl`)}
                            />
                            {form.formState.errors.values?.[index]?.imageUrl ? (
                              <p className="mt-1 text-xs text-destructive">
                                {form.formState.errors.values[index]?.imageUrl?.message}
                              </p>
                            ) : null}
                          </td>
                        ) : null}
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="حذف القيمة"
                            disabled={fields.length <= 1}
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
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => append(createEmptyAttributeValue())}
              >
                <span className="inline-flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  إضافة بند
                </span>
              </button>
              {form.formState.errors.values?.message || form.formState.errors.values?.root?.message ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.values?.message ??
                    form.formState.errors.values?.root?.message}
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
            <Button type="submit" disabled={isSaving || !companyId}>
              {isSaving ? 'جاري الحفظ…' : 'حفظ'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
