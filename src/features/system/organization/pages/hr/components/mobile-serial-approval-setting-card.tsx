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
  /** Which device channel this panel configures. */
  channel: 'mobile' | 'web';
  /** Tab shell already names the section. */
  hideHeader?: boolean;
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
        'flex items-start justify-between gap-4 bg-card px-4 py-3.5',
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

const CHANNEL_COPY = {
  mobile: {
    title: 'دخول التطبيق',
    description:
      'سيريال تطبيق الجوال منفصل عن الموقع. أول ربط للجهاز لا يمر بالموافقة ولا بالإيميل.',
  },
  web: {
    title: 'دخول الموقع',
    description:
      'سيريال لوحة الويب منفصل عن التطبيق. أول ربط للجهاز لا يمر بالموافقة ولا بالإيميل.',
  },
} as const;

/** HR settings for one device channel: app or website. */
export function MobileSerialApprovalSettingCard({
  values,
  disabled,
  channel,
  hideHeader,
  onChange,
}: Props) {
  const copy = CHANNEL_COPY[channel];
  const rows =
    channel === 'mobile' ? (
      <>
        <SettingRow
          title="إلزام سيريال جهاز على دخول التطبيق"
          description={
            values.enforceMobileDeviceSerial
              ? 'دخول التطبيق يلزم رقم جهاز. إذا اختلف عن المخزّن يُرسل إيميل تفعيل، أو تنتظر موافقة الإدارة إن كان الخيار التالي مفعّلاً.'
              : 'دخول التطبيق بدون فحص جهاز وبدون إيميل.'
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
              ? 'يتطلب تفعيل إلزام السيريال أولاً.'
              : values.requireAdminApprovalForNewMobileDevice
                ? 'الجهاز الجديد ينتظر موافقة الإدارة ثم يُرسل الإيميل.'
                : 'يُرسل إيميل التفعيل مباشرة لتطبيق الجوال.'
          }
          checked={values.requireAdminApprovalForNewMobileDevice}
          disabled={disabled || !values.enforceMobileDeviceSerial}
          onCheckedChange={(value) =>
            onChange({ requireAdminApprovalForNewMobileDevice: value })
          }
        />
      </>
    ) : (
      <>
        <SettingRow
          title="إلزام سيريال جهاز على دخول الموقع"
          description={
            values.enforceWebDeviceSerial
              ? 'دخول الويب يلزم بصمة الجهاز. إذا اختلفت عن المخزّن يُرسل إيميل تفعيل، أو تنتظر موافقة الإدارة إن كان الخيار التالي مفعّلاً.'
              : 'دخول لوحة الإدارة بدون سيريال وبدون إيميل.'
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
              ? 'يتطلب تفعيل إلزام السيريال أولاً.'
              : values.requireAdminApprovalForNewWebDevice
                ? 'الجهاز الجديد ينتظر موافقة الإدارة ثم يُرسل الإيميل.'
                : 'يُرسل إيميل التفعيل مباشرة لموقع الويب.'
          }
          checked={values.requireAdminApprovalForNewWebDevice}
          disabled={disabled || !values.enforceWebDeviceSerial}
          onCheckedChange={(value) => onChange({ requireAdminApprovalForNewWebDevice: value })}
        />
      </>
    );

  return (
    <section className="rounded-2xl border border-border/70 bg-card shadow-soft">
      {hideHeader ? (
        <p className="border-b border-border/60 px-4 py-3.5 text-xs leading-relaxed text-muted-foreground sm:px-5">
          {copy.description}
        </p>
      ) : (
        <header className="flex items-start gap-3 border-b border-border/60 px-4 py-3.5 sm:px-5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MonitorSmartphone className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{copy.title}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{copy.description}</p>
          </div>
        </header>
      )}
      <div className="p-4 sm:p-5">
        <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
          {rows}
        </div>
      </div>
    </section>
  );
}
