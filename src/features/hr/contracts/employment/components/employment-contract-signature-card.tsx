'use client';

import { Check, Clock, MousePointerClick, X } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { HRContractLifecycleStatus } from '@/features/hr/contracts/lib/contracts-store';

type Props = {
  signed: boolean;
  rejectionReason?: string | null;
  contractStatus?: HRContractLifecycleStatus;
  variant?: 'compact' | 'detailed';
  className?: string;
};

type AcceptanceState = {
  label: string;
  icon: typeof Check;
  className: string;
};

function resolveAcceptanceState(
  signed: boolean,
  rejectionReason: string | null | undefined,
  contractStatus: HRContractLifecycleStatus | undefined,
): AcceptanceState {
  if (rejectionReason?.trim()) {
    return {
      label: 'رفض العقد',
      icon: X,
      className: 'text-destructive',
    };
  }
  if (signed) {
    return {
      label: 'وافق على العقد',
      icon: Check,
      className: 'text-success',
    };
  }
  if (contractStatus === 'pending_signature') {
    return {
      label: 'بانتظار الموافقة',
      icon: Clock,
      className: 'text-primary',
    };
  }
  return {
    label: 'لم يوافق بعد',
    icon: MousePointerClick,
    className: 'text-muted-foreground',
  };
}

export function EmploymentContractSignatureCard({
  signed,
  rejectionReason,
  contractStatus,
  variant = 'compact',
  className,
}: Props) {
  const state = resolveAcceptanceState(signed, rejectionReason, contractStatus);
  const Icon = state.icon;
  const detailed = variant === 'detailed';

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border/60 bg-muted/25',
        detailed ? 'px-3 py-2.5' : 'px-2.5 py-1.5',
        className,
      )}
    >
      <Icon className={cn('shrink-0', state.className, detailed ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
      <div className="min-w-0 flex-1">
        <p className={cn('font-medium leading-tight', state.className, detailed ? 'text-sm' : 'text-[11px]')}>
          {state.label}
        </p>
        {detailed ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {rejectionReason?.trim()
              ? `السبب: ${rejectionReason.trim()}`
              : signed
                ? 'تم تأكيد الموافقة بنقرة واحدة من تطبيق الموظف.'
                : 'يؤكّد الموظف موافقته أو رفضه من إشعار العقد — بدون توقيع يدوي.'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
