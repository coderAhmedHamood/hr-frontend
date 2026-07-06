'use client';

import { BellRing } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/shared/utils';
import type {
  NotificationToggleGroup,
  NotificationToggleItem,
} from '@/features/system/organization/pages/_shared/constants/notification-groups';

type BooleanSettingsRecord = Partial<Record<string, boolean>>;

function tabValue(label: string): string {
  return label.replace(/\s+/g, '_');
}

function NotificationToggleRows({
  items,
  values,
  disabled,
  masterDisabled,
  onToggle,
  compact,
}: {
  items: NotificationToggleItem[];
  values: BooleanSettingsRecord;
  disabled?: boolean;
  masterDisabled?: boolean;
  onToggle: (key: string, value: boolean) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'sm:grid-cols-2')}>
      {items.map((item) => {
        const isMaster = item.key === 'notificationsEnabled';
        const rowDisabled = disabled || (masterDisabled && !isMaster);
        const isOn = Boolean(values[item.key]);

        return (
          <div
            key={item.key}
            className={cn(
              'flex items-start justify-between gap-3 rounded-xl border bg-card px-3.5 py-3 transition-colors',
              isMaster
                ? 'border-primary/25 shadow-soft sm:col-span-2'
                : 'border-border/70 shadow-soft hover:border-primary/15',
              isOn && !isMaster && 'border-primary/15 bg-primary/[0.02]',
            )}
          >
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium leading-tight">{item.label}</p>
              {item.description ? (
                <p className="text-[11px] leading-relaxed text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
            <Switch
              checked={isOn}
              disabled={rowDisabled}
              onCheckedChange={(v) => onToggle(item.key, v)}
              className="shrink-0"
            />
          </div>
        );
      })}
    </div>
  );
}

interface NotificationTogglesCardProps {
  title: string;
  description?: string;
  groups: NotificationToggleGroup[];
  values: BooleanSettingsRecord;
  disabled?: boolean;
  masterDisabled?: boolean;
  onToggle: (key: string, value: boolean) => void;
}

export function NotificationTogglesCard({
  title,
  description,
  groups,
  values,
  disabled,
  masterDisabled,
  onToggle,
}: NotificationTogglesCardProps) {
  const generalGroup = groups.find((g) => g.label === 'عام');
  const tabGroups = groups.filter((g) => g.label !== 'عام');
  const defaultTab = tabGroups[0] ? tabValue(tabGroups[0].label) : undefined;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border/80 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BellRing className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold sm:text-base">{title}</h3>
            {description ? (
              <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {generalGroup ? (
          <NotificationToggleRows
            items={generalGroup.items}
            values={values}
            disabled={disabled}
            masterDisabled={false}
            onToggle={onToggle}
          />
        ) : null}

        {tabGroups.length > 0 && defaultTab ? (
          <Tabs defaultValue={defaultTab} dir="rtl" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/40 p-1">
              {tabGroups.map((group) => (
                  <TabsTrigger
                    key={group.label}
                    value={tabValue(group.label)}
                    className="rounded-lg px-3 py-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-soft sm:text-sm"
                  >
                    {group.label}
                  </TabsTrigger>
                ))}
            </TabsList>

            {tabGroups.map((group) => (
              <TabsContent key={group.label} value={tabValue(group.label)} className="mt-4">
                <NotificationToggleRows
                  items={group.items}
                  values={values}
                  disabled={disabled}
                  masterDisabled={masterDisabled}
                  onToggle={onToggle}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : null}
      </div>
    </section>
  );
}

/** Compact toggle list for organization user notifications */
export function NotificationToggleList({
  items,
  values,
  disabled,
  onToggle,
}: {
  items: { key: string; label: string }[];
  values: BooleanSettingsRecord;
  disabled?: boolean;
  onToggle: (key: string, value: boolean) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const isOn = Boolean(values[item.key]);

        return (
          <div
            key={item.key}
            className={cn(
              'flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3.5 py-3 shadow-soft transition-all hover:border-primary/15',
              isOn && 'border-primary/15 bg-primary/[0.02]',
            )}
          >
            <p className="text-sm font-medium">{item.label}</p>
            <Switch
              checked={isOn}
              disabled={disabled}
              onCheckedChange={(v) => onToggle(item.key, v)}
              className="shrink-0"
            />
          </div>
        );
      })}
    </div>
  );
}
