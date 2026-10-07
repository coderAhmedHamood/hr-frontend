'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  PackageMinus,
  PackagePlus,
  PackageX,
  ScanBarcode,
  Truck,
  Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { BarcodeScannerDialog } from '@/components/shared/barcode-scanner-dialog';
import { Button } from '@/components/ui/button';
import { resolveScannedCode } from '@/features/catalog/products/lib/resolve-scanned-code';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';

const QUICK_LINKS = [
  {
    title: 'استلام المخزون',
    description: 'عمليات وارد (استلام) على مستوى التطبيق أو داخل مستودع محدد.',
    href: inventoryAdminRoutes.receipts,
    icon: PackagePlus,
  },
  {
    title: 'صرف المخزون',
    description: 'عمليات صادر (صرف) على مستوى التطبيق أو داخل مستودع محدد.',
    href: inventoryAdminRoutes.deliveries,
    icon: PackageMinus,
  },
  {
    title: 'نقل المواقع',
    description: 'نقل كميات بين مواقع داخل نفس المستودع (رف، منطقة، مخزون).',
    href: inventoryAdminRoutes.internal,
    icon: ArrowLeftRight,
  },
  {
    title: 'بين المستودعات',
    description: 'نقل مخزون من مستودع إلى مستودع آخر (مع موقع مصدر وموقع وجهة).',
    href: inventoryAdminRoutes.transfers,
    icon: Truck,
  },
  {
    title: 'الجرد المادي',
    description: 'مطابقة الكمية المعدودة مع الرصيد النظامي.',
    href: inventoryAdminRoutes.physicalCounts,
    icon: ClipboardList,
  },
  {
    title: 'التالف',
    description: 'إخراج الكميات التالفة من المخزون مع سجل لسببها.',
    href: inventoryAdminRoutes.scrap,
    icon: PackageX,
  },
  {
    title: 'المستودعات',
    description: 'إدارة المستودعات والمواقع والعمليات الخاصة بكل مستودع.',
    href: inventoryAdminRoutes.warehouses,
    icon: Warehouse,
  },
  {
    title: 'رصيد المخزون',
    description: 'كميات كل منتج: المتاح، المنخفض، والنافد.',
    href: inventoryAdminRoutes.reportStock,
    icon: BarChart3,
  },
] as const;

/**
 * Inventory home. On phones (warehouse staff, approved 2026-10-07): a scan
 * button first — find a product and its stock per location — then the daily
 * operations as a two-column grid of shortcuts.
 */
export function InventoryOverviewPage() {
  const router = useRouter();
  const companyId = getInventoryCompanyId();
  const [scanOpen, setScanOpen] = React.useState(false);

  async function openScannedProduct(code: string) {
    try {
      const item = await resolveScannedCode(companyId, code);
      if (!item) {
        toast.error(`لا يوجد منتج بالرمز ${code}`);
        return;
      }
      router.push(inventoryAdminRoutes.productDetail(item.productId));
    } catch {
      // The API client already showed why.
    }
  }

  return (
    <div className="flex flex-col gap-6 max-sm:gap-4">
      <SetPageTitle titleAr="المخزون" iconName="Package" />

      <div className="space-y-1 max-sm:hidden">
        <h1 className="text-xl font-semibold text-foreground">نظرة عامة على المخزون</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          تطبيق مخازن مستقل: عمليات عامة من القائمة العلوية، وعمليات خاصة داخل كل مستودع. الرصيد يتحدث عبر
          Inventory Service ودفتر الحركات.
        </p>
      </div>

      <Button
        type="button"
        size="lg"
        className="h-14 w-full gap-2 rounded-2xl text-base sm:h-11 sm:w-fit sm:text-sm"
        disabled={!companyId}
        onClick={() => setScanOpen(true)}
      >
        <ScanBarcode className="h-5 w-5" />
        البحث عن منتج بالمسح
      </Button>
      <BarcodeScannerDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        title="البحث عن منتج بالمسح"
        onCode={(code) => void openScannedProduct(code)}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/35 hover:bg-primary/5 max-sm:items-center max-sm:gap-2 max-sm:p-3 max-sm:text-center"
            >
              <div className="flex items-center gap-2 max-sm:flex-col">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary max-sm:h-11 max-sm:w-11">
                  <Icon className="h-4 w-4 max-sm:h-5 max-sm:w-5" />
                </span>
                <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground max-sm:hidden">{item.description}</p>
              <span className="mt-auto text-sm font-medium text-primary max-sm:hidden">فتح</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
