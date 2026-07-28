'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { StatTile, StatTileGrid } from '@/components/ui/stat-tile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { EntityFormRow } from '@/features/ecommerce/admin/shared/components/entity-form-row';
import { getContactsCompanyId } from '@/features/contacts/lib/company-id';
import {
  usePartnerCategories,
  usePartnerCategoryMutations,
} from '@/features/contacts/admin/categories/hooks/use-partner-categories';
import {
  CATEGORY_FORM_DEFAULT_VALUES,
  categoryFormSchema,
  type CategoryFormValues,
} from '@/features/contacts/admin/schemas/partner-schemas';
import type { PartnerCategory } from '@/features/contacts/domain/types/partner';
import { cn } from '@/shared/utils';

export function PartnerCategoriesListPage() {
  const companyId = getContactsCompanyId();
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [formState, setFormState] = React.useState<{ open: boolean; category: PartnerCategory | null }>({
    open: false,
    category: null,
  });
  const [toDelete, setToDelete] = React.useState<PartnerCategory | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = usePartnerCategories({
    companyId,
    search: search || undefined,
    page: 1,
    limit: 200,
  });
  const { create, update, remove } = usePartnerCategoryMutations(companyId);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: CATEGORY_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!formState.open) return;
    form.reset(
      formState.category
        ? {
            slug: formState.category.slug,
            nameAr: formState.category.nameAr,
            nameEn: formState.category.nameEn ?? '',
            color: formState.category.color ?? '',
            description: formState.category.description ?? '',
            isActive: formState.category.isActive,
          }
        : CATEGORY_FORM_DEFAULT_VALUES,
    );
  }, [formState, form]);

  const columns: ColumnDef<PartnerCategory>[] = [
    {
      key: 'name',
      title: 'التصنيف',
      render: (row) => (
        <div>
          <p className="font-medium">{row.nameAr}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.slug}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'subtle'}>
          {row.isActive ? 'نشط' : 'معطّل'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (row) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFormState({ open: true, category: row })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setToDelete(row)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </>
      ),
    },
  ];

  const onSubmit = async (values: CategoryFormValues) => {
    if (!companyId) return;
    const payload = {
      companyId,
      slug: values.slug?.trim() || undefined,
      nameAr: values.nameAr.trim(),
      nameEn: values.nameEn?.trim() || null,
      color: values.color?.trim() || null,
      description: values.description?.trim() || null,
      isActive: values.isActive,
    };
    if (formState.category) {
      await update.mutateAsync({ id: formState.category.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    setFormState({ open: false, category: null });
  };

  const items = data?.items ?? [];
  const activeCount = items.filter((category) => category.isActive).length;

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        <PageHeaderPrimaryButton
          icon={Plus}
          label="تصنيف جديد"
          disabled={!companyId}
          onClick={() => setFormState({ open: true, category: null })}
        />
      </div>
    ),
    [companyId],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        leadingFilters={
          <EntityFilterSearchField value={searchInput} onChange={setSearchInput} placeholder="ابحث في التصنيفات…" />
        }
      />
    ),
    [searchInput],
  );

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="تصنيفات جهات الاتصال"
        descriptionAr="تصنيفات مخصصة لتجميع جهات الاتصال — مثل كبار العملاء أو الموردين المعتمدين."
        iconName="Tag"
      />

      <StatTileGrid className="sm:grid-cols-2">
        <StatTile icon={Tags} label="إجمالي التصنيفات" value={items.length} tone="primary" loading={isLoading} />
        <StatTile icon={Tags} label="نشطة" value={activeCount} tone="success" loading={isLoading} />
      </StatTileGrid>

      {isError ? <p className="text-sm text-destructive">تعذر تحميل التصنيفات.</p> : null}

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyText="لا تصنيفات بعد. أضف VIP أو Supplier أو Customer…"
      />

      <Dialog
        open={formState.open}
        onOpenChange={(open) => setFormState((s) => ({ ...s, open }))}
      >
        <DialogContent className={cn(dialogShellContentClass, 'max-w-lg')}>
          <div className={dialogShellHeaderClass}>
            <DialogTitle>{formState.category ? 'تعديل التصنيف' : 'تصنيف جديد'}</DialogTitle>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit(onSubmit)(e);
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className={cn(dialogShellBodyClass, 'space-y-1')}>
              <EntityFormRow label="الاسم" htmlFor="cat-name">
                <Input id="cat-name" {...form.register('nameAr')} />
              </EntityFormRow>
              <EntityFormRow label="المعرّف (اختياري)" htmlFor="cat-slug" hint>
                <Input
                  id="cat-slug"
                  dir="ltr"
                  placeholder="يُشتق تلقائيًا من الاسم إن تُرك فارغًا"
                  {...form.register('slug')}
                />
              </EntityFormRow>
              <EntityFormRow label="الاسم الإنجليزي" htmlFor="cat-en">
                <Input id="cat-en" dir="ltr" {...form.register('nameEn')} />
              </EntityFormRow>
              <EntityFormRow label="اللون" htmlFor="cat-color">
                <Input id="cat-color" dir="ltr" placeholder="#0d9488" {...form.register('color')} />
              </EntityFormRow>
              <EntityFormRow label="الوصف" htmlFor="cat-desc">
                <Textarea id="cat-desc" rows={2} {...form.register('description')} />
              </EntityFormRow>
              <EntityFormRow label="نشط">
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </EntityFormRow>
            </div>
            <DialogFooter className="gap-2 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setFormState({ open: false, category: null })}>
                إلغاء
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف التصنيف؟</DialogTitle>
            <DialogDescription>سيتم أرشفة «{toDelete?.nameAr}».</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!toDelete) return;
                await remove.mutateAsync(toDelete.id);
                setToDelete(null);
              }}
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
