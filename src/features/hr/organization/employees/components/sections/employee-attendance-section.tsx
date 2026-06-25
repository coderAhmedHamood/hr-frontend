'use client';

import {
  X,
  Clock,
  Layers,
  Link2,
  MapPinned,
  Unlink,
  Settings2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SingleDatePicker } from '@/components/ui/single-date-picker';
import { cn, formatDate } from '@/shared/utils';
import { EmployeeAttendanceDialogs } from '@/features/hr/organization/employees/components/dialogs/EmployeeAttendanceDialogs';
import { EmployeeAttendanceRecentEvents } from '@/features/hr/organization/employees/components/sections/employee-attendance-recent-events';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeeAttendanceSection({ model }: { model: EmployeeProfileModel }) {
  const {
    employee,
    attFrom,
    setAttFrom,
    attTo,
    setAttTo,
    effectiveRange,
    employeeAssignments,
    shiftTemplates,
    employeeCheckpoints,
    checkpoints,
    openShiftDialog,
    openCpDialog,
    shiftOpen,
    setShiftOpen,
    shiftTemplateId,
    setShiftTemplateId,
    shiftDate,
    setShiftDate,
    shiftUnlinkTarget,
    setShiftUnlinkTarget,
    submitShift,
    removeAssignment,
    cpOpen,
    setCpOpen,
    cpDate,
    setCpDate,
    cpSel,
    setCpSel,
    cpQuery,
    setCpQuery,
    cpUnlinkTarget,
    setCpUnlinkTarget,
    submitCpLink,
    removeCheckpointLink,
    employeeEvents,
    attendanceEventsLoading,
    linksLoadError,
  } = model;

  return (
    <section className="flex flex-col gap-3">
      {linksLoadError ? (
        <p className="shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {linksLoadError}
        </p>
      ) : null}

      <div className="shrink-0 rounded-xl border border-border/60 bg-card/50">
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <Settings2 className="h-3.5 w-3.5" />
          إعدادات الحضور — الشيفت ونقاط التسجيل
        </div>
        <div className="grid grid-cols-1 gap-4 p-3 md:grid-cols-2">
          <div className="rounded-lg border border-border/50 bg-background/80">
            <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
              <h3 className="text-[11px] font-semibold text-muted-foreground">الشيفت المرتبط</h3>
              <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]" onClick={openShiftDialog}>
                <Layers className="h-3 w-3" /> ربط
              </Button>
            </div>
            <div className="space-y-1.5 p-2">
              {employeeAssignments.length > 0 ? employeeAssignments.map((asg) => {
                const isOpen = asg.openShiftHours != null && asg.openShiftHours > 0;
                const tpl = !isOpen ? shiftTemplates.find((t) => t.id === asg.templateId) : null;
                const templateName = tpl?.nameAr ?? asg.templateNameAr ?? 'شيفت';
                const templateColor = tpl?.colorHex ?? asg.templateColorHex;
                return (
                  <div
                    key={asg.id}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 border-r-2"
                    style={{ borderRightColor: !isOpen && templateColor ? templateColor : undefined }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                        style={!isOpen && templateColor ? { background: `${templateColor}22`, color: templateColor } : undefined}
                      >
                        {isOpen ? <Clock className="h-3.5 w-3.5 text-primary" /> : <Layers className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium">
                          {isOpen ? `شيفت مفتوح · ${asg.openShiftHours ?? '?'} ساعة` : templateName}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground" dir="ltr">{asg.effectiveFrom}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => setShiftUnlinkTarget(asg.id)}>
                      <Unlink className="h-3 w-3" />
                    </Button>
                  </div>
                );
              }) : (
                <p className="py-4 text-center text-xs text-muted-foreground">لم يُرتبط بشيفت بعد</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-background/80">
            <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
              <h3 className="text-[11px] font-semibold text-muted-foreground">نقاط التسجيل</h3>
              <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]" onClick={openCpDialog}>
                <Link2 className="h-3 w-3" /> ربط
              </Button>
            </div>
            <div className="space-y-1.5 p-2">
              {employeeCheckpoints.length > 0 ? employeeCheckpoints.map((link) => {
                const cp = checkpoints.find((c) => c.id === link.checkInPointId);
                return (
                  <div
                    key={link.id}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 border-r-2',
                      link.linkActive ? 'border-r-success' : 'border-r-muted-foreground/25',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                        link.linkActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
                      )}
                      >
                        <MapPinned className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium">{cp?.nameAr || 'نقطة تسجيل'}</div>
                        <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">
                          {cp?.latitude?.toFixed(4)}, {cp?.longitude?.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge variant={link.linkActive ? 'success' : 'subtle'} className="h-4 px-1.5 text-[10px]">
                        {link.linkActive ? 'نشط' : 'موقوف'}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => setCpUnlinkTarget(link.id)}>
                        <Unlink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              }) : (
                <p className="py-4 text-center text-xs text-muted-foreground">لا توجد نقاط مرتبطة</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[68vh] min-h-[400px] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">حركات الحضور</h3>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" asChild>
              <Link href="/hr/attendance/daily">
                <ExternalLink className="h-3.5 w-3.5" />
                الكل
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-2 sm:gap-y-2">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">تصفية بالتاريخ:</span>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 lg:flex-initial">
              <SingleDatePicker
                value={attFrom}
                onChange={setAttFrom}
                placeholder="من تاريخ"
                wrapperClassName="min-w-0 w-full sm:w-[10.5rem]"
                className="h-8 min-w-0 text-xs"
              />
              <span className="hidden shrink-0 text-muted-foreground text-xs sm:inline" aria-hidden>←</span>
              <SingleDatePicker
                value={attTo}
                onChange={setAttTo}
                placeholder="إلى تاريخ"
                wrapperClassName="min-w-0 w-full sm:w-[10.5rem]"
                className="h-8 min-w-0 text-xs"
              />
              {(attFrom || attTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setAttFrom('');
                    setAttTo('');
                  }}
                  className="flex shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  مسح
                </button>
              )}
            </div>
            {!attFrom && !attTo ? (
              <span className="text-[10px] text-muted-foreground/70">
                الفترة: {formatDate(effectiveRange.from)} ← {formatDate(effectiveRange.to)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EmployeeAttendanceRecentEvents
            employeeEvents={employeeEvents}
            effectiveFrom={effectiveRange.from}
            effectiveTo={effectiveRange.to}
            loading={attendanceEventsLoading}
          />
        </div>
      </div>

      <EmployeeAttendanceDialogs
        employeeName={employee.name}
        shiftOpen={shiftOpen}
        setShiftOpen={setShiftOpen}
        shiftTemplateId={shiftTemplateId}
        setShiftTemplateId={setShiftTemplateId}
        shiftDate={shiftDate}
        setShiftDate={setShiftDate}
        shiftUnlinkTarget={shiftUnlinkTarget}
        setShiftUnlinkTarget={setShiftUnlinkTarget}
        submitShift={submitShift}
        removeAssignment={removeAssignment}
        cpOpen={cpOpen}
        setCpOpen={setCpOpen}
        cpDate={cpDate}
        setCpDate={setCpDate}
        cpSel={cpSel}
        setCpSel={setCpSel}
        cpQuery={cpQuery}
        setCpQuery={setCpQuery}
        cpUnlinkTarget={cpUnlinkTarget}
        setCpUnlinkTarget={setCpUnlinkTarget}
        submitCpLink={submitCpLink}
        removeCheckpointLink={removeCheckpointLink}
        checkpoints={checkpoints}
        shiftTemplates={shiftTemplates}
        employeeCheckpoints={employeeCheckpoints}
      />
    </section>
  );
}
