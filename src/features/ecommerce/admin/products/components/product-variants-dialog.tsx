'use client';

import { Layers, Save } from 'lucide-react';
import type { Control, UseFormGetValues, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { ProductVariantsPanel } from '@/features/ecommerce/admin/products/components/product-variants-panel';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  register: UseFormRegister<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  getValues: UseFormGetValues<ProductFormInput>;
  productId?: string | null;
  productNameAr: string;
  onSave?: () => void;
  isSaving?: boolean;
};

export function ProductVariantsDialog({
  open,
  onOpenChange,
  control,
  register,
  setValue,
  getValues,
  productId,
  productNameAr,
  onSave,
  isSaving,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-4xl sm:max-w-4xl')}>
        <div className={dialogShellHeaderClass}>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Layers className="h-4 w-4 text-primary" />
            متغيرات المنتج · {productNameAr}
          </DialogTitle>
        </div>

        <div className={dialogShellBodyClass}>
          <ProductVariantsPanel
            control={control}
            register={register}
            setValue={setValue}
            getValues={getValues}
            productId={productId}
          />
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
          {onSave ? (
            <Button type="button" className="gap-1.5" disabled={isSaving} onClick={onSave}>
              <Save className="h-4 w-4" />
              {isSaving ? 'جاري الحفظ…' : 'حفظ المتغيرات'}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
