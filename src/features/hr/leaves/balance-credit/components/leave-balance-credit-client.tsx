'use client';

import * as React from 'react';
import { CheckCircle2, Plus, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell, TableRowActions, TableRowDetailDialog } from '@/components/ui/table-cells';
import { FormField, EmptyState } from '@/features/hr/requests/components/shared-ui';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { cn, toWesternDigits } from '@/shared/utils';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import { useLeaveBalanceCreditModel } from '@/features/hr/leaves/balance-credit/hooks/useLeaveBalanceCreditModel';
import type { LeaveBalanceCreditRequest } from '@/features/hr/leaves/balance-credit/types';

const CREDIT_STATUS_ORDER: readonly string[] = ['pending', 'approved', 'rejected'];

const CREDIT_STATUS_LABELS: Record<string, string> = {
  pending: 'في الانتظار',
  approved: 'تمت الموافقة',
  rejected: 'مرفوض',
};

function statusBadgeClass(status: LeaveBalanceCreditRequest['status']) {
  if (status === 'pending') return 'bg-gold/15 text-gold border-gold/30';
  if (status === 'approved') return 'bg-success/10 text-success border-success/30';
  return 'bg-muted text-muted-foreground border-border';
}

function statusLabelAr(status: LeaveBalanceCreditRequest['status']) {
  return CREDIT_STATUS_LABELS[status] ?? status;
}

export function LeaveBalanceCreditClient() {
  const m = useLeaveBalanceCreditModel();
  const [detailRow, setDetailRow] = React.useState<LeaveBalanceCreditRequest | null>(null);

  const activeFilterCount = (m.branchId !== 'all' ? 1 : 0) + (m.departmentId !== 'all' ? 1 : 0) + (m.statusFilter !== 'all' ? 1 : 0) + (m.selectedEmpIds.size > 0 ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button
          variant="luxe"
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0"
          onClick={() => { m.resetAddForm(); m.setAddOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5" />
          طلب إضافة رصيد
        </Button>
      </div>
    ),
    [activeFilterCount, m.resetAddForm, m.setAddOpen],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        inlineSelects={[
          { id: 'branch', value: m.branchId, onChange: m.setBranchId, placeholder: 'الفرع', options: m.branchInlineOptions },
          { id: 'dept', value: m.departmentId, onChange: m.setDepartmentId, placeholder: 'القسم', options: m.deptInlineOptions },
        ]}
        empPickerEmployees={m.empPickerList}
        selectedEmpIds={m.selectedEmpIds}
        onSelectedEmpIdsChange={m.setSelectedEmpIds}
        statusFilter={m.statusFilter}
        onStatusFilterChange={m.setStatusFilter}
        statusOrder={CREDIT_STATUS_ORDER}
        statusLabels={CREDIT_STATUS_LABELS}
        statusCounts={m.statusCounts}
        onDateBoundsChange={m.setDateBounds}
        trailingActions={undefined}
      />
    ),
    [
      m.branchId,
      m.departmentId,
      m.statusFilter,
      m.selectedEmpKey,
      m.dateBounds.from,
      m.dateBounds.to,
      m.statusCounts.all,
      m.statusCounts.pending,
      m.statusCounts.approved,
      m.statusCounts.rejected,
      m.empPickerList,
      m.branchInlineOptions,
      m.deptInlineOptions,
    ],
  );

  const columns: ColumnDef<LeaveBalanceCreditRequest>[] = React.useMemo(
    () => [
      {
        key: 'employee',
        title: 'الموظف',
        render: (r) => (
          <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {(r?.employeeNameAr ?? '?').charAt(0)}
            </div>
            <p className="font-medium text-sm">{r?.employeeNameAr ?? '—'}</p>
          </div>
        ),
      },
      {
        key: 'leaveType',
        title: 'نوع الإجازة',
        hideOnMobile: true,
        render: (r) => (
          <span className="text-xs text-muted-foreground">{r.leaveTypeNameAr ?? '—'}</span>
        ),
      },
      {
        key: 'days',
        title: 'عدد الأيام المضافة',
        render: (r) => (
          <span className="font-mono text-sm tabular-nums" dir="ltr">
            +{toWesternDigits(String(r.daysAdded))}
          </span>
        ),
      },
      {
        key: 'reason',
        title: 'الوصف أو العنوان',
        hideOnMobile: true,
        render: (r) => (
          <span className="text-xs text-muted-foreground   max-w-[280px]">{r.reasonAr || '—'}</span>
        ),
      },
      {
        key: 'status',
        title: 'الحالة',
        render: (r) => (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
              statusBadgeClass(r.status),
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                r.status === 'pending'
                  ? 'bg-gold'
                  : r.status === 'approved'
                    ? 'bg-success'
                    : 'bg-muted-foreground',
              )}
            />
            {statusLabelAr(r.status)}
          </span>
        ),
      },
      {
        key: 'createdAt',
        title: 'التاريخ',
        className: 'align-top',
        hideOnMobile: true,
        render: (r) => <TableDateCell value={r.createdAt} mode="datetime" />,
      },
      {
        key: 'actions',
        title: 'إجراء',
        isActions: true,
        render: (r) => {
          if (r.status !== 'pending') {
            return <TableDateCell value={r.decidedAt} mode="datetime" />;
          }
          return (
            <TableRowActions
              primaryActions={[
                {
                  label: 'موافقة',
                  variant: 'success',
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                  onClick: () => void m.approveCreditRequest(r.id),
                },
                {
                  label: 'رفض',
                  variant: 'destructive',
                  icon: <XCircle className="h-3.5 w-3.5" />,
                  onClick: () => void m.rejectCreditRequest(r.id),
                },
              ]}
            />
          );
        },
      },
    ],
    [m.approveCreditRequest, m.rejectCreditRequest],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 animate-fade-in">
      {m.listError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive whitespace-pre-wrap">{m.listError}</p>
      ) : null}

      <div className="space-y-3">
        {m.loading && m.sortedRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">جاري التحميل...</p>
        ) : m.sortedRequests.length === 0 && !m.loading ? (
          <EmptyState title="لا توجد طلبات ضمن الفلاتر" />
        ) : (
          <DirectoryPagedViews
            items={m.sortedRequests}
            serverPagination={m.pagination}
            loading={m.loading}
            resetDeps={[m.branchId, m.departmentId, m.statusFilter, m.selectedEmpKey, m.dateBounds.from, m.dateBounds.to]}
          >
            {(pageItems) => (
          <DataTable
            columns={columns}
            data={pageItems}
            keyExtractor={(r) => r.id}
            emptyText="لا توجد طلبات"
            onRowClick={(r) => setDetailRow(r)}
            mobileCard={(r) => (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(r?.employeeNameAr ?? '?').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{r?.employeeNameAr ?? '—'}</p>
                      <p className="text-[11px] font-mono text-muted-foreground" dir="ltr">
                        {r.createdAt.slice(0, 16).replace('T', ' ')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                      statusBadgeClass(r.status),
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        r.status === 'pending'
                          ? 'bg-gold'
                          : r.status === 'approved'
                            ? 'bg-success'
                            : 'bg-muted-foreground',
                      )}
                    />
                    {statusLabelAr(r.status)}
                  </span>
                </div>
                <p className="text-sm font-mono tabular-nums" dir="ltr">
                  +{toWesternDigits(String(r.daysAdded))} يوماً
                </p>
                <p className="text-[11px] text-muted-foreground">{r.leaveTypeNameAr ?? '—'}</p>
                {r.reasonAr ? <p className="text-[11px] text-muted-foreground line-clamp-3">{r.reasonAr}</p> : null}
                {r.status === 'pending' ? (
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs text-success border-success/40 hover:bg-success/10"
                      onClick={() => void m.approveCreditRequest(r.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> موافقة
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
                      onClick={() => void m.rejectCreditRequest(r.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" /> رفض
                    </Button>
                  </div>
                ) : (
                  <p className="text-[10px] font-mono text-muted-foreground" dir="ltr">
                    {r.decidedAt ? `تاريخ القرار: ${r.decidedAt.slice(0, 10)}` : '—'}
                  </p>
                )}
              </div>
            )}
          />
            )}
          </DirectoryPagedViews>
        )}
      </div>

      <Dialog open={m.addOpen} onOpenChange={(o) => { if (!o) m.resetAddForm(); m.setAddOpen(o); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <form onSubmit={m.handleDialogSubmit}>
            <DialogHeader>
              <DialogTitle>طلب إضافة رصيد</DialogTitle>
              <DialogDescription>
                اختر نوع الإجازة وعدد الأيام المضافة إلى رصيد الموظف. يُسجَّل الطلب بحالة «في الانتظار» حتى الموافقة.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <FormField label="الموظف">
                <Select value={m.employeeId} onValueChange={m.setEmployeeId}>
                  <SelectTrigger className="h-10 w-full rounded-lg border-input bg-background">
                    <SelectValue placeholder="اختر الموظف…" />
                  </SelectTrigger>
                  <SelectContent>
                    {m.empPickerList.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="نوع الإجازة" required>
                <Select value={m.leaveTypeId} onValueChange={m.setLeaveTypeId}>
                  <SelectTrigger className="h-10 w-full rounded-lg border-input bg-background">
                    <SelectValue placeholder="اختر نوع الإجازة…" />
                  </SelectTrigger>
                  <SelectContent>
                    {m.leaveTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              {m.selectedBalance ? (
                <p className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                  الرصيد الحالي ({m.selectedLeaveTypeNameAr}): {toWesternDigits(String(m.selectedBalance.used))}/
                  {toWesternDigits(String(m.selectedBalance.total))}
                </p>
              ) : m.employeeId && m.leaveTypeId ? (
                <p className="text-[11px] text-muted-foreground">
                  لا يوجد رصيد مسجّل لـ {m.selectedLeaveTypeNameAr} — سيُنشأ عند الموافقة.
                </p>
              ) : null}
              <FormField label="عدد الأيام المضافة">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  placeholder="مثال: 3"
                  value={m.daysAddedRaw}
                  onChange={(ev) => m.setDaysAddedRaw(ev.target.value)}
                  className="h-10 font-mono rounded-lg border-input bg-background"
                  dir="ltr"
                />
              </FormField>
              <FormField label="الوصف أو العنوان">
                <Textarea
                  value={m.reasonAr}
                  onChange={(e) => m.setReasonAr(e.target.value)}
                  placeholder="وصف مختصر أو عنوان الطلب…"
                  rows={3}
                  className="min-h-[88px] resize-none rounded-lg border-input bg-background"
                />
              </FormField>
            </div>
            <DialogFooter className={dialogFormFooterClass}>
              <Button type="submit" variant="luxe">
                تسجيل الطلب
              </Button>
              <Button type="button" variant="outline" onClick={() => { m.setAddOpen(false); m.resetAddForm(); }}>
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TableRowDetailDialog
        open={detailRow != null}
        onOpenChange={(o) => !o && setDetailRow(null)}
        title="تفاصيل طلب إضافة الرصيد"
        fields={detailRow ? [
          { label: 'الموظف', value: detailRow.employeeNameAr },
          { label: 'نوع الإجازة', value: detailRow.leaveTypeNameAr ?? '—' },
          { label: 'عدد الأيام', value: `+${toWesternDigits(String(detailRow.daysAdded))}` },
          { label: 'الوصف', value: detailRow.reasonAr || '—' },
          { label: 'الحالة', value: statusLabelAr(detailRow.status) },
          { label: 'تاريخ الطلب', value: <TableDateCell value={detailRow.createdAt} mode="datetime" /> },
          { label: 'تاريخ القرار', value: <TableDateCell value={detailRow.decidedAt} mode="datetime" /> },
        ] : []}
      />
    </div>
  );
}
