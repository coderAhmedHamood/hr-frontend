'use client';

import Link from 'next/link';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, RequestTypeLabel } from '@/components/shared/status-badge';
import { DisplayDate } from '@/components/ui/table-cells';
import { Empty } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import { EmployeeProfilePagedList } from '@/features/hr/organization/employees/components/employee-profile-paged-list';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import type { RequestStatusFilter } from '@/features/hr/organization/employees/hooks/useEmployeeProfileRequests';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_LABELS: Record<Exclude<RequestStatusFilter, 'all'>, string> = {
  pending: 'قيد الانتظار',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
  cancelled: 'ملغاة',
};

export function EmployeeRequestsSection({ model }: { model: EmployeeProfileModel }) {
  const {
    employee,
    employeeRequests,
    requestsLoading,
    requestsPagination,
    requestsCounts,
    requestsError,
    requestStatusFilter,
    setRequestStatusFilter,
    hasRequestFilters,
    setActiveSection,
  } = model;

  if (requestsLoading && employeeRequests.length === 0 && !requestsError) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحميل الطلبات…
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-arabic-display text-lg font-semibold tracking-tight text-foreground">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            الطلبات
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            طلبات الموظف العامة — تصحيح حضور، استئذان، سفر، وغيرها
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-9 shrink-0 gap-1.5 text-xs" asChild>
          <Link href="/hr/requests/attendance-corrections">
            <ExternalLink className="h-3.5 w-3.5" />
            إدارة الطلبات
          </Link>
        </Button>
      </div>

      {requestsError ? (
        <div className="shrink-0 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {requestsError}
        </div>
      ) : null}

      <div className="flex h-[68vh] min-h-[400px] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            سجل الطلبات
            {hasRequestFilters ? (
              <span className="mr-2 text-xs font-normal text-muted-foreground">
                ({requestsPagination.total} من {requestsCounts.total})
              </span>
            ) : (
              <span className="mr-2 text-xs font-normal text-muted-foreground">
                ({requestsCounts.total})
              </span>
            )}
          </h3>
          <Select
            value={requestStatusFilter}
            onValueChange={(v) => setRequestStatusFilter(v as RequestStatusFilter)}
          >
            <SelectTrigger className="h-8 w-[11rem] bg-background text-xs">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {(Object.entries(STATUS_LABELS) as [Exclude<RequestStatusFilter, 'all'>, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EmployeeProfilePagedList
            fillParent
            items={employeeRequests}
            serverPagination={requestsPagination}
            loading={requestsLoading}
            empty={(
              <Empty
                icon={FileText}
                text={
                  hasRequestFilters
                    ? 'لا توجد طلبات مطابقة للفلتر الحالي'
                    : `لا توجد طلبات لـ ${employee.name}`
                }
              />
            )}
            renderItems={(pageRequests) => (
              <div className="overflow-hidden rounded-lg border border-border/50">
                <div className="hidden border-b border-border/60 bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1fr)_5.5rem] sm:gap-3">
                  <span>نوع الطلب</span>
                  <span>الوصف</span>
                  <span>تاريخ التقديم</span>
                  <span className="text-center">الحالة</span>
                </div>
                <div className="divide-y divide-border/60">
                  {pageRequests.map((req) => (
                    <div
                      key={req.id}
                      className="grid gap-2 px-4 py-3 transition-colors hover:bg-muted/25 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1fr)_5.5rem] sm:items-center sm:gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          <RequestTypeLabel type={req.type} />
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {req.requestTypeNameAr}
                          {req.subtypeNameAr ? ` · ${req.subtypeNameAr}` : ''}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="  text-sm leading-relaxed text-foreground/90">
                          {req.title}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground sm:text-sm">
                        <DisplayDate value={req.submittedAt} mode="datetime" />
                        {req.decidedAt ? (
                          <p className="mt-0.5 text-[10px]">
                            قرار: <DisplayDate value={req.decidedAt} mode="datetime" />
                          </p>
                        ) : null}
                      </div>
                      <div className="flex sm:justify-center">
                        <StatusBadge
                          status={req.status}
                          labelOverride={STATUS_LABELS[req.status]}
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

      <p className="shrink-0 text-center text-[11px] text-muted-foreground">
        طلبات الإجازة في قسم{' '}
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={() => setActiveSection('leaves')}
        >
          الإجازات
        </button>
      </p>
    </section>
  );
}
