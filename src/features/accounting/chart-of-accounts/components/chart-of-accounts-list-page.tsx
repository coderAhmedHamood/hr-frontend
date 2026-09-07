'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Minus, Plus } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RowActions } from '@/components/ui/row-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import {
  ACCOUNT_TYPE_LABEL_AR,
  ACCOUNT_TYPE_OPTIONS,
  type AccountType,
  type ChartAccount,
} from '@/features/accounting/domain/types/chart-account';
import { useChartAccountsStore } from '@/features/accounting/chart-of-accounts/lib/chart-accounts-store';

const ALL_TYPES = '__all__';

const TYPE_BADGE_VARIANT: Record<AccountType, 'secondary' | 'success' | 'warning' | 'gold' | 'subtle' | 'outline'> = {
  asset: 'secondary',
  liability: 'warning',
  equity: 'gold',
  revenue: 'success',
  expense: 'outline',
  receivable: 'secondary',
  payable: 'warning',
  bank_cash: 'subtle',
};

export function ChartOfAccountsListPage() {
  const router = useRouter();
  const accounts = useChartAccountsStore((state) => state.accounts);
  const remove = useChartAccountsStore((state) => state.remove);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<AccountType | ''>('');

  const filtered = accounts.filter((account) => {
    if (typeFilter && account.type !== typeFilter) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [account.code, account.nameAr, ACCOUNT_TYPE_LABEL_AR[account.type], account.currencyCode]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });

  const openAccount = (account: ChartAccount) =>
    router.push(accountingRoutes.chartOfAccountDetail(account.id));

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="شجرة الحسابات"
        descriptionAr="قائمة حسابات دليل الحسابات المحاسبي"
        iconName="Network"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="بحث برمز الحساب أو الاسم…"
          className="max-w-md"
        />
        <Select
          value={typeFilter || ALL_TYPES}
          onValueChange={(value) => setTypeFilter(value === ALL_TYPES ? '' : (value as AccountType))}
        >
          <SelectTrigger className="w-full sm:w-56" aria-label="تصفية بالنوع">
            <SelectValue placeholder="كل الأنواع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPES}>كل الأنواع</SelectItem>
            {ACCOUNT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.labelAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} حساب</span>
        <Button
          type="button"
          className="ms-auto"
          onClick={() => router.push(accountingRoutes.chartOfAccountNew)}
        >
          <Plus className="me-1 h-4 w-4" />
          جديد
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-start font-medium">رمز الحساب</th>
              <th className="px-3 py-2.5 text-start font-medium">اسم الحساب</th>
              <th className="px-3 py-2.5 text-start font-medium">النوع</th>
              <th className="px-3 py-2.5 text-start font-medium">السماح بالتسوية</th>
              <th className="px-3 py-2.5 text-start font-medium">عملة الحساب</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((account) => (
              <tr
                key={account.id}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/20"
                onClick={() => openAccount(account)}
              >
                <td className="px-3 py-2.5 font-medium tabular-nums" dir="ltr">
                  {account.code}
                </td>
                <td className="px-3 py-2.5">{account.nameAr}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={TYPE_BADGE_VARIANT[account.type]}>
                    {ACCOUNT_TYPE_LABEL_AR[account.type]}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  {account.allowReconciliation ? (
                    <span className="inline-flex items-center gap-1.5 text-success">
                      <Check className="h-4 w-4" />
                      نعم
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Minus className="h-4 w-4" />
                      لا
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                  {account.currencyCode || '—'}
                </td>
                <td className="px-3 py-2.5">
                  <RowActions
                    menuItems={[
                      { label: 'تعديل', onClick: () => openAccount(account) },
                      { label: 'حذف', destructive: true, onClick: () => remove(account.id) },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                  لا توجد حسابات مطابقة.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
