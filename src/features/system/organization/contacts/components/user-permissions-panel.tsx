'use client';

import * as React from 'react';
import Link from 'next/link';
import { Ban, Check, ChevronDown, Plus, Shield, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { systemPermissionsHref } from '@/features/system/permissions/constants/routes';
import { RolesAssignmentEditor } from '@/components/shared/permissions/roles-assignment-editor';
import { permissionLabel } from '@/components/shared/permissions/permission-labels';
import type { UserPermissionsModel } from '@/features/system/organization/contacts/hooks/useUserPermissionsModel';

type Props = {
  model: UserPermissionsModel;
};

function SummaryPill({ label, value, tone }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 text-sm font-semibold ${
          tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-amber-600 dark:text-amber-400' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function UserPermissionsPanel({ model }: Props) {
  const {
    rolePermissions,
    overlayMap,
    extraAllowPermissions,
    allActionPermissions,
    handleToggleDeny,
    handleGrantExtra,
    handleRemoveOverlay,
    isMutating,
    hasCompany,
    ...rolesModel
  } = model;

  const [addingExtra, setAddingExtra] = React.useState(false);
  const [extraPickId, setExtraPickId] = React.useState('');

  const deniedCount = React.useMemo(
    () => [...overlayMap.values()].filter((o) => o.effect === 'DENY').length,
    [overlayMap],
  );

  const grantablePermissions = React.useMemo(() => {
    const inRole = new Set(rolePermissions.map((p) => p.id));
    const alreadyAllowed = new Set(extraAllowPermissions.map((p) => p.id));
    return allActionPermissions.filter((p) => !inRole.has(p.id) && !alreadyAllowed.has(p.id));
  }, [allActionPermissions, rolePermissions, extraAllowPermissions]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card p-4 shadow-soft sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <h3 className="text-base font-semibold">صلاحيات المستخدم</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              عيّن دوراً أو أكثر ثم خصّص الصلاحيات — يمكن حجب صلاحيات الأدوار أو منح صلاحيات إضافية.{' '}
              <Link href={systemPermissionsHref()} className="font-medium text-primary hover:underline">
                إدارة الأدوار
              </Link>
            </p>
          </div>
        </div>

        {!hasCompany ? (
          <p className="mt-4 rounded-xl border border-amber-300/50 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
            يجب ربط المستخدم بشركة قبل إدارة الصلاحيات.
          </p>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <SummaryPill
            label="صلاحيات الأدوار"
            value={rolePermissions.length > 0 ? String(rolePermissions.length) : '—'}
          />
          <SummaryPill
            label="صلاحيات إضافية"
            value={String(extraAllowPermissions.length)}
            tone={extraAllowPermissions.length > 0 ? 'success' : 'default'}
          />
          <SummaryPill
            label="محجوبة"
            value={String(deniedCount)}
            tone={deniedCount > 0 ? 'warning' : 'default'}
          />
        </div>

        <div className="mt-4">
          <RolesAssignmentEditor
            model={{ ...rolesModel, rolePermissions, extraAllowPermissions, overlayMap }}
            rolesSelectId="user-role-add"
            disabled={!hasCompany}
            compact
            hideSummary
          />
        </div>
      </div>

      {rolePermissions.length > 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-primary" />
              صلاحيات الأدوار
              <Badge variant="subtle" className="text-[10px]">
                {rolePermissions.length}
              </Badge>
            </h4>
          </div>
          <ul className="max-h-[min(40vh,360px)] space-y-2 overflow-y-auto overscroll-contain pr-1">
            {rolePermissions.map((p) => {
              const overlay = overlayMap.get(p.id);
              const isDenied = overlay?.effect === 'DENY';
              return (
                <li
                  key={p.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                    isDenied ? 'border-destructive/30 bg-destructive/5' : 'border-border/60 bg-muted/10'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {isDenied ? (
                      <Ban className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    ) : (
                      <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                    )}
                    <span
                      className={`text-sm leading-snug ${
                        isDenied ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {permissionLabel(p)}
                    </span>
                    <code className="hidden font-mono text-[10px] text-muted-foreground sm:block" dir="ltr">
                      {p.code}
                    </code>
                  </div>
                  <Button
                    type="button"
                    variant={isDenied ? 'outline' : 'ghost'}
                    size="sm"
                    className={`h-7 shrink-0 gap-1 text-xs ${
                      isDenied
                        ? 'border-success/30 text-success hover:bg-success/10'
                        : 'text-destructive hover:bg-destructive/10'
                    }`}
                    disabled={!hasCompany || isMutating}
                    onClick={() => handleToggleDeny(p.id)}
                  >
                    {isDenied ? (
                      <>
                        <Check className="h-3 w-3" /> استعادة
                      </>
                    ) : (
                      <>
                        <Ban className="h-3 w-3" /> حجب
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4 text-success" />
            صلاحيات إضافية
            {extraAllowPermissions.length > 0 ? (
              <Badge variant="subtle" className="text-[10px]">
                {extraAllowPermissions.length}
              </Badge>
            ) : null}
          </h4>
          {hasCompany && grantablePermissions.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setAddingExtra((v) => !v)}
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${addingExtra ? 'rotate-180' : ''}`} />
              إضافة
            </Button>
          ) : null}
        </div>

        {addingExtra ? (
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={extraPickId} onValueChange={setExtraPickId}>
              <SelectTrigger className="h-9 flex-1 rounded-lg text-sm">
                <SelectValue placeholder="اختر صلاحية…" />
              </SelectTrigger>
              <SelectContent className="max-h-64" align="end">
                {grantablePermissions.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="items-start py-2">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm">{permissionLabel(p)}</span>
                      <span className="truncate font-mono text-[10px] text-muted-foreground" dir="ltr">
                        {p.code}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              className="h-9 shrink-0 gap-1 text-xs"
              disabled={!extraPickId || isMutating}
              onClick={() => {
                if (!extraPickId) return;
                handleGrantExtra(extraPickId);
                setExtraPickId('');
                setAddingExtra(false);
              }}
            >
              <Check className="h-3.5 w-3.5" /> منح
            </Button>
          </div>
        ) : null}

        {extraAllowPermissions.length === 0 ? (
          <p className="py-1 text-sm text-muted-foreground">لا توجد صلاحيات إضافية.</p>
        ) : (
          <ul className="max-h-52 space-y-2 overflow-y-auto overscroll-contain pr-1">
            {extraAllowPermissions.map((p) => {
              const overlay = overlayMap.get(p.id);
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-success/25 bg-success/5 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                    <span className="text-sm leading-snug">{permissionLabel(p)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 text-destructive hover:bg-destructive/10"
                    disabled={!hasCompany || isMutating}
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
