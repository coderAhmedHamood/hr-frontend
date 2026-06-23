'use client';

import * as React from 'react';
import {
  Plus, Pencil, Trash2, AlertTriangle, Loader2, Coins,
  LayoutGrid, List,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { ArchiveScopeToggleButton } from '@/components/layouts/archive-scope-toggle-button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { allowanceTypesApi,
  type AllowanceTypeDto,
  type CreateAllowanceTypeDto,
  type UpdateAllowanceTypeDto,
  type AllowanceCalculationType,
} from '@/features/hr/contracts/lib/api/allowance-types';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, useServerDirectoryPagination } from '@/components/ui/paged-list';
import { TableRowActions } from '@/components/ui/table-cells';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  ORGANIZATION_ARCHIVE_SCOPE_OPTIONS,
  payrollListArchiveQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';

// ── helpers ───────────────────────────────────────────────────────────────────

const CALC_TYPE_LABEL: Record<AllowanceCalculationType, string> = {
  fixed_amount:     'مبلغ ثابت',
  percent_of_basic: 'نسبة من الأساسي',
};

function fmtAmount(item: AllowanceTypeDto): string {
  if (item.calculationType === 'fixed_amount' && item.typicalAmount) {
    return `${parseFloat(item.typicalAmount).toLocaleString('ar-SA')} ${item.currency}`;
  }
  if (item.calculationType === 'percent_of_basic' && item.typicalPercent) {
    return `${parseFloat(item.typicalPercent)}%`;
  }
  return '—';
}

// ── form types ────────────────────────────────────────────────────────────────

type DraftForm = {
  code: string;
  nameAr: string;
  calculationType: AllowanceCalculationType;
  typicalAmount: string;
  typicalPercent: string;
  currency: string;
  isActive: boolean;
  notes: string;
};

const EMPTY_FORM: DraftForm = {
  code: '', nameAr: '', calculationType: 'fixed_amount',
  typicalAmount: '', typicalPercent: '', currency: 'SAR',
  isActive: true, notes: '',
};

function formFromDto(dto: AllowanceTypeDto): DraftForm {
  return {
    code: dto.code,
    nameAr: dto.nameAr,
    calculationType: dto.calculationType,
    typicalAmount: dto.typicalAmount ?? '',
    typicalPercent: dto.typicalPercent ?? '',
    currency: dto.currency,
    isActive: dto.isActive,
    notes: dto.notes ?? '',
  };
}

// ── form dialog ────────────────────────────────────────────────────────────────

function AllowanceTypeDialog({
  open, onOpenChange, editItem, companyId, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editItem: AllowanceTypeDto | null;
  companyId: string;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<DraftForm>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) { setForm(editItem ? formFromDto(editItem) : EMPTY_FORM); setError(null); }
  }, [open, editItem]);

  const patch = (p: Partial<DraftForm>) => setForm((f) => ({ ...f, ...p }));

  const handleSave = async () => {
    if (!form.nameAr.trim()) { setError('الاسم العربي مطلوب'); return; }
    if (!form.code.trim()) { setError('الكود مطلوب'); return; }
    setSaving(true); setError(null);
    try {
      const fields: UpdateAllowanceTypeDto = {
        code: form.code.trim(),
        nameAr: form.nameAr.trim(),
        nameEn: null,
        calculationType: form.calculationType,
        typicalAmount: form.calculationType === 'fixed_amount' && form.typicalAmount ? Number(form.typicalAmount) : null,
        typicalPercent: form.calculationType === 'percent_of_basic' && form.typicalPercent ? Number(form.typicalPercent) : null,
        currency: form.currency || 'SAR',
        isActive: form.isActive,
        notes: form.notes.trim() || null,
      };
      if (editItem) {
        await allowanceTypesApi.update(editItem.id, fields);
        toast.success('تم تحديث نوع البدل');
      } else {
        const createPayload: CreateAllowanceTypeDto = {
          companyId,
          code: fields.code!,
          nameAr: fields.nameAr!,
          nameEn: fields.nameEn,
          calculationType: fields.calculationType!,
          typicalAmount: fields.typicalAmount,
          typicalPercent: fields.typicalPercent,
          currency: fields.currency,
          isActive: fields.isActive,
          notes: fields.notes,
        };
        await allowanceTypesApi.create(createPayload);
        toast.success('تمت إضافة نوع البدل');
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'allowance-types.save');
      setError(displayMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            {editItem ? 'تعديل نوع البدل' : 'إضافة نوع بدل جديد'}
          </DialogTitle>
          <DialogDescription className="text-xs">أنواع البدلات المعتمدة في كتالوج الشركة</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Name + Code */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">الاسم العربي <span className="text-destructive">*</span></Label>
              <Input value={form.nameAr} onChange={(e) => patch({ nameAr: e.target.value })} placeholder="بدل سكن" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">الكود <span className="text-destructive">*</span></Label>
              <Input value={form.code} onChange={(e) => patch({ code: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="housing" className="h-9 font-mono" dir="ltr" />
            </div>
          </div>

          {/* Calc type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">طريقة الاحتساب</Label>
            <Select value={form.calculationType} onValueChange={(v) => patch({ calculationType: v as AllowanceCalculationType })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed_amount">مبلغ ثابت</SelectItem>
                <SelectItem value="percent_of_basic">نسبة من الراتب الأساسي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            {form.calculationType === 'fixed_amount' ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">المبلغ الافتراضي</Label>
                <Input type="number" value={form.typicalAmount} onChange={(e) => patch({ typicalAmount: e.target.value })} placeholder="2500" className="h-9" dir="ltr" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">النسبة الافتراضية (%)</Label>
                <Input type="number" value={form.typicalPercent} onChange={(e) => patch({ typicalPercent: e.target.value })} placeholder="10" className="h-9" dir="ltr" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">العملة</Label>
              <Input value={form.currency} onChange={(e) => patch({ currency: e.target.value })} placeholder="SAR" className="h-9 font-mono" dir="ltr" />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">ملاحظات (اختياري)</Label>
            <Textarea value={form.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="تفاصيل إضافية…" className="min-h-[56px] resize-none text-sm" />
          </div>

          {/* Active */}
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border px-4 py-3 transition-all hover:bg-muted/20">
            <div>
              <p className="text-sm font-medium">نشط</p>
              <p className="text-xs text-muted-foreground">يمكن إيقاف النوع مؤقتاً دون حذفه</p>
            </div>
            <Switch checked={form.isActive} onCheckedChange={(v) => patch({ isActive: v })} />
          </label>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div>
          )}
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button variant="luxe" onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {editItem ? 'حفظ التعديلات' : 'إضافة'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── card view ──────────────────────────────────────────────────────────────────

function AllowanceCard({
  item,
  onEdit,
  onDelete,
}: {
  item: AllowanceTypeDto;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPercent = item.calculationType === 'percent_of_basic';
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-px">
      {/* top accent */}
      <div className={cn(
        'h-0.5 w-full shrink-0',
        isPercent
          ? 'bg-gradient-to-r from-amber-400/50 via-amber-400 to-amber-400/50'
          : 'bg-gradient-to-r from-primary/40 via-primary to-primary/40',
      )} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Row 1: icon · name · status */}
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            isPercent ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary',
          )}>
            <Coins className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
              {item.nameAr}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground/70" dir="ltr">{item.code}</p>
          </div>
          <Badge variant={item.isActive ? 'success' : 'secondary'} className="shrink-0 text-[9px] px-1.5 py-px">
            {item.isActive ? 'نشط' : 'موقوف'}
          </Badge>
        </div>

        {/* Row 2: calc type · amount */}
        <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2">
          <span className="text-[11px] text-muted-foreground">{CALC_TYPE_LABEL[item.calculationType]}</span>
          <span className={cn('font-mono text-sm font-bold tabular-nums', isPercent ? 'text-amber-600' : 'text-primary')}>
            {fmtAmount(item)}
          </span>
        </div>
      </div>

      {/* actions */}
      <div className="flex items-center gap-1 border-t border-border/50 bg-muted/10 px-3 py-2">
        <Button variant="ghost" size="sm" type="button" className="h-7 gap-1 px-2 text-xs" onClick={onEdit}>
          <Pencil className="h-3 w-3" /> تعديل
        </Button>
        <Button
          variant="ghost" size="sm" type="button"
          className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" /> حذف
        </Button>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

export function AllowanceTypesClient() {
  useSetPageTitle({
    titleAr: 'أنواع البدلات',
    descriptionAr: 'كتالوج البدلات المعتمدة في الشركة — مبلغ ثابت أو نسبة من الأساسي.',
    iconName: 'Coins',
  });

  const companyId = useDefaultCompanyId() ?? '';

  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'card' | 'table'>('card');

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as AllowanceTypeDto[], total: 0 };
    try {
      const res = await allowanceTypesApi.getAll({
        companyId,
        page,
        limit: pageSize,
        ...payrollListArchiveQuery(),
      });
      setError(null);
      return { items: res.items, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'allowance-types.load');
      setError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [companyId, archiveScope]);

  const {
    items,
    loading,
    pagination,
    reload: load,
  } = useServerDirectoryPagination<AllowanceTypeDto>(loadPage, {
    enabled: !!companyId,
    resetDeps: [companyId, viewMode, archiveScope],
  });

  const [formOpen, setFormOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<AllowanceTypeDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AllowanceTypeDto | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await allowanceTypesApi.remove(deleteTarget.id);
      toast.success('تم حذف نوع البدل');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'allowance-types.delete');
      toast.error(displayMessage);
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (item: AllowanceTypeDto) => { setEditItem(item); setFormOpen(true); };
  const openAdd = () => { setEditItem(null); setFormOpen(true); };

  const columns = React.useMemo((): ColumnDef<AllowanceTypeDto>[] => [
    {
      key: 'name',
      title: 'الاسم',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
            item.calculationType === 'percent_of_basic' ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary',
          )}>
            <Coins className="h-3.5 w-3.5" />
          </div>
          <span className="font-medium">{item.nameAr}</span>
        </div>
      ),
    },
    {
      key: 'code',
      title: 'الكود',
      render: (item) => <span className="font-mono text-xs text-muted-foreground" dir="ltr">{item.code}</span>,
    },
    {
      key: 'calcType',
      title: 'طريقة الاحتساب',
      render: (item) => <Badge variant="subtle" className="text-[10px]">{CALC_TYPE_LABEL[item.calculationType]}</Badge>,
    },
    {
      key: 'amount',
      title: 'المبلغ',
      render: (item) => (
        <span className={cn(
          'font-mono text-sm font-semibold tabular-nums',
          item.calculationType === 'percent_of_basic' ? 'text-amber-600' : 'text-primary',
        )}>
          {fmtAmount(item)}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'الحالة',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (item) => (
        <Badge variant={item.isActive ? 'success' : 'secondary'} className="text-[9px] px-1.5 py-px">
          {item.isActive ? 'نشط' : 'موقوف'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'text-center',
      render: (item) => (
        <TableRowActions
          menuItems={[
            { label: 'تعديل', onClick: () => openEdit(item), icon: <Pencil className="h-3.5 w-3.5" /> },
            {
              label: 'حذف',
              onClick: () => setDeleteTarget(item),
              icon: <Trash2 className="h-3.5 w-3.5" />,
              destructive: true,
              separator: true,
            },
          ]}
        />
      ),
    },
  ], []);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <ArchiveScopeToggleButton scope={archiveScope} onScopeChange={setArchiveScope} />
        {/* View toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors', viewMode === 'card' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
            title="عرض البطاقات"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors', viewMode === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
            title="عرض الجدول"
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5" /> نوع بدل جديد
        </Button>
      </div>
    ),
    [archiveScope, viewMode],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        onDateBoundsChange={() => {}}
        inlineSelects={[
          {
            id: 'archive',
            value: archiveScope,
            onChange: (v) => setArchiveScope(v as OrganizationArchiveScope),
            placeholder: 'العرض',
            options: ORGANIZATION_ARCHIVE_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          },
        ]}
      />
    ),
    [archiveScope],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : !loading && items.length === 0 && pagination.total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Coins className="h-7 w-7" />
          </div>
          <p className="font-display text-base font-semibold">لا توجد أنواع بدلات بعد</p>
          <p className="text-sm text-muted-foreground">أضف أول نوع بدل لكتالوج الشركة</p>
          <Button variant="luxe" size="sm" className="mt-1 gap-1.5" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" /> نوع بدل جديد
          </Button>
        </div>
      ) : (
        <DirectoryPagedViews items={items} serverPagination={pagination} loading={loading}>
          {(pageItems) => (
            viewMode === 'card' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageItems.map((item) => (
            <AllowanceCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </div>
            ) : (
        <DataTable
          variant="directory"
          alwaysShowTable
          columns={columns}
          data={pageItems}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => openEdit(item)}
        />
            )
          )}
        </DirectoryPagedViews>
      )}

      {/* Form dialog */}
      <AllowanceTypeDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        companyId={companyId}
        onSaved={load}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm border-border" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> حذف نوع البدل
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف «{deleteTarget?.nameAr}»؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Trash2 className="h-4 w-4" /> حذف
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
