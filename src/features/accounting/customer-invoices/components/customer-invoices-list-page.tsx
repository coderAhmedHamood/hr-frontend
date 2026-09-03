'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  X,
  FileText,
  Clock,
  Send,
  Plus,
} from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useCustomerInvoicesStore } from '@/features/accounting/customer-invoices/lib/customer-invoices-store';

export function CustomerInvoicesListPage() {
  const router = useRouter();
  const invoices = useCustomerInvoicesStore((state) => state.invoices);
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [invoiceFilter, setInvoiceFilter] = React.useState(true);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (!term) return true;
      return (
        inv.name.toLowerCase().includes(term) ||
        inv.customerName.toLowerCase().includes(term) ||
        inv.journalName.toLowerCase().includes(term) ||
        (inv.salesperson && inv.salesperson.toLowerCase().includes(term))
      );
    });
  }, [invoices, search]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('input[type="checkbox"]')) return;
    router.push(`/accounting/customers/invoices/${id}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <SetPageTitle
        titleAr="فواتير العملاء"
        descriptionAr="إدارة وإصدار فواتير المبيعات للعملاء"
        iconName="FileText"
      />

      {/* Top Controls Bar (Matching Odoo standard) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background p-2 border border-border/40 shadow-xs">
        {/* Right side in RTL (Title and Action) */}
        <div className="flex items-center gap-2 order-1 md:order-2">
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 h-9 font-medium shadow-xs"
            onClick={() => router.push('/accounting/customers/invoices/new')}
          >
            جديد
          </Button>
          <div className="flex items-center gap-1.5 me-1">
            <span className="text-lg font-bold text-foreground">فواتير العملاء</span>
            <Settings2 className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
          </div>
        </div>

        {/* Center: Search & Filter Tag */}
        <div className="flex items-center gap-2 flex-1 max-w-md mx-auto order-3 md:order-2">
          <div className="relative w-full flex items-center">
            <div className="relative flex-1 flex items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="...بحث برقم الفاتورة أو العميل"
                className={`ps-4 h-9 rounded-lg text-sm bg-muted/20 border-border/60 focus:bg-background transition-colors ${
                  invoiceFilter ? 'pe-36' : 'pe-10'
                }`}
              />

              {/* Filter badge inside search */}
              {invoiceFilter && (
                <div className="absolute end-7 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20">
                  <Filter className="h-3 w-3" />
                  <span>فواتير العملاء</span>
                  <button
                    type="button"
                    onClick={() => setInvoiceFilter(false)}
                    className="hover:text-destructive ms-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <div className="absolute end-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
            </div>
            <button
              type="button"
              className="ms-1 p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Left side in RTL (Pagination) */}
        <div className="flex items-center gap-2 order-2 md:order-1">
          <div className="flex items-center rounded-md border border-border/60 bg-muted/20 text-muted-foreground">
            <button
              type="button"
              className="p-1.5 hover:text-foreground hover:bg-background rounded-s transition-colors disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 hover:text-foreground hover:bg-background rounded-e transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <span className="text-xs text-muted-foreground font-mono tabular-nums px-1">
            {invoices.length} / 1-{filtered.length}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card shadow-xs">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-muted-foreground select-none">
            <tr>
              <th className="w-10 px-3 py-3 text-start">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onChange={toggleSelectAll}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                الرقم
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                العميل
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                تاريخ الفاتورة
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                تاريخ الاستحقاق
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                الأنشطة
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                غير شامل الضريبة
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                الإجمالي
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                المبلغ المستحق
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                حالة الدفع
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                الحالة
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.map((inv) => {
              const isSelected = selectedIds.includes(inv.id);
              return (
                <tr
                  key={inv.id}
                  className={`group transition-colors cursor-pointer ${
                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                  }`}
                  onClick={(e) => handleRowClick(inv.id, e)}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(inv.id)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-bold font-mono text-primary" dir="ltr">
                    {inv.name}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {inv.customerName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs" dir="ltr">
                    {inv.invoiceDate}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs" dir="ltr">
                    {inv.dueDate}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground/60 group-hover:text-muted-foreground">
                      <Clock className="h-4 w-4" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-foreground text-start" dir="ltr">
                    {inv.amountUntaxed.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {inv.currency}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-foreground text-start" dir="ltr">
                    {inv.amountTotal.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {inv.currency}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-start" dir="ltr">
                    <span className={inv.amountDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
                      {inv.amountDue.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {inv.currency}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inv.paymentState === 'paid' && (
                      <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        مدفوعة
                      </span>
                    )}
                    {inv.paymentState === 'not_paid' && (
                      <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        غير مدفوعة
                      </span>
                    )}
                    {inv.paymentState === 'partial' && (
                      <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        مدفوعة جزئياً
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {inv.state === 'posted' ? (
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                        مرحل
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        مسودة
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-16 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  لا توجد فواتير عملاء مطابقة.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
