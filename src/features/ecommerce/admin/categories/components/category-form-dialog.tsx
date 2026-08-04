'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ListOrdered, MapPinned } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCategoryMutations } from '@/features/ecommerce/admin/categories/hooks/use-category-mutations';
import { useBrands } from '@/features/ecommerce/admin/brands/hooks/use-brands';
import { useProducts } from '@/features/ecommerce/admin/products/hooks/use-products';
import { usePutawayRules } from '@/features/inventory/admin/putaway-rules/hooks/use-putaway-rules';
import {
  CATEGORY_FORM_DEFAULT_VALUES,
  categoryFormSchema,
  type CategoryFormValues,
} from '@/features/ecommerce/admin/categories/schemas/category-schema';
import {
  categoryToFormValues,
  formValuesToCreateCategoryInput,
} from '@/features/ecommerce/admin/categories/lib/category-form-mapping';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import type { Category } from '@/features/ecommerce/domain/types/category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

type Props = {
  category?: Category | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CategoryFormDialog({ category, categories, open, onOpenChange }: Props) {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const { create, update } = useCategoryMutations();
  const brandsQuery = useBrands({ companyId, limit: 100 });
  const isEditing = Boolean(category);
  const isSaving = create.isPending || update.isPending;

  const { data: productsData } = useProducts(
    { companyId, categoryId: category?.id, limit: 1 },
  );
  const { data: putawayData } = usePutawayRules(
    { companyId, categoryId: category?.id, limit: 1 },
    { enabled: Boolean(category?.id) },
  );

  const productsCount = category?.id ? (productsData?.pagination.total ?? 0) : 0;
  const putawayCount = category?.id ? (putawayData?.pagination.total ?? 0) : 0;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: CATEGORY_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(category ? categoryToFormValues(category) : CATEGORY_FORM_DEFAULT_VALUES);
  }, [open, category, form]);

  const parentOptions = categories.filter((item) => item.id !== category?.id);
  const featuredBrandIds = form.watch('featuredBrandIds');
  const parentId = form.watch('parentId');
  const parentLabel = parentId
    ? parentOptions.find((item) => item.id === parentId)?.nameAr ?? '—'
    : 'بدون أب';

  const onSubmit = async (values: CategoryFormValues) => {
    if (!companyId) return;
    const input = formValuesToCreateCategoryInput(values, companyId, category);

    if (category) {
      await update.mutateAsync({ companyId, id: category.id, patch: input });
    } else {
      await create.mutateAsync(input);
    }
    onOpenChange(false);
  };

  function toggleBrand(brandId: string) {
    const current = form.getValues('featuredBrandIds');
    form.setValue(
      'featuredBrandIds',
      current.includes(brandId) ? current.filter((id) => id !== brandId) : [...current, brandId],
      { shouldDirty: true },
    );
  }

  function openRelated(kind: 'putaway' | 'products') {
    if (!category?.id) return;
    onOpenChange(false);
    if (kind === 'putaway') {
      router.push(`${ecommerceAdminRoutes.putawayRules}?categoryId=${category.id}`);
      return;
    }
    router.push(`${ecommerceAdminRoutes.products}?categoryId=${category.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-3xl sm:max-w-3xl')}>
        <div className={dialogShellHeaderClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <DialogTitle className="text-base font-semibold">
              {isEditing ? 'تعديل الفئة' : 'فئة جديدة'}
            </DialogTitle>
            {isEditing ? (
              <div className="flex flex-wrap gap-2" role="toolbar" aria-label="مستندات الفئة">
                <button
                  type="button"
                  onClick={() => openRelated('putaway')}
                  className="relative flex min-h-[4.25rem] min-w-[5.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-2 py-2 text-center hover:border-primary/40"
                >
                  <span className="absolute -top-1.5 start-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground tabular-nums">
                    {putawayCount}
                  </span>
                  <MapPinned className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[11px] font-medium">قواعد التخزين</span>
                </button>
                <button
                  type="button"
                  onClick={() => openRelated('products')}
                  className="relative flex min-h-[4.25rem] min-w-[5.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-2 py-2 text-center hover:border-primary/40"
                >
                  <span className="absolute -top-1.5 start-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[11px] font-bold text-muted-foreground tabular-nums">
                    {productsCount}
                  </span>
                  <ListOrdered className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[11px] font-medium">المنتجات</span>
                </button>
              </div>
            ) : null}
          </div>
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
              <p className="text-xs text-muted-foreground">الفئة</p>
              <Input
                placeholder="مثال: مصابيح"
                className="h-auto border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
                {...form.register('nameAr')}
              />
              {form.formState.errors.nameAr ? (
                <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">{parentLabel}</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nameEn">الاسم (إنجليزي)</Label>
                  <Input id="nameEn" {...form.register('nameEn')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">الرابط المختصر</Label>
                  <Input id="slug" dir="ltr" {...form.register('slug')} />
                  {form.formState.errors.slug ? (
                    <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>التصنيف الأب</Label>
                <Controller
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? 'root'}
                      onValueChange={(value) => field.onChange(value === 'root' ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="تصنيف جذري" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="root">— بدون أب —</SelectItem>
                        {parentOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">الوصف</Label>
                <Textarea id="description" rows={3} {...form.register('description')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="imageUrl">رابط الصورة</Label>
                <Input id="imageUrl" dir="ltr" {...form.register('imageUrl')} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="displayOrder">ترتيب العرض</Label>
                  <Controller
                    control={form.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <Input
                        id="displayOrder"
                        type="number"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value) || 0)}
                      />
                    )}
                  />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Controller
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <Switch checked={field.value} onCheckedChange={field.onChange} id="isActive" />
                        <Label htmlFor="isActive">مفعّل</Label>
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>ماركات مميزة (للتصنيف الجذري)</Label>
                <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border p-2">
                  {(brandsQuery.data?.items ?? []).map((brand) => {
                    const selected = featuredBrandIds.includes(brand.id);
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => toggleBrand(brand.id)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs transition-colors',
                          selected
                            ? 'border-primary bg-primary/10 font-semibold text-primary'
                            : 'border-border text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {brand.nameAr}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="metaTitle">عنوان SEO</Label>
                  <Input id="metaTitle" {...form.register('metaTitle')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="metaDescription">وصف SEO</Label>
                  <Input id="metaDescription" {...form.register('metaDescription')} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'جارٍ الحفظ…' : 'حفظ'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
