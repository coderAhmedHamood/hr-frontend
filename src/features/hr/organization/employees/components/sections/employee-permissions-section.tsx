'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Shield, Plus, X, Ban, ChevronDown, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hrPermissionsHref } from '@/features/hr/permissions/constants/routes';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';

const RESOURCE_AR: Record<string, string> = {
  employees: 'الموظفين',
  attendance: 'الحضور',
  requests: 'الطلبات',
  payroll: 'الرواتب',
  hr: 'الموارد البشرية',
  reports: 'التقارير',
  settings: 'الإعدادات',
  leaves: 'الإجازات',
  contracts: 'العقود',
  organization: 'المنظمة',
};
const ACTION_AR: Record<string, string> = {
  read: 'عرض',
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  approve: 'موافقة',
  export: 'تصدير',
};

function permLabel(p: PermissionResponseDto) {
  const res = RESOURCE_AR[p.resource ?? ''] ?? p.resource ?? '';
  const act = ACTION_AR[p.action ?? ''] ?? p.action ?? '';
  return `${act}${res ? ` (${res})` : ''}`;
}

export function EmployeePermissionsSection({ model }: { model: EmployeeProfileModel }) {
  const {
    hasLinkedUser,
    allRoles,
    roleDraft,
    setRoleDraft,
    selectedRole,
    roleDirty,
    isSavingRole,
    handleSaveRole,
    rolePermissions,
    overlayMap,
    extraAllowPermissions,
    allActionPermissions,
    handleToggleDeny,
    handleGrantExtra,
    handleRemoveOverlay,
    isMutating,
    setCreateUserOpen,
  } = model;

  const [addingExtra, setAddingExtra] = React.useState(false);
  const [extraPickId, setExtraPickId] = React.useState('');

  // Permissions not already in role and not already granted as ALLOW overlay
  const grantablePermissions = React.useMemo(() => {
    const inRole = new Set(rolePermissions.map((p) => p.id));
    const alreadyAllowed = new Set(extraAllowPermissions.map((p) => p.id));
    return allActionPermissions.filter((p) => !inRole.has(p.id) && !alreadyAllowed.has(p.id));
  }, [allActionPermissions, rolePermissions, extraAllowPermissions]);

  return (
    <section className="space-y-5">
      {/* ── Header card ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
        <div className="pointer-events-none absolute inset-0 dotted-bg opacity-30" aria-hidden />
        <div className="relative flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-inner-soft">
                <Shield className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">صلاحيات الموظف</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xl">
                  عيّن دوراً للموظف ثم خصّص صلاحياته — يمكنك حجب أي صلاحية من الدور أو منح صلاحيات إضافية مباشرةً.{' '}
                  <Link href={hrPermissionsHref()} className="font-medium text-primary underline-offset-4 hover:underline">
                    إدارة الأدوار
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {!hasLinkedUser && (
            <div className="rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                <UserPlus className="h-4 w-4 shrink-0" />
                هذا الموظف غير مرتبط بحساب مستخدم — أنشئ له حساباً لتفعيل الصلاحيات
              </div>
              <Button
                type="button"
                size="sm"
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                onClick={() => setCreateUserOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5" />
                إنشاء حساب مستخدم
              </Button>
            </div>
          )}

          {/* Role picker */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee-role" className="text-xs font-medium text-muted-foreground">
                الدور المعيّن
              </Label>
              <div className="flex gap-2">
                <Select value={roleDraft} onValueChange={setRoleDraft} disabled={!hasLinkedUser}>
                  <SelectTrigger id="employee-role" className="h-11 flex-1 rounded-xl border-border bg-background/90">
                    <SelectValue placeholder="اختر الدور…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {allRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-sm">
                        {r.nameAr}
                        {r.isSystem && <span className="ml-2 text-[10px] text-muted-foreground">(نظامي)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  className="h-11 gap-1.5 px-4"
                  disabled={!roleDirty || !hasLinkedUser || isSavingRole}
                  onClick={handleSaveRole}
                >
                  {isSavingRole ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  حفظ
                </Button>
              </div>
              {selectedRole?.description && (
                <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                  {selectedRole.description}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">ملخص</p>
              <p className="text-sm text-foreground">
                {rolePermissions.length > 0
                  ? `${rolePermissions.length} صلاحية من الدور`
                  : 'لم يُعيَّن دور بعد'}
                {extraAllowPermissions.length > 0 && (
                  <span className="text-success">
                    {' '}+ {extraAllowPermissions.length} صلاحية إضافية
                  </span>
                )}
              </p>
              {overlayMap.size > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {[...overlayMap.values()].filter((o) => o.effect === 'DENY').length} صلاحية محجوبة
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Role permissions with DENY toggle ────────────────────────── */}
      {rolePermissions.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft">
          <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            صلاحيات الدور
            <Badge variant="subtle" className="text-[10px]">{rolePermissions.length}</Badge>
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            اضغط على «حجب» لإزالة صلاحية معينة من هذا الموظف دون تغيير الدور.
          </p>
          <ul className="space-y-2 max-h-[min(52vh,480px)] overflow-y-auto overscroll-contain pr-1">
            {rolePermissions.map((p) => {
              const overlay = overlayMap.get(p.id);
              const isDenied = overlay?.effect === 'DENY';
              return (
                <li
                  key={p.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                    isDenied
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-border/60 bg-muted/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isDenied ? (
                      <Ban className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    ) : (
                      <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                    )}
                    <span className={`text-sm leading-snug ${isDenied ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {permLabel(p)}
                    </span>
                    <code className="text-[10px] text-muted-foreground font-mono hidden sm:block" dir="ltr">
                      {p.code}
                    </code>
                  </div>
                  <Button
                    type="button"
                    variant={isDenied ? 'outline' : 'ghost'}
                    size="sm"
                    className={`h-7 shrink-0 text-xs gap-1 ${
                      isDenied
                        ? 'border-success/30 text-success hover:bg-success/10'
                        : 'text-destructive hover:bg-destructive/10'
                    }`}
                    disabled={!hasLinkedUser || isMutating}
                    onClick={() => handleToggleDeny(p.id)}
                  >
                    {isDenied ? (
                      <><Check className="h-3 w-3" /> استعادة</>
                    ) : (
                      <><Ban className="h-3 w-3" /> حجب</>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Extra ALLOW grants ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-success shrink-0" />
            صلاحيات إضافية
            {extraAllowPermissions.length > 0 && (
              <Badge variant="subtle" className="text-[10px]">{extraAllowPermissions.length}</Badge>
            )}
          </h3>
          {hasLinkedUser && grantablePermissions.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setAddingExtra((v) => !v)}
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${addingExtra ? 'rotate-180' : ''}`} />
              إضافة صلاحية
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          صلاحيات تم منحها لهذا الموظف مباشرةً خارج نطاق الدور.
        </p>

        {addingExtra && (
          <div className="flex gap-2 mb-4">
            <Select value={extraPickId} onValueChange={setExtraPickId}>
              <SelectTrigger className="h-9 flex-1 rounded-lg text-sm">
                <SelectValue placeholder="اختر صلاحية للمنح…" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {grantablePermissions.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-sm">
                    <span dir="ltr" className="font-mono text-[11px] text-muted-foreground">{p.code}</span>
                    <span className="mr-2">{permLabel(p)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1 text-xs"
              disabled={!extraPickId || isMutating}
              onClick={() => {
                if (extraPickId) {
                  handleGrantExtra(extraPickId);
                  setExtraPickId('');
                  setAddingExtra(false);
                }
              }}
            >
              <Check className="h-3.5 w-3.5" /> منح
            </Button>
          </div>
        )}

        {extraAllowPermissions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">لا توجد صلاحيات إضافية ممنوحة.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto overscroll-contain pr-1">
            {extraAllowPermissions.map((p) => {
              const overlay = overlayMap.get(p.id);
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-success/25 bg-success/5 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                    <span className="text-sm text-foreground leading-snug">{permLabel(p)}</span>
                    <code className="text-[10px] text-muted-foreground font-mono hidden sm:block" dir="ltr">
                      {p.code}
                    </code>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 text-destructive hover:bg-destructive/10"
                    disabled={!hasLinkedUser || isMutating}
                    onClick={() => overlay && handleRemoveOverlay(overlay.overlayId)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
