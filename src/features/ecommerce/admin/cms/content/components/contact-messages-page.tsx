'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquareWarning, Lightbulb, X } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { listCmsContactMessages } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type { StoreContactMessageDto, StoreContactMessageType } from '@/features/ecommerce/shared/lib/api/store-content-api';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DisplayDate } from '@/components/ui/table-cells';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';

const PAGE_SIZE = 20;

const TYPE_LABEL: Record<StoreContactMessageType, string> = {
  complaint: 'شكوى',
  suggestion: 'مقترح',
};

const TYPE_BADGE: Record<StoreContactMessageType, { variant: 'destructive' | 'success'; icon: typeof MessageSquareWarning }> = {
  complaint: { variant: 'destructive', icon: MessageSquareWarning },
  suggestion: { variant: 'success', icon: Lightbulb },
};

function TypeBadge({ type }: { type: StoreContactMessageType }) {
  const { variant, icon: Icon } = TYPE_BADGE[type];
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {TYPE_LABEL[type]}
    </Badge>
  );
}

export function ContactMessagesPage() {
  const companyId = getStorefrontCompanyId();
  const [page, setPage] = React.useState(1);
  const [type, setType] = React.useState<'all' | StoreContactMessageType>('all');
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [viewing, setViewing] = React.useState<StoreContactMessageDto | null>(null);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const query = {
    page,
    limit: PAGE_SIZE,
    type: type === 'all' ? undefined : type,
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['cms', 'contact-messages', companyId, query],
    queryFn: () => listCmsContactMessages(companyId, query),
  });

  const hasActiveFilters = type !== 'all' || Boolean(search) || Boolean(dateFrom) || Boolean(dateTo);

  function clearFilters() {
    setType('all');
    setSearchInput('');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  const columns: ColumnDef<StoreContactMessageDto>[] = [
    {
      key: 'name',
      title: 'الاسم',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
            {[row.email, row.phone].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'النوع',
      render: (row) => <TypeBadge type={row.type} />,
    },
    {
      key: 'message',
      title: 'الرسالة',
      render: (row) => (
        <p className="max-w-md truncate text-sm text-foreground">{row.message}</p>
      ),
    },
    {
      key: 'createdAt',
      title: 'التاريخ',
      render: (row) => <DisplayDate value={row.createdAt} mode="datetime" />,
    },
  ];

  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="رسائل التواصل"
        descriptionAr="رسائل نموذج التواصل من واجهة المتجر — شكاوى ومقترحات العملاء"
        iconName="Mail"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="بحث بالاسم أو البريد أو الجوال أو نص الرسالة…"
          className="h-9 w-full sm:w-64"
        />
        <Select value={type} onValueChange={(value) => { setType(value as typeof type); setPage(1); }}>
          <SelectTrigger className="h-9 w-full sm:w-40" aria-label="نوع الرسالة">
            <SelectValue placeholder="كل الأنواع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            <SelectItem value="complaint">شكوى</SelectItem>
            <SelectItem value="suggestion">مقترح</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="h-9 w-full sm:w-auto"
          aria-label="من تاريخ"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="h-9 w-full sm:w-auto"
          aria-label="إلى تاريخ"
        />
        {hasActiveFilters ? (
          <Button type="button" variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            إزالة الفلاتر
          </Button>
        ) : null}
      </div>

      {isError ? (
        <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm">
          <p className="text-destructive">تعذر تحميل الرسائل.</p>
          <button type="button" className="mt-2 text-primary underline" onClick={() => refetch()}>
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          keyExtractor={(row) => row.id}
          loading={isLoading}
          emptyText={hasActiveFilters ? 'لا توجد رسائل مطابقة للفلاتر.' : 'لا توجد رسائل بعد.'}
          onRowClick={(row) => setViewing(row)}
          alwaysShowTable
        />
      )}

      {total > 0 ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            عرض {from}–{to} من {total}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              السابق
            </Button>
            <span className="text-xs">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={viewing != null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewing ? <TypeBadge type={viewing.type} /> : null}
              {viewing?.name}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-xs text-muted-foreground" dir="ltr">
              {[viewing?.email, viewing?.phone].filter(Boolean).join(' · ') || '—'}
            </p>
            {viewing ? <DisplayDate value={viewing.createdAt} mode="datetime" /> : null}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {viewing?.message}
            </p>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
