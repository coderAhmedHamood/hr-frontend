'use client';

import * as React from 'react';
import { History, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DateRangeFilterTrigger } from '@/components/ui/date-range-filter-trigger';
import type { PeriodRange } from '@/components/ui/list-filter-bar';
import { FilterSelect } from '@/components/ui/select-with-clear';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell } from '@/components/ui/table-cells';
import { cn } from '@/shared/utils';
import { EmployeeProfilePagedList } from '@/features/hr/organization/employees/components/employee-profile-paged-list';
import type {
  AuditChangeSummaryDto,
  AuditEntityScope,
} from '@/features/hr/organization/employees/lib/api/employee-profile';
import type { useEmployeeProfileAuditLog } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAuditLog';

const AUDIT_SCOPE_LABELS: Record<AuditEntityScope, string> = {
  employee: 'بيانات الموظف',
  assignment: 'الإسناد',
  contract: 'العقد',
  payroll: 'الرواتب',
  leave: 'الإجازات',
  attendance: 'الحضور',
  request: 'الطلبات',
  violation: 'المخالفات',
  advance: 'السلف',
  other: 'أخرى',
};

const ALL_SCOPES: AuditEntityScope[] = [
  'employee',
  'assignment',
  'contract',
  'payroll',
  'leave',
  'attendance',
  'request',
  'violation',
  'advance',
];

const ACTION_FILTER_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'CREATE', label: 'إضافة' },
  { value: 'UPDATE', label: 'تعديل' },
  { value: 'DELETE', label: 'حذف' },
];

const SCOPE_FILTER_OPTIONS = [
  { value: 'all', label: 'الكل' },
  ...ALL_SCOPES.map((s) => ({ value: s, label: AUDIT_SCOPE_LABELS[s] })),
];

type AuditLogModel = ReturnType<typeof useEmployeeProfileAuditLog>;

function actionBadgeVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const upper = action.toUpperCase();
  if (upper === 'DELETE') return 'destructive';
  if (upper === 'CREATE') return 'secondary';
  return 'outline';
}

function actionLabel(row: AuditChangeSummaryDto): string {
  if (row.actionNameAr) return row.actionNameAr;
  const upper = row.action.toUpperCase();
  if (upper === 'CREATE') return 'إضافة';
  if (upper === 'UPDATE') return 'تعديل';
  if (upper === 'DELETE') return 'حذف';
  return row.action;
}

function formatValueSnapshot(
  values: Record<string, unknown> | null,
  fields: string[],
): string {
  if (!values) return '—';
  const keys = fields.length > 0 ? fields : Object.keys(values);
  if (keys.length === 0) return '—';
  const subset = Object.fromEntries(keys.map((k) => [k, values[k]]));
  const text = JSON.stringify(subset);
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}

type Props = { audit: AuditLogModel };

export function EmployeeAuditLogPanel({ audit }: Props) {
  const {
    auditChanges,
    auditLoading,
    auditPagination,
    auditError,
    scopeFilter,
    setScopeFilter,
    actionFilter,
    setActionFilter,
    dateRange,
    setDateRange,
  } = audit;

  const columns = React.useMemo((): ColumnDef<AuditChangeSummaryDto>[] => [
    {
      key: 'occurredAt',
      title: 'التاريخ والوقت',
      className: 'whitespace-nowrap align-top',
      headerClassName: 'whitespace-nowrap',
      render: (row) => <TableDateCell value={row.occurredAt} mode="datetime" />,
    },
    {
      key: 'actor',
      title: 'الفاعل',
      className: 'text-xs align-top',
      headerClassName: 'whitespace-nowrap',
      render: (row) => row.actorName?.trim() || row.actorEmail?.trim() || 'النظام',
    },
    {
      key: 'action',
      title: 'الإجراء',
      className: 'align-top',
      headerClassName: 'whitespace-nowrap',
      render: (row) => (
        <Badge variant={actionBadgeVariant(row.action)} className="text-[10px] font-medium">
          {actionLabel(row)}
        </Badge>
      ),
    },
    {
      key: 'scope',
      title: 'النطاق',
      className: 'text-xs text-muted-foreground align-top',
      headerClassName: 'whitespace-nowrap',
      render: (row) => AUDIT_SCOPE_LABELS[row.scope] ?? row.scope,
    },
    {
      key: 'entity',
      title: 'الكيان',
      className: 'align-top',
      render: (row) => (
        <>
          <div className="font-medium text-foreground text-xs">
            {row.entityDisplayName?.trim() || row.description?.trim() || '—'}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5" dir="ltr">
            {row.entityName}
          </div>
        </>
      ),
    },
    {
      key: 'changedFields',
      title: 'الحقول المتغيرة',
      className: 'text-xs align-top max-w-[200px]',
      render: (row) =>
        row.changedFields.length > 0 ? (
          <span className="font-mono text-[10px] break-all" dir="ltr">
            {row.changedFields.join(', ')}
          </span>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        ),
    },
    {
      key: 'oldValues',
      title: 'القيمة القديمة',
      className: cn('text-xs break-words max-w-[280px] align-top font-mono'),
      headerClassName: 'min-w-[140px]',
      render: (row) => (
        <span className={row.oldValues ? 'text-foreground' : 'text-muted-foreground/50'} dir="ltr">
          {formatValueSnapshot(row.oldValues, row.changedFields)}
        </span>
      ),
    },
    {
      key: 'newValues',
      title: 'القيمة الجديدة',
      className: cn('text-xs break-words max-w-[280px] align-top font-mono'),
      headerClassName: 'min-w-[140px]',
      render: (row) => (
        <span className={row.newValues ? 'text-foreground' : 'text-muted-foreground/50'} dir="ltr">
          {formatValueSnapshot(row.newValues, row.changedFields)}
        </span>
      ),
    },
  ], []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
      <div className="pointer-events-none absolute inset-0 dotted-bg opacity-25" aria-hidden />
      <div className="relative space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <History className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">سجل التغييرات</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                سجل النشاط لهذا الموظف — كل إضافة أو تعديل أو حذف على بياناته وعقوده ورواتبه وإجازاته
                وحضوره وطلباته ومخالفاته، مع الفاعل والتاريخ والقيم القديمة والجديدة.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label className="text-xs text-muted-foreground">الفترة</Label>
            <DateRangeFilterTrigger
              value={dateRange}
              onChange={setDateRange}
              placeholder="كل الفترات"
              triggerClassName="h-9 w-full max-w-none text-xs"
              allowEmpty
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">النطاق</Label>
            <FilterSelect
              value={scopeFilter}
              onValueChange={(v) => setScopeFilter(v as typeof scopeFilter)}
              options={SCOPE_FILTER_OPTIONS}
              placeholder="الكل"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">نوع الإجراء</Label>
            <FilterSelect
              value={actionFilter}
              onValueChange={setActionFilter}
              options={ACTION_FILTER_OPTIONS}
              placeholder="الكل"
            />
          </div>
        </div>

        {auditError ? (
          <p className="text-sm text-destructive">{auditError}</p>
        ) : null}

        {auditLoading && auditChanges.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري تحميل سجل التغييرات…
          </div>
        ) : (
          <EmployeeProfilePagedList
            items={auditChanges}
            serverPagination={auditPagination}
            loading={auditLoading}
            empty={
              <p className="py-10 text-center text-sm text-muted-foreground">
                لا توجد سجلات مطابقة للفلتر.
              </p>
            }
            renderItems={(pageItems) => (
              <DataTable
                columns={columns}
                data={pageItems}
                keyExtractor={(row) => row.id}
                emptyText="لا توجد سجلات مطابقة للفلتر."
                alwaysShowTable
                tableClassName="min-w-[1080px] text-right"
              />
            )}
          />
        )}
      </div>
    </div>
  );
}
