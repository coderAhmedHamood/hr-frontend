'use client';

import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { NotificationToggleGroup, NotificationToggleItem } from '@/features/hr/settings/constants/notification-groups';

type BooleanSettingsRecord = Partial<Record<string, boolean>>;

function tabValue(label: string): string {
  return label.replace(/\s+/g, '_');
}

function countEnabledInGroup(group: NotificationToggleGroup, values: BooleanSettingsRecord): number {
  return group.items.filter((item) => Boolean(values[item.key])).length;
}

function NotificationToggleRows({
  items,
  values,
  disabled,
  masterDisabled,
  onToggle,
}: {
  items: NotificationToggleItem[];
  values: BooleanSettingsRecord;
  disabled?: boolean;
  masterDisabled?: boolean;
  onToggle: (key: string, value: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isMaster = item.key === 'notificationsEnabled';
        const rowDisabled = disabled || (masterDisabled && !isMaster);

        return (
          <div
            key={item.key}
            className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/10 px-4 py-3 transition-colors hover:bg-muted/20"
          >
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium leading-tight">{item.label}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              )}
            </div>
            <Switch
              checked={Boolean(values[item.key])}
              disabled={rowDisabled}
              onCheckedChange={(v) => onToggle(item.key, v)}
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5">
        {generalGroup && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <NotificationToggleRows
              items={generalGroup.items}
              values={values}
              disabled={disabled}
              masterDisabled={false}
              onToggle={onToggle}
            />
          </div>
        )}

        {tabGroups.length > 0 && defaultTab && (
          <Tabs defaultValue={defaultTab} dir="rtl" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
              {tabGroups.map((group) => {
                const enabled = countEnabledInGroup(group, values);
                const total = group.items.length;
                return (
                  <TabsTrigger
                    key={group.label}
                    value={tabValue(group.label)}
                    className="text-xs sm:text-sm px-3 py-2 data-[state=active]:bg-background"
                  >
                    {group.label}
                    <Badge
                      variant="secondary"
                      className="ms-1.5 h-5 min-w-5 px-1.5 text-[10px] font-mono tabular-nums"
                    >
                      {enabled}/{total}
                    </Badge>
                  </TabsTrigger>
                );
              })}
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
        )}
      </CardContent>
    </Card>
  );
}

/** Compact toggle list for organization user notifications tab */
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
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.key}
          className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/10 px-4 py-3"
        >
          <p className="text-sm font-medium">{item.label}</p>
          <Switch
            checked={Boolean(values[item.key])}
            disabled={disabled}
            onCheckedChange={(v) => onToggle(item.key, v)}
          />
        </div>
      ))}
    </div>
  );
}
