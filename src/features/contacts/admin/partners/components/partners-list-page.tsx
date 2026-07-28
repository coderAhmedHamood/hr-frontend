'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Kanban, LayoutGrid, List, Pencil, Plus, Trash2 } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { Button } from '@/components/ui/button';
import { DataTable, AppPagination, type ColumnDef } from '@/components/ui/data-table';
import { DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getContactsCompanyId } from '@/features/contacts/lib/company-id';
import { contactsAdminRoutes } from '@/features/contacts/admin/constants/routes';
import { usePartners } from '@/features/contacts/admin/partners/hooks/use-partners';
import { usePartnerMutations } from '@/features/contacts/admin/partners/hooks/use-partner-mutations';
import { PartnerFormDialog } from '@/features/contacts/admin/partners/components/partner-form-dialog';
import { PartnersCardView } from '@/features/contacts/admin/partners/components/partners-card-view';
import { PartnersKanbanView } from '@/features/contacts/admin/partners/components/partners-kanban-view';
import {
  PartnerRoleBadges,
  PartnerStatusBadge,
} from '@/features/contacts/admin/partners/components/partner-role-badges';
import type { Partner, PartnerStatus } from '@/features/contacts/domain/types/partner';
import { cn } from '@/shared/utils';

type ViewMode = 'list' | 'kanban' | 'cards';

export function PartnersListPage() {
  const companyId = getContactsCompanyId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
  const view = (searchParams.get('view') as ViewMode) || 'list';
  const roleFilter = searchParams.get('role') ?? 'all';
  const statusFilter = (searchParams.get('status') as PartnerStatus | 'all') || 'all';

  const [searchInput, setSearchInput] = React.useState(search);
  const [formState, setFormState] = React.useState<{ open: boolean; partner: Partner | null }>({
    open: false,
    partner: null,
  });
  const [toDelete, setToDelete] = React.useState<Partner | null>(null);

  function updateParams(next: {
    q?: string;
    page?: number;
    pageSize?: number;
    view?: ViewMode;
    role?: string;
    status?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q) params.set('q', next.q);
      else params.delete('q');
    }
    if (next.page !== undefined) {
      if (next.page > 1) params.set('page', String(next.page));
      else params.delete('page');
    }
    if (next.pageSize !== undefined) {
      if (next.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(next.pageSize));
      else params.delete('pageSize');
    }
    if (next.view !== undefined) {
      if (next.view !== 'list') params.set('view', next.view);
      else params.delete('view');
    }
    if (next.role !== undefined) {
      if (next.role !== 'all') params.set('role', next.role);
      else params.delete('role');
    }
    if (next.status !== undefined) {
      if (next.status !== 'all') params.set('status', next.status);
      else params.delete('status');
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const searchRef = React.useRef(search);
  const updateParamsRef = React.useRef(updateParams);
  searchRef.current = search;
  updateParamsRef.current = updateParams;

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput.trim() !== searchRef.current) {
        updateParamsRef.current({ q: searchInput.trim(), page: 1 });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const listQuery = {
    companyId,
    search: search || undefined,
    page: view === 'list' ? page : 1,
    limit: view === 'list' ? pageSize : 200,
    status: statusFilter === 'all' ? undefined : statusFilter,
    isCustomer: roleFilter === 'customer' ? true : undefined,
    isVendor: roleFilter === 'vendor' ? true : undefined,
    isEmployee: roleFilter === 'employee' ? true : undefined,
    isInternal: roleFilter === 'internal' ? true : undefined,
  };

  const { data, isLoading, isError } = usePartners(listQuery);
  const { remove, update } = usePartnerMutations(companyId);

  const openPartner = (partner: Partner) => {
    router.push(contactsAdminRoutes.partnerDetail(partner.id));
  };

  const columns: ColumnDef<Partner>[] = [
    {
      key: 'name',
      title: 'جهة الاتصال',
      render: (row) => (
        <button
          type="button"
          className="flex flex-col text-start transition-colors hover:text-primary"
          onClick={() => openPartner(row)}
        >
          <span className="font-medium text-foreground">{row.displayName}</span>
          {row.refCode ? (
            <span className="text-xs text-muted-foreground" dir="ltr">
              {row.refCode}
            </span>
          ) : null}
        </button>
      ),
    },
    {
      key: 'roles',
      title: 'النوع / الأدوار',
      render: (row) => <PartnerRoleBadges partner={row} />,
    },
    {
      key: 'mobile',
      title: 'الجوال',
      render: (row) => (
        <span className="text-sm text-muted-foreground" dir="ltr">
          {row.mobile || row.phone || '—'}
        </span>
      ),
    },
    {
      key: 'email',
      title: 'البريد',
      render: (row) => (
        <span className="text-sm text-muted-foreground" dir="ltr">
          {row.email || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => <PartnerStatusBadge status={row.status} />,
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
            aria-label="تعديل"
            onClick={() => setFormState({ open: true, partner: row })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="أرشفة" onClick={() => setToDelete(row)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </>
      ),
    },
  ];

  const viewButtons: { mode: ViewMode; icon: typeof List; label: string }[] = [
    { mode: 'list', icon: List, label: 'قائمة' },
    { mode: 'kanban', icon: Kanban, label: 'كانبان' },
    { mode: 'cards', icon: LayoutGrid, label: 'بطاقات' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr="جهات الاتصال" iconName="Users" />

      <ListToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="ابحث بالاسم أو الجوال أو البريد أو الرقم الضريبي…"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border p-0.5">
              {viewButtons.map(({ mode, icon: Icon, label }) => (
                <Button
                  key={mode}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={cn('h-8 gap-1.5', view === mode && 'bg-muted')}
                  onClick={() => updateParams({ view: mode, page: 1 })}
                  aria-label={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              ))}
            </div>

            <Select
              value={roleFilter}
              onValueChange={(value) => updateParams({ role: value, page: 1 })}
            >
              <SelectTrigger className="w-[140px]" aria-label="فلتر الدور">
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأدوار</SelectItem>
                <SelectItem value="customer">عملاء</SelectItem>
                <SelectItem value="vendor">موردون</SelectItem>
                <SelectItem value="employee">موظفون</SelectItem>
                <SelectItem value="internal">داخلي</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => updateParams({ status: value, page: 1 })}
            >
              <SelectTrigger className="w-[130px]" aria-label="فلتر الحالة">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setFormState({ open: true, partner: null })}
              disabled={!companyId}
            >
              <Plus className="h-4 w-4" />
              جهة اتصال جديدة
            </Button>
          </div>
        }
      />

      {!companyId ? (
        <p className="text-sm text-destructive">اختر شركة نشطة لعرض جهات الاتصال.</p>
      ) : null}
      {isError ? <p className="text-sm text-destructive">تعذر تحميل جهات الاتصال.</p> : null}

      {view === 'list' ? (
        <>
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            emptyText="لا توجد جهات اتصال بعد. أنشئ جهة اتصال لتكون المرجع المركزي للنظام."
          />
          {data ? (
            <AppPagination
              page={page}
              pageSize={pageSize}
              total={data.pagination.total}
              onPageChange={(nextPage) => updateParams({ page: nextPage })}
              onPageSizeChange={(size) => updateParams({ pageSize: size, page: 1 })}
            />
          ) : null}
        </>
      ) : null}

      {view === 'cards' ? (
        isLoading ? (
          <p className="text-sm text-muted-foreground">جاري التحميل…</p>
        ) : (
          <PartnersCardView partners={data?.items ?? []} onOpen={openPartner} />
        )
      ) : null}

      {view === 'kanban' ? (
        isLoading ? (
          <p className="text-sm text-muted-foreground">جاري التحميل…</p>
        ) : (
          <PartnersKanbanView
            partners={data?.items ?? []}
            onOpen={openPartner}
            onStatusChange={(partner, status) => {
              void update.mutateAsync({ id: partner.id, patch: { status } });
            }}
          />
        )
      ) : null}

      <PartnerFormDialog
        open={formState.open}
        partner={formState.partner}
        onOpenChange={(open) => setFormState((s) => ({ ...s, open }))}
        onCreated={(created) => router.push(contactsAdminRoutes.partnerDetail(created.id))}
      />

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>أرشفة جهة الاتصال؟</DialogTitle>
            <DialogDescription>
              سيتم أرشفة «{toDelete?.displayName}». السجلات المرتبطة في الوحدات الأخرى ستبقى عبر
              partner_id.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={async () => {
                if (!toDelete) return;
                await remove.mutateAsync(toDelete.id);
                setToDelete(null);
              }}
            >
              أرشفة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
