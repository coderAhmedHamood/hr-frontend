'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Filter,
  X,
  Building2,
} from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useVendorsStore } from '@/features/accounting/vendors/lib/vendors-store';

export function VendorsListPage() {
  const router = useRouter();
  const vendors = useVendorsStore((state) => state.vendors);
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [hasBillsFilter, setHasBillsFilter] = React.useState(true);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return vendors.filter((v) => {
      if (!term) return true;
      return (
        v.name.toLowerCase().includes(term) ||
        (v.email && v.email.toLowerCase().includes(term)) ||
        (v.phone && v.phone.toLowerCase().includes(term)) ||
        (v.country && v.country.toLowerCase().includes(term))
      );
    });
  }, [vendors, search]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((v) => v.id));
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
    router.push(accountingRoutes.vendorDetail(id));
  };

  return (
    <div className="flex flex-col gap-4">
      <SetPageTitle
        titleAr="الموردين"
        descriptionAr="إدارة الموردين وفواتير الشراء وجهات الاتصال"
        iconName="Truck"
      />

      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background p-2 border border-border/40 shadow-xs">
        {/* Right side in RTL (Title and Action) */}
        <div className="flex items-center gap-2 order-1 md:order-2">
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 h-9 font-medium shadow-xs"
            onClick={() => router.push(accountingRoutes.vendorNew)}
          >
            جديد
          </Button>
          <div className="flex items-center gap-1.5 me-1">
            <span className="text-lg font-bold text-foreground">الموردين</span>
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
                placeholder="...بحث"
                className={`ps-4 h-9 rounded-lg text-sm bg-muted/20 border-border/60 focus:bg-background transition-colors ${
                  hasBillsFilter ? 'pe-36' : 'pe-10'
                }`}
              />

              {/* Filter badge tag inside input */}
              {hasBillsFilter && (
                <div className="absolute end-7 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20">
                  <Filter className="h-3 w-3" />
                  <span>فواتير الموردين</span>
                  <button
                    type="button"
                    onClick={() => setHasBillsFilter(false)}
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
            {vendors.length} / 1-{filtered.length}
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
                الاسم
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                البريد الإلكتروني
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                رقم الهاتف
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                الأنشطة
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                الدولة
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.map((vend) => {
              const isSelected = selectedIds.includes(vend.id);
              const initial = vend.name.trim().charAt(0) || 'م';
              return (
                <tr
                  key={vend.id}
                  className={`group transition-colors cursor-pointer ${
                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                  }`}
                  onClick={(e) => handleRowClick(vend.id, e)}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(vend.id)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                        style={{ backgroundColor: vend.avatarColor || '#0284c7' }}
                      >
                        {initial}
                      </div>
                      <span className="font-semibold text-foreground">{vend.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                    {vend.email || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                    {vend.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground/60 group-hover:text-muted-foreground">
                      <Clock className="h-4 w-4" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {vend.country || '—'}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  لا يوجد موردين مطابقين.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
