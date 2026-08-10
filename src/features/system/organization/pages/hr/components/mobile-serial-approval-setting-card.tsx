'use client';

import { Smartphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/shared/utils';

type Props = {
  enabled: boolean;
  disabled?: boolean;
  onToggle: (value: boolean) => void;
};

/** HR setting: require admin approval before emailing OTP for a new mobile device. */
export function MobileSerialApprovalSettingCard({ enabled, disabled, onToggle }: Props) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card shadow-soft">
      <header className="flex items-start gap-3 border-b border-border/60 px-4 py-3.5 sm:px-5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Smartphone className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">موافقة جهاز الجوال</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            عند التفعيل، أي جهاز جديد بعد ربط سابق يحتاج موافقة الإدارة قبل إرسال إيميل التفعيل.
            أول ربط سيريال للحساب لا يمر عبر الموافقة.
          </p>
        </div>
      </header>
      <div className="p-4 sm:p-5">
        <div
          className={cn(
            'flex items-start justify-between gap-3 rounded-xl border px-3.5 py-3 transition-colors',
            enabled
              ? 'border-primary/20 bg-primary/[0.03]'
              : 'border-border/70 bg-card',
          )}
        >
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium leading-tight">
              طلب موافقة الإدارة لجهاز جوال جديد
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {enabled
                ? 'مفعّل — الجهاز الجديد ينتظر موافقة الإدارة ثم يُرسل الإيميل.'
                : 'معطّل — يُرسل إيميل التفعيل مباشرة كما السابق.'}
            </p>
          </div>
          <Switch
            checked={enabled}
            disabled={disabled}
            onCheckedChange={onToggle}
            className="shrink-0"
            aria-label="موافقة الإدارة لجهاز جوال جديد"
          />
        </div>
      </div>
    </section>
  );
}
