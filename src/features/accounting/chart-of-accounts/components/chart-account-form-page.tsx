'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Trash2 } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EntityFormRow } from '@/features/ecommerce/admin/shared/components/entity-form-row';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import {
  ACCOUNT_CURRENCY_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
  type ChartAccount,
} from '@/features/accounting/domain/types/chart-account';
import {
  CHART_ACCOUNT_FORM_DEFAULT_VALUES,
  chartAccountFormSchema,
  type ChartAccountFormValues,
} from '@/features/accounting/chart-of-accounts/schemas/chart-account-schema';
import { useChartAccountsStore } from '@/features/accounting/chart-of-accounts/lib/chart-accounts-store';

/** عملة الشركة — قيمة حرّاسة لأن Radix Select لا يقبل قيمة فارغة. */
const COMPANY_CURRENCY = '__company__';

function toFormValues(account: ChartAccount): ChartAccountFormValues {
  return {
    code: account.code,
    nameAr: account.nameAr,
    type: account.type,
    allowReconciliation: account.allowReconciliation,
    currencyCode: account.currencyCode ?? '',
  };
}

/** صفحة حساب كاملة — تخدم الإنشاء (/new) والتعديل (/[accountId]). */
export function ChartAccountFormPage() {
  const router = useRouter();
  const params = useParams<{ accountId?: string }>();
  const accountId = params.accountId;
  const accounts = useChartAccountsStore((state) => state.accounts);
  const save = useChartAccountsStore((state) => state.save);
  const remove = useChartAccountsStore((state) => state.remove);

  const account = accountId ? accounts.find((item) => item.id === accountId) ?? null : null;
  const isEditing = Boolean(accountId);
  const notFound = isEditing && !account;

  const form = useForm<ChartAccountFormValues>({
    resolver: zodResolver(chartAccountFormSchema),
    defaultValues: account ? toFormValues(account) : CHART_ACCOUNT_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    form.reset(account ? toFormValues(account) : CHART_ACCOUNT_FORM_DEFAULT_VALUES);
  }, [account, form]);

  const backToList = () => router.push(accountingRoutes.chartOfAccounts);

  const onSubmit = (values: ChartAccountFormValues) => {
    const code = values.code.trim();
    save({
      id: account?.id ?? `coa-${code}`,
      code,
      nameAr: values.nameAr.trim(),
      type: values.type,
      allowReconciliation: values.allowReconciliation,
      currencyCode: values.currencyCode?.trim() ?? '',
    });
    backToList();
  };

  const onDelete = () => {
    if (!account) return;
    remove(account.id);
    backToList();
  };

  if (notFound) {
    return (
      <div className="flex flex-col items-start gap-3">
        <SetPageTitle titleAr="حساب غير موجود" iconName="Network" />
        <p className="text-sm text-destructive">تعذر العثور على الحساب.</p>
        <Button variant="outline" onClick={backToList}>
          العودة لشجرة الحسابات
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr={account ? account.nameAr : 'حساب جديد'}
        descriptionAr={account ? `رمز الحساب ${account.code}` : 'إضافة حساب إلى شجرة الحسابات'}
        iconName="Network"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={backToList}>
          <ArrowRight className="me-1 h-4 w-4" />
          شجرة الحسابات
        </Button>
        {account ? (
          <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
            <Trash2 className="me-1 h-4 w-4" />
            حذف
          </Button>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit(onSubmit)(e);
        }}
        className="flex flex-col gap-5"
      >
        <div className="rounded-xl border border-border bg-card px-5 py-2 shadow-soft">
          <EntityFormRow label="اسم الحساب" htmlFor="acc-name-ar">
            <Input
              id="acc-name-ar"
              className="max-w-sm border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
              placeholder="مثال: العملاء — المدينون التجاريون"
              {...form.register('nameAr')}
            />
            {form.formState.errors.nameAr ? (
              <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
            ) : null}
          </EntityFormRow>

          <EntityFormRow label="رمز الحساب" htmlFor="acc-code">
            <div className="space-y-1">
              <Input
                id="acc-code"
                dir="ltr"
                className="max-w-[10rem] tabular-nums"
                placeholder="102100"
                {...form.register('code')}
              />
              {form.formState.errors.code ? (
                <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">يحدّد ترتيب الحساب في شجرة الحسابات.</p>
            </div>
          </EntityFormRow>

          <EntityFormRow label="النوع" htmlFor="acc-type">
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="acc-type" aria-label="النوع" className="max-w-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.labelAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </EntityFormRow>

          <EntityFormRow label="السماح بالتسوية">
            <div className="flex max-w-md items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                يسمح بمطابقة القيود المدينة والدائنة على هذا الحساب
              </p>
              <Controller
                control={form.control}
                name="allowReconciliation"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="السماح بالتسوية"
                  />
                )}
              />
            </div>
          </EntityFormRow>

          <EntityFormRow label="عملة الحساب" htmlFor="acc-currency" className="border-b-0">
            <Controller
              control={form.control}
              name="currencyCode"
              render={({ field }) => (
                <Select
                  value={field.value || COMPANY_CURRENCY}
                  onValueChange={(value) => field.onChange(value === COMPANY_CURRENCY ? '' : value)}
                >
                  <SelectTrigger id="acc-currency" aria-label="عملة الحساب" className="max-w-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={COMPANY_CURRENCY}>عملة الشركة (افتراضي)</SelectItem>
                    {ACCOUNT_CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.labelAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </EntityFormRow>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit">{isEditing ? 'حفظ' : 'إنشاء الحساب'}</Button>
          <Button type="button" variant="outline" onClick={backToList}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
