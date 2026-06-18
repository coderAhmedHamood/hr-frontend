'use client';

import * as React from 'react';
import { History, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell } from '@/components/ui/table-cells';
import { cn } from '@/shared/utils';
import { useEmployees } from '@/features/hr/organization/employees/hooks/useEmployees';
import { useEmployeeAuditLogStore, EMPTY_EMPLOYEE_AUDIT_LOG } from '@/features/hr/organization/employees/lib/employee-audit-log/store';
import { useEmployeeAuditActorStore, AUDIT_ACTOR_SYSTEM } from '@/features/hr/organization/employees/lib/employee-audit-log/actor-store';
import {
  EMPLOYEE_AUDIT_ACTION_LABELS,
  EMPLOYEE_AUDIT_SCOPE_LABELS,
  type EmployeeAuditAction,
  type EmployeeAuditEntry,
  type EmployeeAuditScope,
} from '@/features/hr/organization/employees/lib/employee-audit-log/types';

const ALL_SCOPES: EmployeeAuditScope[] = [
  'personal',
  'permissions',
  'rose-resignation',
  'rose-clearance',
  'rose-settlement',
  'rose-experience',
];

const ALL_ACTIONS: EmployeeAuditAction[] = ['create', 'update', 'delete'];

type Props = { targetEmployeeId: string };

function actionBadgeVariant(a: EmployeeAuditAction): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (a === 'delete') return 'destructive';
  if (a === 'create') return 'secondary';
  return 'outline';
}

export function EmployeeAuditLogPanel({ targetEmployeeId }: Props) {
  const { data: employeesResult } = useEmployees();
  const employees = employeesResult?.items ?? [];
  const entries = useEmployeeAuditLogStore((s) => s.byEmployee[targetEmployeeId] ?? EMPTY_EMPLOYEE_AUDIT_LOG);
  const actorId = useEmployeeAuditActorStore((s) => s.actorEmployeeId);
  const setActorId = useEmployeeAuditActorStore((s) => s.setActorEmployeeId);

  const [q, setQ] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [scope, setScope] = React.useState<string>('all');
  const [action, setAction] = React.useState<string>('all');
  const [actorFilter, setActorFilter] = React.useState<string>('all');

  const actorOptions = React.useMemo(() => {
    const ids = new Set<string>();
    for (const e of entries) {
      if (e.actorEmployeeId) ids.add(e.actorEmployeeId);
      else ids.add(AUDIT_ACTOR_SYSTEM);
    }
    return [...ids];
  }, [entries]);

  const filtered = React.useMemo(() => {
    const qn = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (from && e.at.slice(0, 10) < from) return false;
      if (to && e.at.slice(0, 10) > to) return false;
      if (scope !== 'all' && e.scope !== scope) return false;
      if (action !== 'all' && e.action !== action) return false;
      if (actorFilter !== 'all') {
        const key = e.actorEmployeeId ?? AUDIT_ACTOR_SYSTEM;
        if (key !== actorFilter) return false;
      }
      if (qn) {
        const hay = `${e.labelAr} ${e.fieldKey} ${EMPLOYEE_AUDIT_SCOPE_LABELS[e.scope]} ${e.actorNameAr}`.toLowerCase();
        if (!hay.includes(qn)) return false;
      }
      return true;
    });
  }, [entries, q, from, to, scope, action, actorFilter]);

  const columns = React.useMemo((): ColumnDef<EmployeeAuditEntry>[] => [
    {
      key: 'at',
      title: 'التاريخ والوقت',
      className: 'whitespace-nowrap align-top',
      headerClassName: 'whitespace-nowrap',
      render: (e) => <TableDateCell value={e.at} mode="datetime" />,
    },
    {
      key: 'actor',
      title: 'الفاعل',
      className: 'text-xs align-top',
      headerClassName: 'whitespace-nowrap',
      render: (e) => e.actorNameAr,
    },
    {
      key: 'action',
      title: 'الإجراء',
      className: 'align-top',
      headerClassName: 'whitespace-nowrap',
      render: (e) => (
        <Badge variant={actionBadgeVariant(e.action)} className="text-[10px] font-medium">
          {EMPLOYEE_AUDIT_ACTION_LABELS[e.action]}
        </Badge>
      ),
    },
    {
      key: 'scope',
      title: 'النطاق',
      className: 'text-xs text-muted-foreground align-top',
      headerClassName: 'whitespace-nowrap',
      render: (e) => EMPLOYEE_AUDIT_SCOPE_LABELS[e.scope],
    },
    {
      key: 'field',
      title: 'الحقل',
      className: 'align-top',
      render: (e) => (
        <>
          <div className="font-medium text-foreground text-xs">{e.labelAr}</div>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5" dir="ltr">{e.fieldKey}</div>
        </>
      ),
    },
    {
      key: 'oldValue',
      title: 'القيمة القديمة',
      className: cn('text-xs break-words max-w-[280px] align-top'),
      headerClassName: 'min-w-[140px]',
      render: (e) => (
        <span className={e.oldValue ? 'text-foreground' : 'text-muted-foreground/50'}>
          {e.oldValue || '—'}
        </span>
      ),
    },
    {
      key: 'newValue',
      title: 'القيمة الجديدة',
      className: cn('text-xs break-words max-w-[280px] align-top'),
      headerClassName: 'min-w-[140px]',
      render: (e) => (
        <span className={e.newValue ? 'text-foreground' : 'text-muted-foreground/50'}>
          {e.newValue || '—'}
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
                يُسجَّل كل إضافة أو تعديل أو حذف مع الفاعل والتاريخ والوقت، والقيمة القديمة والجديدة لكل حقل على حدة.
                البحث النصي يشمل الوصف والنطاق والحقل واسم الفاعل فقط — دون مطابقة نص القيم القديمة أو الجديدة.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/15 p-4 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">تسجيل الإجراءات باسم</div>
          <Select value={actorId} onValueChange={setActorId}>
            <SelectTrigger className="h-10 max-w-md rounded-lg bg-background">
              <SelectValue placeholder="اختر الموظف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AUDIT_ACTOR_SYSTEM}>النظام (بدون مستخدم محدد)</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.nameAr} <span className="text-muted-foreground font-mono text-xs">({emp.employeeCode})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" />
              بحث (لا يشمل عمودي القيمة القديمة / الجديدة)
            </Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="مثال: بريد، استقالة، دور…" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">من تاريخ</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">إلى تاريخ</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">النطاق</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {ALL_SCOPES.map((s) => (
                  <SelectItem key={s} value={s}>{EMPLOYEE_AUDIT_SCOPE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">نوع الإجراء</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {ALL_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>{EMPLOYEE_AUDIT_ACTION_LABELS[a]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">الفاعل (المسجّل)</Label>
            <Select value={actorFilter} onValueChange={setActorFilter}>
              <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {actorOptions.map((id) => (
                  <SelectItem key={id} value={id}>
                    {id === AUDIT_ACTOR_SYSTEM ? 'النظام' : employees.find((e) => e.id === id)?.nameAr ?? id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(e) => e.id}
          emptyText="لا توجد سجلات مطابقة للفلتر."
          tableClassName="min-w-[920px] text-right"
        />
      </div>
    </div>
  );
}
