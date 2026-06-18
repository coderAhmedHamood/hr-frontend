'use client';

import * as React from 'react';
import { Building2, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useSwitchDefaultCompany } from '@/features/auth/hooks/use-switch-default-company';
import {
  getCompanyAccessLabel,
  type CompanyAccess,
} from '@/features/auth/types/access-profile';
import { cn } from '@/shared/utils';

function companyInitial(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return 'ش';
  return trimmed.charAt(0);
}

function CompanyOption({
  company,
  selected,
  loading,
  onSelect,
  compact,
}: {
  company: CompanyAccess;
  selected: boolean;
  loading: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  const label = getCompanyAccessLabel(company);
  const role = company.roles?.[0]?.nameAr;

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onSelect}
      className={cn(
        'group flex w-full items-center gap-2.5 rounded-lg border text-right transition-all duration-150',
        compact ? 'px-2 py-2' : 'px-3 py-2.5',
        selected
          ? 'border-primary/35 bg-primary/8'
          : 'border-transparent hover:border-border/50 hover:bg-muted/60',
        loading && 'pointer-events-none opacity-70',
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md text-xs font-bold',
          compact ? 'h-7 w-7' : 'h-8 w-8',
          selected
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {companyInitial(label)}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', selected && 'text-primary')}>
          {label}
        </p>
        {role ? (
          <p className="truncate text-[10px] text-muted-foreground">{role}</p>
        ) : null}
      </div>
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : selected ? (
          <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
        ) : (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-border/70 group-hover:border-primary/40" />
        )}
      </span>
    </button>
  );
}

/** Company picker — rendered inside the user profile dropdown. */
export function CompanySwitcherMenuSection() {
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const defaultCompanyId = useDefaultCompanyId();
  const { switchCompany, switching, switchingToId } = useSwitchDefaultCompany();

  const companies = accessProfile?.companies ?? [];
  if (companies.length === 0) return null;

  const activeCompany =
    companies.find((c) => c.companyId === defaultCompanyId)
    ?? companies.find((c) => c.isDefault)
    ?? companies[0];

  const activeLabel = activeCompany ? getCompanyAccessLabel(activeCompany) : 'الشركة';

  const handleSelect = (companyId: string) => {
    if (companyId === defaultCompanyId || switching) return;
    void switchCompany(companyId);
  };

  if (companies.length === 1) {
    return (
      <div className="px-2 py-1.5">
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate text-xs font-medium text-foreground/80">{activeLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-1">
      <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
        الشركة النشطة
      </p>
      <div className="flex flex-col gap-0.5">
        {companies.map((company) => (
          <CompanyOption
            key={company.companyId}
            company={company}
            selected={company.companyId === defaultCompanyId}
            loading={switchingToId === company.companyId}
            onSelect={() => handleSelect(company.companyId)}
            compact
          />
        ))}
      </div>
    </div>
  );
}
