'use client';

import * as React from 'react';
import { Building2, Plus } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { systemOwnerRoutes } from '@/features/system-owner/constants/routes';
import {
  useSystemOwnerCompanies,
  useSystemOwnerMutations,
} from '@/features/system-owner/hooks/use-system-owner';
import { OdooAppTile } from '@/features/system/applications/components/odoo-app-tile';
import { resolveIndexedTileClass } from '@/features/system/applications/lib/application-tile-config';

export function SystemOwnerCompaniesPage() {
  const [search, setSearch] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const { data, isLoading, isError } = useSystemOwnerCompanies();
  const { createCompany } = useSystemOwnerMutations();
  const items = data?.items ?? [];
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      [row.nameAr, row.nameEn, row.code, row.city, row.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [items, search]);

  usePageHeaderActions(
    () => (
      <PageHeaderPrimaryButton
        icon={Plus}
        label="شركة جديدة"
        onClick={() => setFormOpen(true)}
      >
        شركة جديدة
      </PageHeaderPrimaryButton>
    ),
    [],
  );

  return (
    <div className="flex flex-col items-center gap-6">
      <SetPageTitle titleAr="الشركات" descriptionAr="كل شركات المنصة" iconName="Building2" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="بحث بالاسم أو الرمز…"
        className="max-w-sm"
      />
      {isError ? (
        <p className="text-sm text-destructive">تعذر تحميل الشركات.</p>
      ) : isLoading ? (
        <div className="odoo-app-grid flex w-full max-w-3xl flex-wrap items-start justify-center gap-x-7 gap-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="odoo-app-tile flex w-[6.5rem] flex-col items-center gap-2 sm:w-[7.25rem]">
              <div className="odoo-app-square h-[4.5rem] w-[4.5rem] animate-pulse rounded-[0.85rem] bg-muted sm:h-20 sm:w-20" />
              <div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد شركات بعد.</p>
      ) : (
        <div className="odoo-app-grid flex w-full max-w-3xl flex-wrap items-start justify-center gap-x-7 gap-y-6">
          {filtered.map((row, index) => (
            <OdooAppTile
              key={row.id}
              icon={Building2}
              label={row.nameAr}
              caption={row.isActive === false ? 'غير نشط' : row.city || row.code || undefined}
              tileClass={resolveIndexedTileClass(index)}
              href={systemOwnerRoutes.companyDetail(row.id)}
              muted={row.isActive === false}
            />
          ))}
        </div>
      )}

      <CreateCompanyDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        saving={createCompany.isPending}
        onSubmit={async (payload) => {
          await createCompany.mutateAsync(payload);
          setFormOpen(false);
        }}
      />
    </div>
  );
}

function CreateCompanyDialog({
  open,
  onOpenChange,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onSubmit: (payload: { nameAr: string; code?: string; nameEn?: string }) => Promise<void>;
}) {
  const [nameAr, setNameAr] = React.useState('');
  const [code, setCode] = React.useState('');
  const [nameEn, setNameEn] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setNameAr('');
      setCode('');
      setNameEn('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>شركة جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="so-name-ar">اسم الشركة</Label>
            <Input id="so-name-ar" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="so-code">الرمز (اختياري)</Label>
            <Input id="so-code" dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="so-name-en">الاسم الإنجليزي (اختياري)</Label>
            <Input id="so-name-en" dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            الشركة الجديدة تحصل على تطبيق النظام فقط. فعّل بقية التطبيقات من صفحة الشركة.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            إلغاء
          </Button>
          <Button
            disabled={saving || !nameAr.trim()}
            onClick={() =>
              void onSubmit({
                nameAr: nameAr.trim(),
                code: code.trim() || undefined,
                nameEn: nameEn.trim() || undefined,
              })
            }
          >
            {saving ? 'جاري الإنشاء…' : 'إنشاء'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
