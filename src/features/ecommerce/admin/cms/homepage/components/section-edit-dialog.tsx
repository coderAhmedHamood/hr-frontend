'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getSectionDefinition } from '@/features/ecommerce/storefront/page-builder/lib/section-definition-registry';
import type { SectionRecord } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import { SectionDefinitionFields } from '@/features/ecommerce/admin/cms/homepage/components/section-definition-fields';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  open: boolean;
  section: SectionRecord | null;
  onOpenChange: (open: boolean) => void;
  onSave: (section: SectionRecord) => void;
};

export function SectionEditDialog({ open, section, onOpenChange, onSave }: Props) {
  const t = useTranslations('ecommerceAdmin.homepage');
  const tCommon = useTranslations('common.actions');
  const locale = useLocale();
  const [draft, setDraft] = React.useState<SectionRecord | null>(null);

  React.useEffect(() => {
    if (open && section) {
      setDraft(structuredClone(section));
    }
  }, [open, section]);

  if (!section || !draft) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('editSection')}</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const definition = getSectionDefinition(section.type);
  const title = locale === 'en' ? definition.displayName.en : definition.displayName.ar;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>{t('editSection')}</span>
            <Badge variant="outline">{title}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3">
              <Label>{t('enabled')}</Label>
              <Switch
                checked={draft.enabled}
                onCheckedChange={(enabled) => setDraft({ ...draft, enabled })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('status')}</Label>
              <Select
                value={draft.status}
                onValueChange={(status) =>
                  setDraft({ ...draft, status: status as SectionRecord['status'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t('statuses.draft')}</SelectItem>
                  <SelectItem value="published">{t('statuses.published')}</SelectItem>
                  <SelectItem value="archived">{t('statuses.archived')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SectionDefinitionFields
            fields={definition.fields}
            value={draft as unknown as Record<string, unknown>}
            onChange={(next) => setDraft(next as unknown as SectionRecord)}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave({
                ...draft,
                updatedAt: new Date().toISOString(),
                revision: draft.revision + 1,
              });
              onOpenChange(false);
            }}
          >
            {tCommon('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
