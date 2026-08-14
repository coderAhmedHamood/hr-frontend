'use client';

import { MonitorSmartphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/shared/utils';

export type DeviceAuthSettingsValues = {
  enforceMobileDeviceSerial: boolean;
  requireAdminApprovalForNewMobileDevice: boolean;
  enforceWebDeviceSerial: boolean;
  requireAdminApprovalForNewWebDevice: boolean;
};

type Props = {
  values: DeviceAuthSettingsValues;
  disabled?: boolean;
  onChange: (patch: Partial<DeviceAuthSettingsValues>) => void;
};

function SettingRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-xl border px-3.5 py-3 transition-colors',
        checked ? 'border-primary/20 bg-primary/[0.03]' : 'border-border/70 bg-card',
        disabled && 'opacity-60',
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="shrink-0"
        aria-label={title}
      />
    </div>
  );
}

/** HR settings for app + web device serial channels (independent). */
export function MobileSerialApprovalSettingCard({ values, disabled, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card shadow-soft">
      <header className="flex items-start gap-3 border-b border-border/60 px-4 py-3.5 sm:px-5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MonitorSmartphone className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">أجهزة التطبيق والموقع</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            لكل قناة: إلزام السيريال ثم موافقة الإدارة. سيريال التطبيق منفصل عن سيريال
            الويب. أول ربط لكل قناة لا يمر بالموافقة ولا بالإيميل.
          </p>
        </div>
      </header>
      <div className="space-y-2 p-4 sm:p-5">
        <SettingRow
          title="إلزام سيريال جهاز على دخول التطبيق"
          description={
            values.enforceMobileDeviceSerial
              ? 'مفعّل — دخول التطبيق يلزم رقم جهاز. إذا اختلف عن المخزّن → إيميل تفعيل (أو موافقة إدارة إن فُعّل الخيار التالي).'
              : 'معطّل — دخول التطبيق بدون فحص جهاز وبدون إيميل.'
          }
          checked={values.enforceMobileDeviceSerial}
          disabled={disabled}
          onCheckedChange={(value) => {
            if (!value) {
              onChange({
                enforceMobileDeviceSerial: false,
                requireAdminApprovalForNewMobileDevice: false,
              });
              return;
            }
            onChange({ enforceMobileDeviceSerial: true });
          }}
        />
        <SettingRow
          title="موافقة الإدارة لجهاز تطبيق جديد"
          description={
            !values.enforceMobileDeviceSerial
              ? 'يتطلب تفعيل «إلزام سيريال جهاز على دخول التطبيق» أولاً.'
              : values.requireAdminApprovalForNewMobileDevice
                ? 'مفعّل — جهاز التطبيق الجديد ينتظر موافقة الإدارة ثم يُرسل الإيميل.'
                : 'معطّل — يُرسل إيميل التفعيل مباشرة لتطبيق الجوال.'
          }
          checked={values.requireAdminApprovalForNewMobileDevice}
          disabled={disabled || !values.enforceMobileDeviceSerial}
          onCheckedChange={(value) =>
            onChange({ requireAdminApprovalForNewMobileDevice: value })
          }
        />
        <SettingRow
          title="إلزام سيريال جهاز على دخول الموقع"
          description={
            values.enforceWebDeviceSerial
              ? 'مفعّل — دخول الويب يلزم بصمة/سيريال. إذا اختلف عن المخزّن → إيميل تفعيل (أو موافقة إدارة إن فُعّل الخيار التالي).'
              : 'معطّل — دخول لوحة الإدارة بدون سيريال وبدون إيميل.'
          }
          checked={values.enforceWebDeviceSerial}
          disabled={disabled}
          onCheckedChange={(value) => {
            if (!value) {
              onChange({
                enforceWebDeviceSerial: false,
                requireAdminApprovalForNewWebDevice: false,
              });
              return;
            }
            onChange({ enforceWebDeviceSerial: true });
          }}
        />
        <SettingRow
          title="موافقة الإدارة لجهاز موقع جديد"
          description={
            !values.enforceWebDeviceSerial
              ? 'يتطلب تفعيل «إلزام سيريال جهاز على دخول الموقع» أولاً.'
              : values.requireAdminApprovalForNewWebDevice
                ? 'مفعّل — جهاز الويب الجديد ينتظر موافقة الإدارة ثم يُرسل الإيميل.'
                : 'معطّل — يُرسل إيميل التفعيل مباشرة لموقع الويب.'
          }
          checked={values.requireAdminApprovalForNewWebDevice}
          disabled={disabled || !values.enforceWebDeviceSerial}
          onCheckedChange={(value) => onChange({ requireAdminApprovalForNewWebDevice: value })}
        />
      </div>
    </section>
  );
}
