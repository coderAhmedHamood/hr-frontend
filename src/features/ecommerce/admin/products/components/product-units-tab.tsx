'use client';

import { Plus, Ruler, Star, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import {
  PACKAGING_TYPE_OPTIONS,
  type ProductFormInput,
  type ProductFormValues,
} from '@/features/ecommerce/admin/products/schemas/product-schema';
import { ProductFormSection } from '@/features/ecommerce/admin/products/components/product-form-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  errors: FieldErrors<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
};

function newUomId() {
  return `uom-${Math.random().toString(36).slice(2, 9)}`;
}

export function ProductUnitsTab({ control, errors, setValue }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'uomLines',
    keyName: '_key',
  });

  function setReference(index: number) {
    fields.forEach((_, rowIndex) => {
      setValue(`uomLines.${rowIndex}.isReference`, rowIndex === index, { shouldDirty: true, shouldValidate: true });
    });
  }

  return (
    <ProductFormSection
      title="الوحدات والتغليف"
      description="الوحدة المرجعية مطلوبة ومضافة تلقائيًا. عدّلها فقط إذا كنت تبيع بعبوات أو وحدات مختلفة."
    >
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field._key} className="rounded-2xl border border-border/80 bg-card/60 p-3 sm:p-3.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Controller
                control={control}
                name={`uomLines.${index}.isReference`}
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
                name={`uomLines.${index}.nameAr`}
                render={({ field: nameField }) => (
                  <Input
                    placeholder="اسم الوحدة — مثال: قطعة"
                    className="h-10 min-w-40 flex-1"
                    value={nameField.value}
                    onChange={nameField.onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name={`uomLines.${index}.packagingType`}
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
                name={`uomLines.${index}.relativeQuantity`}
                render={({ field: qtyField }) => (
                  <div className="relative w-24 shrink-0">
                    <Input
                      type="number"
                      step="0.00001"
                      min={0}
                      dir="rtl"
                      className="h-10"
                      value={qtyField.value == null ? '' : String(qtyField.value)}
                      onChange={(event) => qtyField.onChange(Number(event.target.value))}
                    />
                  </div>
                )}
              />

              <Controller
                control={control}
                name={`uomLines.${index}.uneceCode`}
                render={({ field: codeField }) => (
                  <Input
                    dir="ltr"
                    placeholder="UN/ECE"
                    className="h-10 w-24 shrink-0"
                    value={codeField.value ?? ''}
                    onChange={codeField.onChange}
                  />
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
      </div>

      {errors.uomLines?.message ? <p className="text-xs text-destructive">{errors.uomLines.message}</p> : null}
      {typeof errors.uomLines?.root?.message === 'string' ? (
        <p className="text-xs text-destructive">{errors.uomLines.root.message}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            append({
              id: newUomId(),
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
        <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Ruler className="h-3.5 w-3.5" />
          اضغط <Star className="h-3 w-3" /> لتحديد الوحدة المرجعية
        </p>
      </div>
    </ProductFormSection>
  );
}
