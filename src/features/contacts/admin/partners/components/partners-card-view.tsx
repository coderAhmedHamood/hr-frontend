'use client';

import { Building2, Mail, Phone, User } from 'lucide-react';
import type { Partner } from '@/features/contacts/domain/types/partner';
import {
  PartnerRoleBadges,
  PartnerStatusBadge,
  partnerInitials,
} from '@/features/contacts/admin/partners/components/partner-role-badges';
import { cn } from '@/shared/utils';

type Props = {
  partners: Partner[];
  onOpen: (partner: Partner) => void;
};

export function PartnersCardView({ partners, onOpen }: Props) {
  if (!partners.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">لا توجد جهات اتصال.</p>;
  }

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {partners.map((partner) => (
        <div
          key={partner.id}
          className={cn(
            'flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-start shadow-soft',
            'transition-shadow hover:border-primary/40 hover:shadow-elevated',
          )}
          onClick={() => onOpen(partner)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpen(partner);
            }
          }}
          role="link"
          tabIndex={0}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-foreground">
              {partner.isCompany ? (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                partnerInitials(partner.displayName)
              )}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-medium text-foreground">{partner.displayName}</p>
                <PartnerStatusBadge status={partner.status} />
              </div>
              <PartnerRoleBadges partner={partner} />
            </div>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {partner.mobile || partner.phone ? (
              <p className="flex items-center gap-1.5 truncate" dir="ltr">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {partner.mobile || partner.phone}
              </p>
            ) : null}
            {partner.email ? (
              <p className="flex items-center gap-1.5 truncate" dir="ltr">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {partner.email}
              </p>
            ) : null}
            {!partner.mobile && !partner.phone && !partner.email ? (
              <p className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                بلا وسيلة اتصال أساسية
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
