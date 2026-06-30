'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users, UserCheck, FileCheck2, Wallet, Clock,
  Building2, CalendarDays, TrendingUp, UserPlus,
  ShieldAlert, UserX, Timer, ArrowUpRight, ChevronLeft,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, cn, formatNumber, formatDisplayDate } from '@/shared/utils';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useHRViolationCasesStore } from '@/features/hr/discipline/lib/violation-cases-store';
import { useHRContractsStore } from '@/features/hr/contracts/lib/contracts-store';
import { useEmployees } from '@/features/hr/organization/employees/hooks/useEmployees';
import { hrContractsRoutes } from '@/features/hr/contracts/constants/routes';
import { hrPayrollRoutes } from '@/features/hr/payroll/constants/routes';

/* ─── Sparkline ──────────────────────────────────────────────────────────────── */
function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 64; const H = 24;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * (H - 2) - 1}`)
    .join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" className={cn('overflow-visible opacity-80', className)}>
      <polyline points={pts} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(values.length - 1) / (values.length - 1) * W}
        cy={H - ((values[values.length - 1] - min) / range) * (H - 2) - 1}
        r="2.5" fill="currentColor"
      />
    </svg>
  );
}

/* ─── Radial progress ────────────────────────────────────────────────────────── */
function RadialProgress({ value, size = 80, stroke = 7, className }: {
  value: number; size?: number; stroke?: number; className?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cn('-rotate-90', className)}>
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="currentColor" className="text-border" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
        stroke="currentColor" fill="none" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-500 ease-out"
      />
    </svg>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export function DashboardPage() {
  useSetPageTitle({ titleAr: 'لوحة التحكم', descriptionAr: 'نظرة عامة على أداء المنظمة', iconName: 'LayoutDashboard' });

  const { cases }     = useHRViolationCasesStore();
  const { contracts } = useHRContractsStore();
  const { data: employeesResult } = useEmployees();

  const totalEmployees  = employeesResult?.pagination?.total ?? 0;
  const total           = 0;
  const presentCount    = 0;
  const lateCount       = 0;
  const absentCount     = 0;
  const attendanceRate  = 0;
  const pendingRequests = 0;
  const lateEmployees: { id: string; status: 'late' | 'absent'; lateMinutes?: number; employee: { name: string; avatar: string | null; position: string | null } }[] = [];

  const underReviewCases = cases.filter(c => c.status === 'under_review');
  const activeContracts  = contracts.filter(c => c.status === 'active').length;
  const pendingLeaves    = 0;

  const dateAr = formatDisplayDate(new Date().toISOString());

  return (
    <div className="space-y-5 animate-fade-in" dir="rtl">

      {/* ════════════════════════════════════════════════════════════════
          HERO — gradient banner with greeting + live date
      ════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-primary-900 text-primary-foreground shadow-luxe">
        {/* layered glow circles */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary-500 opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-gold opacity-10 blur-2xl" />

        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          {/* greeting */}
          <div>
            <p className="text-[11px] font-medium tracking-widest uppercase text-primary-foreground/50 mb-1">{dateAr}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-primary-foreground leading-snug">
              لوحة التحكم
            </h1>
            <p className="mt-1 text-sm text-primary-foreground/60">
              {presentCount + lateCount} موظف حاضر اليوم من أصل {total}
            </p>
          </div>

          {/* attendance ring + legend */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <RadialProgress value={attendanceRate} size={72} stroke={6} className="text-gold" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-lg font-bold text-primary-foreground leading-none">{attendanceRate}%</span>
                <span className="text-[9px] text-primary-foreground/50">حضور</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 text-[11px]">
              <span className="flex items-center gap-1.5 text-primary-foreground/80"><span className="h-2 w-2 rounded-full bg-success inline-block shrink-0" />{presentCount} حاضر</span>
              <span className="flex items-center gap-1.5 text-primary-foreground/80"><span className="h-2 w-2 rounded-full bg-warning inline-block shrink-0"   />{lateCount} متأخر</span>
              <span className="flex items-center gap-1.5 text-primary-foreground/80"><span className="h-2 w-2 rounded-full bg-destructive inline-block shrink-0"    />{absentCount} غائب</span>
            </div>
          </div>
        </div>

        {/* bottom attendance bar */}
        <div className="flex h-1">
          <div className="bg-success transition-all" style={{ width: `${total ? (presentCount / total) * 100 : 0}%` }} />
          <div className="bg-warning transition-all"   style={{ width: `${total ? (lateCount    / total) * 100 : 0}%` }} />
          <div className="bg-destructive transition-all"    style={{ width: `${total ? (absentCount  / total) * 100 : 0}%` }} />
          <div className="flex-1 bg-primary-foreground/10" />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          KPI GRID — 4 cards with sparklines
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'إجمالي الموظفين',
            value: formatNumber(totalEmployees),
            sub: 'موظف',
            delta: '+4.2%', positive: true,
            icon: Users,
            href: '/hr/organization/employees',
            sparkline: [620, 680, 720, 740, 780, 810, 842],
            accentLight: 'bg-primary/8 border-primary/20',
            iconBg: 'bg-primary/10 text-primary',
            valueColor: 'text-primary',
            sparkClassName: 'text-primary-700',
          },
          {
            label: 'نسبة الحضور',
            value: `${attendanceRate}%`,
            sub: `${presentCount + lateCount} حاضر اليوم`,
            delta: '+1.8%', positive: true,
            icon: UserCheck,
            href: '/hr/attendance/daily',
            sparkline: [88, 91, 93, 90, 94, 95, attendanceRate],
            accentLight: 'bg-success/10 border-success/20 dark:bg-success/15 dark:border-success/25',
            iconBg: 'bg-success/15 text-success dark:bg-success/20 dark:text-success',
            valueColor: 'text-success dark:text-success',
            sparkClassName: 'text-success',
          },
          {
            label: 'إجازات معلقة',
            value: String(pendingLeaves),
            sub: 'بانتظار الموافقة',
            delta: null, positive: true,
            icon: CalendarDays,
            href: '/hr/requests/unified-management',
            sparkline: [3, 5, 4, 7, 6, 8, pendingLeaves],
            accentLight: 'bg-primary/8 border-primary/20 dark:bg-primary/10 dark:border-primary/25',
            iconBg: 'bg-primary/12 text-primary-700 dark:bg-primary/20 dark:text-primary',
            valueColor: 'text-primary-700 dark:text-primary',
            sparkClassName: 'text-primary',
          },
          {
            label: 'عقود نشطة',
            value: String(activeContracts),
            sub: 'عقد موظف',
            delta: null, positive: true,
            icon: FileCheck2,
            href: hrContractsRoutes.employment,
            sparkline: [18, 20, 22, 21, 24, 23, activeContracts],
            accentLight: 'bg-gold/10 border-gold/25 dark:bg-gold/10 dark:border-gold/30',
            iconBg: 'bg-gold/15 text-gold dark:bg-gold/15 dark:text-gold',
            valueColor: 'text-gold dark:text-gold',
            sparkClassName: 'text-gold',
          },
        ].map(k => (
          <Link
            key={k.label}
            href={k.href}
            className={cn(
              'group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-elevated',
              k.accentLight,
            )}
          >
            {/* header row */}
            <div className="flex items-start justify-between mb-4">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', k.iconBg)}>
                <k.icon className="h-4 w-4" />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 transition-all group-hover:text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>

            {/* value */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-0.5">{k.label}</p>
              <p className={cn('font-display text-2xl font-bold tabular-nums leading-none', k.valueColor)}>{k.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{k.sub}</p>
            </div>

            {/* footer: sparkline + delta */}
            <div className="mt-3 flex items-end justify-between">
              <Sparkline values={k.sparkline} className={k.sparkClassName} />
              {k.delta && (
                <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 bg-success/15 text-success dark:bg-success/20 dark:text-success">
                  {k.delta}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TODAY SNAPSHOT — 4 inline stat pills
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'حاضر اليوم',   value: presentCount,    icon: UserCheck, color: 'text-success dark:text-success', bg: 'bg-success/15 dark:bg-success/20', border: 'border-success/25 dark:border-success/30' },
          { label: 'متأخر',         value: lateCount,       icon: Timer,     color: 'text-warning dark:text-warning',     bg: 'bg-warning/15 dark:bg-warning/20',     border: 'border-warning/25 dark:border-warning/30' },
          { label: 'غائب',          value: absentCount,     icon: UserX,     color: 'text-destructive dark:text-destructive',       bg: 'bg-destructive/10 dark:bg-destructive/15',       border: 'border-destructive/25 dark:border-destructive/30' },
          { label: 'طلبات معلقة',  value: pendingRequests, icon: Clock,     color: 'text-warning dark:text-warning',   bg: 'bg-warning/12 dark:bg-warning/18',   border: 'border-warning/25 dark:border-warning/30' },
        ].map(s => (
          <div key={s.label} className={cn('flex items-center gap-3 rounded-xl border bg-card p-4', s.border)}>
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', s.bg)}>
              <s.icon className={cn('h-4 w-4', s.color)} />
            </div>
            <div>
              <p className={cn('font-display text-2xl font-bold tabular-nums leading-none', s.color)}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TWO PANELS — Violations + Attendance alerts
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* ── Violations panel ── */}
        <div className="flex flex-col rounded-xl border border-border bg-card shadow-soft overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15 dark:bg-warning/20">
                <ShieldAlert className="h-4 w-4 text-warning dark:text-warning" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold leading-none">مخالفات بانتظار الاعتماد</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">الحالات التي تحتاج قراراً</p>
              </div>
            </div>
            <Link
              href="/hr/discipline/violation-cases"
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              {underReviewCases.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning/15 text-[10px] font-bold text-warning dark:text-warning tabular-nums ml-1">
                  {underReviewCases.length}
                </span>
              )}
              عرض الكل
              <ChevronLeft className="h-3 w-3" />
            </Link>
          </div>

          <div className="h-px bg-border/60" />

          {/* rows */}
          <div className="divide-y divide-border/40 flex-1 min-h-0">
            {underReviewCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 mb-3">
                  <ShieldAlert className="h-5 w-5 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">لا توجد مخالفات معلقة</p>
              </div>
            ) : underReviewCases.slice(0, 5).map(c => {
              const stage = c.requiredApprovers[c.currentApprovalIndex];
              const stageLabel = stage === 'manager' ? 'مدير' : stage === 'hr' ? 'موارد بشرية' : 'تنفيذي';
              return (
                <div key={c.id} className="group flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/15 dark:bg-warning/20 text-warning dark:text-warning text-xs font-bold">
                    {c.employeeNameAr.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.employeeNameAr}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{c.typeNameAr} · <span className="font-mono">{c.caseNumber}</span></p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {stageLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Today's alerts panel ── */}
        <div className="flex flex-col rounded-xl border border-border bg-card shadow-soft overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 dark:bg-destructive/15">
                <UserX className="h-4 w-4 text-destructive dark:text-destructive" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold leading-none">تنبيهات الحضور</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lateCount + absentCount} حالة تأخر أو غياب اليوم
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {absentCount > 0 && (
                <span className="rounded-full bg-destructive/10 dark:bg-destructive/15 px-2.5 py-0.5 text-[11px] font-semibold text-destructive dark:text-destructive tabular-nums">
                  {absentCount} غائب
                </span>
              )}
              {lateCount > 0 && (
                <span className="rounded-full bg-warning/15 dark:bg-warning/20 px-2.5 py-0.5 text-[11px] font-semibold text-warning dark:text-warning tabular-nums">
                  {lateCount} متأخر
                </span>
              )}
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* rows */}
          <div className="divide-y divide-border/40 flex-1 min-h-0">
            {lateEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 dark:bg-success/20 mb-3">
                  <UserCheck className="h-5 w-5 text-success dark:text-success" />
                </div>
                <p className="text-sm text-muted-foreground">جميع الموظفين حاضرون</p>
              </div>
            ) : lateEmployees.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={item.employee.avatar ?? undefined} />
                  <AvatarFallback className="text-[11px] font-semibold bg-muted">
                    {getInitials(item.employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.employee.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{item.employee.position}</p>
                </div>
                {item.status === 'late'
                  ? <span className="shrink-0 rounded-full bg-warning/15 dark:bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning dark:text-warning tabular-nums">
                      +{item.lateMinutes} د
                    </span>
                  : <span className="shrink-0 rounded-full bg-destructive/10 dark:bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive dark:text-destructive">
                      غائب
                    </span>
                }
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          QUICK ACTIONS — coloured icon tiles
      ════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <p className="font-display text-sm font-bold mb-1">إجراءات سريعة</p>
        <p className="text-[11px] text-muted-foreground mb-4">الأدوات الأكثر استخداماً</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'موظف جديد',       icon: UserPlus,     href: '/hr/organization/employees',   color: 'text-primary',                              bg: 'bg-primary/10',                              hoverBg: 'hover:bg-primary/15' },
            { label: 'طلب إجازة',        icon: CalendarDays, href: '/hr/leaves/leave-types',   color: 'text-primary',                              bg: 'bg-primary/10',                              hoverBg: 'hover:bg-primary/15' },
            { label: 'الرواتب',          icon: Wallet,       href: hrPayrollRoutes.root,             color: 'text-gold dark:text-gold',    bg: 'bg-gold/10 dark:bg-gold/15',      hoverBg: 'hover:bg-gold/20 dark:hover:bg-gold/25' },
            { label: 'تقرير حضور',       icon: Clock,        href: '/hr/attendance/daily', color: 'text-warning dark:text-warning',        bg: 'bg-warning/12 dark:bg-warning/18',          hoverBg: 'hover:bg-warning/20 dark:hover:bg-warning/25' },
            { label: 'هيكل تنظيمي',      icon: Building2,    href: '/hr/organization/chart',       color: 'text-primary',                              bg: 'bg-primary/10',                              hoverBg: 'hover:bg-primary/15' },
            { label: 'تحليل الإجازات',   icon: TrendingUp,   href: '/hr/leaves/analytics',      color: 'text-destructive dark:text-destructive',          bg: 'bg-destructive/10 dark:bg-destructive/15',            hoverBg: 'hover:bg-destructive/15 dark:hover:bg-destructive/20' },
          ].map(a => (
            <Link
              key={a.label}
              href={a.href}
              className={cn(
                'group flex flex-col items-center gap-2.5 rounded-xl p-3 sm:p-4 transition-all hover:-translate-y-0.5',
                a.bg, a.hoverBg,
              )}
            >
              <a.icon className={cn('h-5 w-5', a.color)} />
              <span className={cn('text-[10px] sm:text-[11px] font-semibold text-center leading-snug', a.color)}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
