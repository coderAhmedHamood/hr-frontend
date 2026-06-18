'use client';

import * as React from 'react';
import {
  Check,
  Layers,
  Link2,
  MapPinned,
  Search,
  Unlink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SingleDatePicker } from '@/components/ui/single-date-picker';
import { cn } from '@/shared/utils';
import type { AttendanceCheckInPoint, AttendanceCheckInPointLink } from '@/features/hr/attendance/lib/types';

export type EmployeeAttendanceDialogsProps = {
  employeeName: string;
  checkpoints: AttendanceCheckInPoint[];
  shiftTemplates: Array<{
    id: string;
    nameAr: string;
    nameEn: string | null;
    colorHex: string;
    effectiveFrom: string;
    isActive: boolean;
  }>;
  employeeCheckpoints: AttendanceCheckInPointLink[];
  shiftOpen: boolean;
  setShiftOpen: (v: boolean) => void;
  shiftTemplateId: string;
  setShiftTemplateId: (id: string) => void;
  shiftDate: string;
  setShiftDate: (v: string) => void;
  shiftUnlinkTarget: string | null;
  setShiftUnlinkTarget: (v: string | null) => void;
  submitShift: () => void;
  removeAssignment: (id: string) => void;
  cpOpen: boolean;
  setCpOpen: (v: boolean) => void;
  cpDate: string;
  setCpDate: (v: string) => void;
  cpSel: Set<string>;
  setCpSel: React.Dispatch<React.SetStateAction<Set<string>>>;
  cpQuery: string;
  setCpQuery: (v: string) => void;
  cpUnlinkTarget: string | null;
  setCpUnlinkTarget: (v: string | null) => void;
  submitCpLink: () => void;
  removeCheckpointLink: (id: string) => void;
};

export function EmployeeAttendanceDialogs(p: EmployeeAttendanceDialogsProps) {
  const linkedIds = React.useMemo(
    () => new Set(p.employeeCheckpoints.map((l) => l.checkInPointId)),
    [p.employeeCheckpoints],
  );

  return (
    <>
      <Dialog open={p.shiftOpen} onOpenChange={p.setShiftOpen}>
        <DialogContent className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-sm">
          <DialogHeader className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base">ربط شيفت</DialogTitle>
                <DialogDescription className="text-xs">اختر قالب الدوام لـ {p.employeeName}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <Label className="shrink-0 text-xs">ساري من</Label>
              <SingleDatePicker value={p.shiftDate} onChange={p.setShiftDate} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">اختر الشيفت</Label>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {p.shiftTemplates.filter((t) => t.isActive).map((tpl) => {
                  const sel = p.shiftTemplateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => p.setShiftTemplateId(tpl.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-sm transition-all',
                        sel ? 'bg-primary/10' : 'hover:bg-muted/50',
                      )}
                    >
                      <div
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all"
                        style={sel ? { borderColor: tpl.colorHex, background: tpl.colorHex } : { borderColor: `${tpl.colorHex}80` }}
                      >
                        {sel && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ background: tpl.colorHex }} />
                      <span className="flex-1 truncate font-medium">{tpl.nameAr}</span>
                      <span className="text-[10px] text-muted-foreground font-mono" dir="ltr">{tpl.effectiveFrom}</span>
                    </button>
                  );
                })}
                {p.shiftTemplates.filter((t) => t.isActive).length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">لا توجد شيفتات نشطة</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
            <Button variant="outline" size="sm" onClick={() => p.setShiftOpen(false)}>إلغاء</Button>
            <Button
              variant="luxe"
              size="sm"
              onClick={p.submitShift}
              disabled={!p.shiftTemplateId}
              className="gap-1.5"
            >
              <Layers className="h-3.5 w-3.5" /> ربط الشيفت
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!p.shiftUnlinkTarget} onOpenChange={(o) => { if (!o) p.setShiftUnlinkTarget(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Unlink className="h-4 w-4" /> فك ربط الشيفت
            </DialogTitle>
            <DialogDescription>هل تريد إزالة هذا الشيفت من الموظف؟</DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                if (p.shiftUnlinkTarget) {
                  p.removeAssignment(p.shiftUnlinkTarget);
                  p.setShiftUnlinkTarget(null);
                }
              }}
            >
              <Unlink className="h-3.5 w-3.5" /> فك الربط
            </Button>
            <Button variant="outline" size="sm" onClick={() => p.setShiftUnlinkTarget(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={p.cpOpen} onOpenChange={p.setCpOpen}>
        <DialogContent className="flex max-h-[80vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Link2 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base">ربط نقطة تسجيل</DialogTitle>
                <DialogDescription className="text-xs">اختر نقطة أو أكثر لربطها بـ {p.employeeName}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="border-b border-border bg-muted/20 px-5 py-3">
            <div className="flex items-center gap-3">
              <Label className="shrink-0 text-xs">ساري من</Label>
              <SingleDatePicker value={p.cpDate} onChange={p.setCpDate} />
            </div>
          </div>

          <div className="border-b border-border px-3 py-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={p.cpQuery}
                onChange={(e) => p.setCpQuery(e.target.value)}
                placeholder="ابحث باسم النقطة…"
                className="h-8 bg-background pr-8 text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {(() => {
              const q = p.cpQuery.trim().toLowerCase();
              const list = p.checkpoints.filter((cp) => (!q || cp.nameAr.toLowerCase().includes(q)));
              if (list.length === 0) {
                return <p className="py-6 text-center text-xs text-muted-foreground">لا توجد نقاط مطابقة</p>;
              }
              return list.map((cp) => {
                const sel = p.cpSel.has(cp.id);
                const alreadyLinked = linkedIds.has(cp.id);
                return (
                  <button
                    key={cp.id}
                    type="button"
                    disabled={alreadyLinked}
                    onClick={() => {
                      p.setCpSel((prev) => {
                        const n = new Set(prev);
                        if (n.has(cp.id)) n.delete(cp.id);
                        else n.add(cp.id);
                        return n;
                      });
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-right text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                      sel ? 'bg-primary/10 text-primary' : alreadyLinked ? 'bg-muted/40' : 'hover:bg-muted/50',
                    )}
                  >
                    <div className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                      sel ? 'border-primary bg-primary' : 'border-border',
                    )}
                    >
                      {sel && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      sel ? 'bg-primary/15' : 'bg-muted',
                    )}
                    >
                      <MapPinned className={cn('h-4 w-4', sel ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{cp.nameAr}</p>
                      <p className="font-mono text-[10px] text-muted-foreground" dir="ltr">
                        {cp.latitude.toFixed(4)}, {cp.longitude.toFixed(4)}
                      </p>
                    </div>
                    {alreadyLinked && (
                      <Badge variant="subtle" className="shrink-0 text-[9px]">مرتبط</Badge>
                    )}
                  </button>
                );
              });
            })()}
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {p.cpSel.size > 0
                ? (
                  <>
                    <span className="number-ar font-semibold text-foreground">{p.cpSel.size}</span>
                    {' '}
                    نقطة محددة
                  </>
                )
                : 'اختر نقطة أو أكثر'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => p.setCpOpen(false)}>إلغاء</Button>
              <Button variant="luxe" size="sm" onClick={p.submitCpLink} disabled={p.cpSel.size === 0}>
                <Link2 className="h-3.5 w-3.5" /> ربط
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!p.cpUnlinkTarget} onOpenChange={(o) => !o && p.setCpUnlinkTarget(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Unlink className="h-4 w-4" /> فك ربط النقطة
            </DialogTitle>
            <DialogDescription>هل تريد فك ربط هذه النقطة من الموظف؟</DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (p.cpUnlinkTarget) {
                  p.removeCheckpointLink(p.cpUnlinkTarget);
                  p.setCpUnlinkTarget(null);
                }
              }}
            >
              <Unlink className="h-3.5 w-3.5" /> فك الربط
            </Button>
            <Button variant="outline" size="sm" onClick={() => p.setCpUnlinkTarget(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
