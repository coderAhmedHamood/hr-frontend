'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useBrandMutations } from '@/features/ecommerce/admin/brands/hooks/use-brand-mutations';
import {
  BRAND_FORM_DEFAULT_VALUES,
  brandFormSchema,
  type BrandFormValues,
} from '@/features/ecommerce/admin/brands/schemas/brand-schema';
import {
  brandToFormValues,
  formValuesToCreateBrandInput,
} from '@/features/ecommerce/admin/brands/lib/brand-form-mapping';
import type { Brand } from '@/features/ecommerce/domain/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  dialogMaxHeightClass,
} from '@/components/ui/dialog';

type Props = {
  brand?: Brand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BrandFormDialog({ brand, open, onOpenChange }: Props) {
  const companyId = getStorefrontCompanyId();
  const { create, update } = useBrandMutations();
  const isEditing = Boolean(brand);
  const isSaving = create.isPending || update.isPending;

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: BRAND_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(brand ? brandToFormValues(brand) : BRAND_FORM_DEFAULT_VALUES);
  }, [open, brand, form]);

  const onSubmit = async (values: BrandFormValues) => {
    if (!companyId) return;
    const input = formValuesToCreateBrandInput(values, companyId);

    if (brand) {
      await update.mutateAsync({ companyId, id: brand.id, patch: input });
    } else {
      await create.mutateAsync(input);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogMaxHeightClass} max-w-lg overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل العلامة التجارية' : 'إضافة علامة تجارية جديدة'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'حدّث بيانات العلامة التجارية ثم احفظ التغييرات.' : 'أدخل بيانات العلامة التجارية الجديدة.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit(onSubmit)(e);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="brand-name-ar">اسم العلامة التجارية *</Label>
              <Input id="brand-name-ar" {...form.register('nameAr')} />
              {form.formState.errors.nameAr ? (
                <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-name-en">الاسم بالإنجليزية (اختياري)</Label>
              <Input id="brand-name-en" dir="ltr" {...form.register('nameEn')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand-slug">الرابط المختصر (اختياري)</Label>
            <Input
              id="brand-slug"
              dir="ltr"
              placeholder="يُنشأ تلقائياً إن تُرك فارغاً — مثل royal-wood"
              {...form.register('slug')}
            />
            {form.formState.errors.slug ? (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                للمتجر فقط. إن تركته فارغاً يُولَّد من الاسم الإنجليزي أو العربي.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand-description">الوصف (اختياري)</Label>
            <Textarea id="brand-description" rows={3} {...form.register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="brand-website">رابط الموقع (اختياري)</Label>
              <Input id="brand-website" dir="ltr" {...form.register('websiteUrl')} />
              {form.formState.errors.websiteUrl ? (
                <p className="text-xs text-destructive">{form.formState.errors.websiteUrl.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-logo">رابط الشعار (اختياري)</Label>
              <Input id="brand-logo" dir="ltr" {...form.register('logoUrl')} />
              {form.formState.errors.logoUrl ? (
                <p className="text-xs text-destructive">{form.formState.errors.logoUrl.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="brand-active">علامة تجارية نشطة</Label>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Switch id="brand-active" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isSaving || !companyId}>
              {isSaving ? 'جاري الحفظ…' : isEditing ? 'حفظ التغييرات' : 'إضافة العلامة التجارية'}
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
