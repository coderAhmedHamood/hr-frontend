'use client';

import Link from 'next/link';
import { Package, Truck, Warehouse, ClipboardList, ArrowLeftRight } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import { Button } from '@/components/ui/button';

const QUICK_LINKS = [
  {
    title: 'المستودعات',
    description: 'إدارة المستودعات والمواقع والعمليات الخاصة بكل مستودع.',
    href: inventoryAdminRoutes.warehouses,
    icon: Warehouse,
  },
  {
    title: 'التحويلات',
    description: 'تحويلات عامة بين المستودعات — تظهر أيضًا داخل كل مستودع.',
    href: inventoryAdminRoutes.transfers,
    icon: Truck,
  },
  {
    title: 'الإيصالات والتوصيلات',
    description: 'عمليات وارد وصادر على مستوى التطبيق أو داخل مستودع محدد.',
    href: inventoryAdminRoutes.receipts,
    icon: Package,
  },
  {
    title: 'الجرد المادي',
    description: 'مطابقة الكمية المعدودة مع الرصيد النظامي.',
    href: inventoryAdminRoutes.physicalCounts,
    icon: ClipboardList,
  },
  {
    title: 'الحركات الداخلية',
    description: 'نقل بين المواقع داخل نفس المستودع.',
    href: inventoryAdminRoutes.internal,
    icon: ArrowLeftRight,
  },
] as const;

export function InventoryOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <SetPageTitle titleAr="المخزون" iconName="Package" />

      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">نظرة عامة على المخزون</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          تطبيق مخازن مستقل: عمليات عامة من القائمة العلوية، وعمليات خاصة داخل كل مستودع. الرصيد يتحدث عبر
          Inventory Service ودفتر الحركات.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/35 hover:bg-primary/5"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
              <Button variant="ghost" size="sm" className="mt-auto w-fit px-0 text-primary">
                فتح
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
