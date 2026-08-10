'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import {
  PACKAGING_TYPE_OPTIONS,
  type ProductFormInput,
} from '@/features/ecommerce/admin/products/schemas/product-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

type Props = {
  control: Control<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
};

function newUomId() {
  return `uom-${Math.random().toString(36).slice(2, 9)}`;
}

export function ProductUnitsTab({ control, errors, setValue }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'uomLines' });

  function setReference(index: number) {
    fields.forEach((_, rowIndex) => {
      setValue(`uomLines.${rowIndex}.isReference`, rowIndex === index, { shouldDirty: true, shouldValidate: true });
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">الوحدات والتغليف</p>
        <p className="mt-1 text-xs text-muted-foreground">
          عرّف وحدة مرجعية (مثل القطعة) ثم عبوات أكبر (علبة، صندوق…) بكمية نسبية مرنة.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start font-medium">اسم الوحدة</th>
              <th className="px-3 py-2 text-start font-medium">UN/ECE</th>
              <th className="px-3 py-2 text-start font-medium">الكمية</th>
              <th className="px-3 py-2 text-start font-medium">مرجعية</th>
              <th className="px-3 py-2 text-start font-medium">نوع الطرد</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <Controller
                    control={control}
                    name={`uomLines.${index}.nameAr`}
                    render={({ field: nameField }) => (
                      <Input placeholder="وحدات" value={nameField.value} onChange={nameField.onChange} />
                    )}
                  />
                </td>
                <td className="px-3 py-2">
                  <Controller
                    control={control}
                    name={`uomLines.${index}.uneceCode`}
                    render={({ field: codeField }) => (
                      <Input
                        dir="ltr"
                        placeholder="C62"
                        value={codeField.value ?? ''}
                        onChange={codeField.onChange}
                      />
                    )}
                  />
                </td>
                <td className="px-3 py-2">
                  <Controller
                    control={control}
                    name={`uomLines.${index}.relativeQuantity`}
                    render={({ field: qtyField }) => (
                      <Input
                        type="number"
                        step="0.00001"
                        min={0}
                        dir="ltr"
                        className="w-28"
                        value={qtyField.value == null ? '' : String(qtyField.value)}
                        onChange={(event) => qtyField.onChange(Number(event.target.value))}
                      />
                    )}
                  />
                </td>
                <td className="px-3 py-2">
                  <Controller
                    control={control}
                    name={`uomLines.${index}.isReference`}
                    render={({ field: refField }) => (
                      <label className="inline-flex items-center gap-2 text-xs">
                        <Checkbox
                          checked={refField.value}
                          onCheckedChange={() => setReference(index)}
                          aria-label="الوحدة المرجعية"
                        />
                        مرجعية
                      </label>
                    )}
                  />
                </td>
                <td className="px-3 py-2">
                  <Controller
                    control={control}
                    name={`uomLines.${index}.packagingType`}
                    render={({ field: typeField }) => (
                      <Select value={typeField.value} onValueChange={typeField.onChange}>
                        <SelectTrigger aria-label="نوع الطرد" className="min-w-[7rem]">
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
                </td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="حذف الوحدة"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {errors.uomLines?.message ? <p className="text-xs text-destructive">{errors.uomLines.message}</p> : null}
      {typeof errors.uomLines?.root?.message === 'string' ? (
        <p className="text-xs text-destructive">{errors.uomLines.root.message}</p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
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
        <Plus className="me-1 h-3.5 w-3.5" />
        إضافة وحدة / طرد
      </Button>

      <p className="text-xs text-muted-foreground">
        مثال: وحدة مرجعية «قطعة» بكمية 1، ثم «علبة» بكمية 12 — عند الاستلام والتسعير تُستخدم هذه النسبة بمرونة.
      </p>
      <Label className="sr-only">وحدات المنتج</Label>
    </div>
  );
}
