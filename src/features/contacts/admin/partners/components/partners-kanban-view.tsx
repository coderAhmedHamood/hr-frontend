'use client';

import type { Partner, PartnerStatus } from '@/features/contacts/domain/types/partner';
import { KANBAN_STATUSES, PARTNER_STATUS_LABELS } from '@/features/contacts/domain/constants/labels';
import {
  PartnerRoleBadges,
  partnerInitials,
} from '@/features/contacts/admin/partners/components/partner-role-badges';
import { cn } from '@/shared/utils';

type Props = {
  partners: Partner[];
  onOpen: (partner: Partner) => void;
  onStatusChange?: (partner: Partner, status: PartnerStatus) => void;
};

export function PartnersKanbanView({ partners, onOpen, onStatusChange }: Props) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {KANBAN_STATUSES.map((status) => {
        const column = partners.filter((p) => p.status === status);
        return (
          <div key={status} className="flex min-h-[320px] flex-col rounded-2xl border border-border bg-muted/20">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <h3 className="text-sm font-semibold text-foreground">{PARTNER_STATUS_LABELS[status]}</h3>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                {column.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-2">
              {column.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => onOpen(partner)}
                  className={cn(
                    'rounded-xl border border-border bg-card p-3 text-start shadow-soft',
                    'transition-shadow hover:border-primary/40 hover:shadow-elevated',
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {partnerInitials(partner.displayName)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{partner.displayName}</span>
                  </div>
                  <PartnerRoleBadges partner={partner} />
                  {onStatusChange && status !== 'active' ? (
                    <button
                      type="button"
                      className="mt-2 text-xs text-primary hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(partner, 'active');
                      }}
                    >
                      تفعيل
                    </button>
                  ) : null}
                </button>
              ))}
              {!column.length ? (
                <p className="py-8 text-center text-xs text-muted-foreground">لا عناصر</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
