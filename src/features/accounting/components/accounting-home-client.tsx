'use client';

import Link from 'next/link';
import { Calculator, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AccountingHomeClient() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-1 flex-col items-center justify-center px-4 py-10" dir="rtl">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
          <Calculator className="h-10 w-10 text-primary" strokeWidth={1.45} />
        </span>

        <h1 className="font-display text-2xl font-bold text-foreground">المحاسبة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          تطبيق المحاسبة قيد التطوير حالياً. ستتوفر هنا إدارة الحسابات والقيود والتقارير المالية قريباً.
        </p>

        <Button asChild variant="luxe" size="sm" className="mt-6 gap-1.5">
          <Link href="/">
            <LayoutGrid className="h-3.5 w-3.5" />
            العودة للتطبيقات
          </Link>
        </Button>
      </div>
    </div>
  );
}
