'use client';

import Link from 'next/link';
import { Calendar, ExternalLink, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate, cn } from '@/shared/utils';
import { Empty, fmtLeaveBalance } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import { EmployeeProfilePagedList } from '@/features/hr/organization/employees/components/employee-profile-paged-list';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import type { EmployeeLeaveBalanceCard } from '@/features/hr/organization/employees/hooks/useEmployeeProfileLeave';
import { FilterSelect } from '@/components/ui/select-with-clear';

function CompactLeaveBalance({
  card,
  onRequestLeave,
}: {
  card: EmployeeLeaveBalanceCard;
  onRequestLeave: () => void;
}) {
  const pctUsed = card.entitled > 0 ? Math.min(100, (card.used / card.entitled) * 100) : 0;
  const barCls = card.accent === 'primary' ? 'bg-primary' : 'bg-success';
  const availCls = card.accent === 'primary' ? 'text-primary' : 'text-success';

  return (
    <div className="flex min-w-[220px] shrink-0 flex-col rounded-xl border border-border/70 bg-card p-3 shadow-xs">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-foreground">{card.title}</span>
        <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
          {card.year}
        </span>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-[width]', barCls)} style={{ width: `${pctUsed}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-1 text-center">
        <div>
          <p className={cn('text-base font-bold tabular-nums', availCls)}>{fmtLeaveBalance(card.available)}</p>
          <p className="text-[10px] text-muted-foreground">متاح</p>
        </div>
        <div>
          <p className="text-base font-bold tabular-nums text-foreground">{fmtLeaveBalance(card.used)}</p>
          <p className="text-[10px] text-muted-foreground">مستخدم</p>
        </div>
        <div>
          <p className="text-base font-bold tabular-nums text-foreground">{fmtLeaveBalance(card.entitled)}</p>
          <p className="text-[10px] text-muted-foreground">الرصيد</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 h-8 w-full text-xs"
        onClick={onRequestLeave}
      >
        طلب إجازة
      </Button>
    </div>
  );
}

export function EmployeeLeavesSection({ model }: { model: EmployeeProfileModel }) {
  const {
    employee,
    leaveBalanceCards,
    leaveSummary,
    openLeaveRequest,
    filteredLeaveRequests,
    leaveRequestsLoading,
    leaveRequestsPagination,
    hasLeaveFilters,
    leavesLoading,
    leavesError,
    leaveTypeFilter,
    setLeaveTypeFilter,
    leaveStatusFilter,
    setLeaveStatusFilter,
    leaveTypeFilterOptions,
    leaveStatusFilterOptions,
    leaveStatusLabels,
  } = model;

  if (leavesLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحميل الإجازات…
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-arabic-display text-lg font-semibold tracking-tight text-foreground">
            <Calendar className="h-5 w-5 shrink-0 text-primary" />
            الإجازات
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">رصيد الإجازات وطلبات الموظف</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="luxe" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => openLeaveRequest()}>
            <Plus className="h-3.5 w-3.5" />
            طلب إجازة
          </Button>
          <Button variant="ghost" size="sm" className="h-9 shrink-0 gap-1.5 text-xs" asChild>
            <Link href="/hr/leaves">
              <ExternalLink className="h-3.5 w-3.5" />
              إدارة الإجازات
            </Link>
          </Button>
        </div>
      </div>

      {leavesError ? (
        <div className="shrink-0 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {leavesError}
        </div>
      ) : null}

      {leaveBalanceCards.length > 0 ? (
        <div className="shrink-0 -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-thin">
          {leaveBalanceCards.map((card) => (
            <CompactLeaveBalance
              key={card.leaveTypeId}
              card={card}
              onRequestLeave={() => openLeaveRequest(card.leaveTypeId)}
            />
          ))}
        </div>
      ) : (
        <div className="shrink-0">
          <Empty icon={Calendar} text="لا توجد أنواع إجازة أو أرصدة مسجّلة" />
        </div>
      )}

      <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            طلبات الإجازة
            {hasLeaveFilters ? (
              <span className="mr-2 text-xs font-normal text-muted-foreground">
                ({leaveRequestsPagination.total} من {leaveSummary.requestCount})
              </span>
            ) : (
              <span className="mr-2 text-xs font-normal text-muted-foreground">
                ({leaveSummary.requestCount})
              </span>
            )}
          </h3>
          <div className="flex flex-wrap gap-2">
            <FilterSelect
              value={leaveTypeFilter}
              onValueChange={(v) => setLeaveTypeFilter(v as typeof leaveTypeFilter)}
              options={leaveTypeFilterOptions}
              placeholder="اختر نوع الإجازة"
            />
            <FilterSelect
              value={leaveStatusFilter}
              onValueChange={(v) => setLeaveStatusFilter(v as typeof leaveStatusFilter)}
              options={leaveStatusFilterOptions}
              placeholder="اختر الحالة"
            />
          </div>
        </div>

        <div className="px-4 pb-4 pt-3">
          <EmployeeProfilePagedList
          items={filteredLeaveRequests}
          serverPagination={leaveRequestsPagination}
          loading={leaveRequestsLoading}
          empty={(
            <Empty
              icon={Calendar}
              text={
                leaveSummary.requestCount > 0
                  ? 'لا توجد طلبات مطابقة للفلتر الحالي'
                  : `لا توجد طلبات إجازة لـ ${employee.name}`
              }
            />
          )}
          renderItems={(pageRequests) => (
            <div className="overflow-hidden rounded-lg border border-border/50">
              <div className="hidden border-b border-border/60 bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_4rem_5.5rem] sm:gap-3">
                <span>نوع الإجازة</span>
                <span>الفترة</span>
                <span className="text-center">الأيام</span>
                <span className="text-center">الحالة</span>
              </div>
              <div className="divide-y divide-border/60">
                {pageRequests.map((req) => (
                  <div
                    key={req.id}
                    className="grid gap-2 px-4 py-3 transition-colors hover:bg-muted/25 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_4rem_5.5rem] sm:items-center sm:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {req.leaveTypeNameAr || 'طلب إجازة'}
                      </p>
                      {req.reasonAr ? (
                        <p className="mt-0.5   text-xs leading-relaxed text-muted-foreground">
                          {req.reasonAr}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground sm:text-sm">
                      {req.startDate ? formatDate(req.startDate) : '—'}
                      {req.endDate ? ` ← ${formatDate(req.endDate)}` : ''}
                    </div>
                    <div className="text-xs font-semibold tabular-nums text-foreground sm:text-center">
                      {req.workingDays != null ? `${req.workingDays} يوم` : '—'}
                    </div>
                    <div className="flex sm:justify-center">
                      <StatusBadge
                        status={req.status}
                        labelOverride={leaveStatusLabels[req.status] ?? req.status}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        />
        </div>
      </div>
    </section>
  );
}
