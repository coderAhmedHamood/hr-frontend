'use client';

import * as React from 'react';
import { Loader2, Smartphone, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  usersApi,
  type ResetMobileSerialDto,
  type UserResponseDto,
} from '@/features/hr/organization/lib/api/users';
import { usePagePermissions } from '@/features/auth/permissions';
import { CONTACTS_PAGE_PERMISSIONS } from '@/features/system/organization/contacts/permissions';
import { cn } from '@/shared/utils';

type Props = {
  user: UserResponseDto;
  onUpdated?: (user: UserResponseDto) => void;
};

type ConfirmMode = 'clear' | 'force' | null;

export function UserMobileSerialPanel({ user, onUpdated }: Props) {
  const { canUpdate } = usePagePermissions(CONTACTS_PAGE_PERMISSIONS);
  const [busy, setBusy] = React.useState(false);
  const [confirmMode, setConfirmMode] = React.useState<ConfirmMode>(null);
  const [forceSerial, setForceSerial] = React.useState('');
  const [invalidateSessions, setInvalidateSessions] = React.useState(true);
  const [showForceForm, setShowForceForm] = React.useState(false);

  const currentSerial = user.mobileSerialNumber?.trim() || null;

  const runReset = React.useCallback(
    async (payload: ResetMobileSerialDto, successMessage: string) => {
      setBusy(true);
      try {
        const updated = await usersApi.resetMobileSerial(user.id, payload);
        toast.success(successMessage);
        onUpdated?.(updated);
        setConfirmMode(null);
        setShowForceForm(false);
        setForceSerial('');
        setInvalidateSessions(true);
      } catch (err) {
        handleApiError(err, 'users.mobile-serial.reset');
      } finally {
        setBusy(false);
      }
    },
    [onUpdated, user.id],
  );

  const handleConfirm = async () => {
    if (confirmMode === 'clear') {
      await runReset(
        { mobileSerialNumber: null, invalidateSessions },
        invalidateSessions
          ? 'تم تخطي السيريال وإبطال الجلسات'
          : 'تم تخطي السيريال دون إبطال الجلسات',
      );
      return;
    }
    if (confirmMode === 'force') {
      const serial = forceSerial.trim();
      if (serial.length < 3) {
        toast.error('أدخل رقم سيريال صالحًا');
        return;
      }
      await runReset(
        { mobileSerialNumber: serial, invalidateSessions },
        'تم فرض السيريال على الحساب',
      );
    }
  };

  return (
    <section className="space-y-3">
      <div className="text-right">
        <h3 className="text-sm font-semibold">سيريال الجوال</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          أداة طوارئ إدارية عند تعذّر دخول التطبيق بسبب ربط الجهاز
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-soft space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[11px] text-muted-foreground">السيريال الحالي</p>
            {currentSerial ? (
              <p className="mt-0.5 break-all font-mono text-sm font-medium" dir="ltr">
                {currentSerial}
              </p>
            ) : (
              <Badge variant="outline" className="mt-1 text-muted-foreground">
                غير مربوط
              </Badge>
            )}
          </div>
        </div>

        {canUpdate ? (
          <div className="space-y-3 border-t border-border/60 pt-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="luxe"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={busy}
                onClick={() => {
                  setInvalidateSessions(true);
                  setConfirmMode('clear');
                }}
              >
                <Unlink className="h-3.5 w-3.5" />
                تخطي التحقق (مسح السيريال)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={busy}
                onClick={() => setShowForceForm((v) => !v)}
              >
                فرض سيريال معيّن
              </Button>
            </div>

            {showForceForm ? (
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                <Label htmlFor="force-mobile-serial">رقم السيريال</Label>
                <Input
                  id="force-mobile-serial"
                  dir="ltr"
                  className="font-mono text-sm"
                  value={forceSerial}
                  onChange={(e) => setForceSerial(e.target.value)}
                  placeholder="A1B2C3D46545645E599"
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={invalidateSessions}
                    onCheckedChange={(v) => setInvalidateSessions(v === true)}
                  />
                  إبطال الجلسات الحالية
                </label>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={busy || forceSerial.trim().length < 3}
                  onClick={() => setConfirmMode('force')}
                >
                  تطبيق السيريال
                </Button>
              </div>
            ) : null}

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              مسح السيريال يلغي طلبات التغيير المعلّقة، ويسمح بربط أول جهاز في الدخول التالي من التطبيق
              بدون بريد.
            </p>
          </div>
        ) : (
          <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
            تحتاج صلاحية تعديل المستخدمين لاستخدام إعادة تعيين السيريال.
          </p>
        )}
      </div>

      <Dialog open={confirmMode != null} onOpenChange={(open) => !open && !busy && setConfirmMode(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {confirmMode === 'force' ? 'فرض سيريال الجهاز' : 'تخطي التحقق من السيريال'}
            </DialogTitle>
            <DialogDescription>
              {confirmMode === 'force'
                ? 'سيُعتمد هذا الجهاز فورًا بدون رابط بريد.'
                : 'سيتم مسح السيريال الحالي. في الدخول التالي من التطبيق يُربط أي جهاز كأول جهاز.'}
            </DialogDescription>
          </DialogHeader>

          {confirmMode === 'clear' ? (
            <label className={cn('flex items-center gap-2 text-sm')}>
              <Checkbox
                checked={invalidateSessions}
                onCheckedChange={(v) => setInvalidateSessions(v === true)}
                disabled={busy}
              />
              إبطال الجلسات الحالية (مستحسن)
            </label>
          ) : null}

          {confirmMode === 'force' ? (
            <p className="rounded-lg bg-muted/40 px-3 py-2 font-mono text-xs" dir="ltr">
              {forceSerial.trim()}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="luxe" disabled={busy} onClick={() => void handleConfirm()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              تأكيد
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmMode(null)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
