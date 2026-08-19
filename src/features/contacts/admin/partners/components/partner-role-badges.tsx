'use client';

import { Badge } from '@/components/ui/badge';
import type { Partner } from '@/features/contacts/domain/types/partner';
import { PARTNER_STATUS_LABELS } from '@/features/contacts/domain/constants/labels';

export function PartnerRoleBadges({ partner }: { partner: Partner }) {
  const roles: { key: string; label: string; variant: 'default' | 'success' | 'subtle' | 'warning' }[] = [];
  if (partner.isCustomer) roles.push({ key: 'customer', label: 'عميل', variant: 'success' });
  if (partner.isVendor) roles.push({ key: 'vendor', label: 'مورد', variant: 'default' });
  if (partner.isEmployee) roles.push({ key: 'employee', label: 'موظف', variant: 'warning' });
  if (partner.isInternal) roles.push({ key: 'internal', label: 'داخلي', variant: 'subtle' });

  return (
    <div className="flex flex-wrap gap-1">
      <Badge variant="subtle">{partner.isCompany ? 'شركة' : 'شخص'}</Badge>
      {roles.map((role) => (
        <Badge key={role.key} variant={role.variant}>
          {role.label}
        </Badge>
      ))}
      {!roles.length ? <Badge variant="subtle">جهة اتصال</Badge> : null}
    </div>
  );
}

export function PartnerStatusBadge({ status }: { status: Partner['status'] }) {
  const variant =
    status === 'active' ? 'success' : status === 'draft' ? 'warning' : status === 'inactive' ? 'subtle' : 'destructive';
  return <Badge variant={variant}>{PARTNER_STATUS_LABELS[status]}</Badge>;
}

export function partnerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}
