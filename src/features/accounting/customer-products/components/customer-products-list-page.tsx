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
  Package,
  Clock,
  LayoutGrid,
  LayoutList,
  Plus,
} from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomerProductsStore } from '@/features/accounting/customer-products/lib/customer-products-store';

export function CustomerProductsListPage() {
  const router = useRouter();
  const products = useCustomerProductsStore((state) => state.products);
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [filterActive, setFilterActive] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'kanban' | 'list'>('kanban');

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.internalReference && p.internalReference.toLowerCase().includes(term)) ||
        (p.barcode && p.barcode.toLowerCase().includes(term))
      );
    });
  }, [products, search]);

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

  const handleOpenProduct = (id: string) => {
    router.push(`/accounting/customers/products/${id}`);
  };

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <SetPageTitle
        titleAr="المنتجات"
        descriptionAr="إدارة المنتجات والخدمات وأسعار البيع والتكلفة"
        iconName="Package"
      />

      {/* Top Controls Bar (Matching Odoo standard) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background p-2 border border-border/40 shadow-xs">
        {/* Right side in RTL (Title and Action) */}
        <div className="flex items-center gap-2 order-1 md:order-2">
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 h-9 font-medium shadow-xs"
            onClick={() => router.push('/accounting/customers/products/new')}
          >
            جديد
          </Button>
          <div className="flex items-center gap-1.5 me-1">
            <span className="text-lg font-bold text-foreground">المنتجات</span>
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
                placeholder="...بحث باسم المنتج أو الفئة"
                className={`ps-4 h-9 rounded-lg text-sm bg-muted/20 border-border/60 focus:bg-background transition-colors ${
                  filterActive ? 'pe-32' : 'pe-10'
                }`}
              />

              {/* Inside input filter tag */}
              {filterActive && (
                <div className="absolute end-7 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20">
                  <Filter className="h-3 w-3" />
                  <span>المنتجات</span>
                  <button
                    type="button"
                    onClick={() => setFilterActive(false)}
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

        {/* Left side in RTL (View Switcher & Pagination) */}
        <div className="flex items-center gap-2 order-2 md:order-1">
          {/* View mode buttons (Kanban / List) */}
          <div className="flex items-center rounded-lg border border-border/60 bg-muted/20 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-background shadow-xs text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="عرض كانبان"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-background shadow-xs text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="عرض القائمة"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>

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
            {products.length} / 1-{filtered.length}
          </span>
        </div>
      </div>

      {/* KANBAN VIEW (Odoo Style) */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              onClick={() => handleOpenProduct(prod.id)}
              className="group flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 shadow-xs transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-14 w-14 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0"
                  style={{ backgroundColor: prod.avatarColor || '#3b82f6' }}
                >
                  {prod.name.trim().charAt(0) || 'م'}
                </div>

                <div className="flex flex-col gap-1 overflow-hidden">
                  <h3 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                    {prod.name}
                  </h3>
                  {prod.internalReference && (
                    <span className="text-xs text-muted-foreground font-mono truncate" dir="ltr">
                      [{prod.internalReference}]
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{prod.category}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[11px]">سعر البيع:</span>
                  <span className="font-bold font-mono text-foreground text-sm" dir="ltr">
                    {prod.salesPrice.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} SAR
                  </span>
                </div>

                {prod.onHandQty !== undefined && prod.type === 'product' && (
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground text-[11px]">في اليد:</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {prod.onHandQty} {prod.uom}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
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
                  اسم المنتج
                </th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">
                  المرجع الداخلي
                </th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">
                  سعر البيع
                </th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">
                  التكلفة
                </th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">
                  الكمية في اليد
                </th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">
                  نوع المنتج
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((prod) => {
                const isSelected = selectedIds.includes(prod.id);
                return (
                  <tr
                    key={prod.id}
                    className={`group transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                    }`}
                    onClick={() => handleOpenProduct(prod.id)}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(prod.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2.5">
                      <div
                        className="h-7 w-7 rounded-md flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: prod.avatarColor || '#3b82f6' }}
                      >
                        {prod.name.trim().charAt(0) || 'م'}
                      </div>
                      <span>{prod.name}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs" dir="ltr">
                      {prod.internalReference || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-foreground" dir="ltr">
                      {prod.salesPrice.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} SAR
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground" dir="ltr">
                      {prod.cost.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} SAR
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {prod.type === 'product' ? `${prod.onHandQty || 0} ${prod.uom}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {prod.type === 'product' && <span className="text-xs">قابل للتخزين</span>}
                      {prod.type === 'service' && <span className="text-xs text-primary font-medium">خدمة</span>}
                      {prod.type === 'consu' && <span className="text-xs text-muted-foreground">استهلاكي</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
