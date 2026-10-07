'use client';

import * as React from 'react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useCan } from '@/features/auth/hooks/use-can';
import { useModuleEnablementContext } from '@/features/auth/hooks/use-system-owner';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { posActions, usePosData } from '@/features/pos/lib/pos-store';
import { isModuleEnabledFor } from '@/shared/modules/registry';

/** Permission codes of the app (same as the backend tree `pos.*`). */
export type PosPermission =
  | 'pos.sell'
  | 'pos.sales.read'
  | 'pos.discount'
  | 'pos.price.override'
  | 'pos.return'
  | 'pos.refund'
  | 'pos.refund.other-method'
  | 'pos.exceptions.resolve'
  | 'pos.cash.move'
  | 'pos.session.open'
  | 'pos.session.close'
  | 'pos.session.close-others'
  | 'pos.devices.manage'
  | 'pos.settings.manage'
  | 'pos.reports.read';

/** Everything a POS screen needs: company, its data, actions, the user and permissions. */
export function usePosContext() {
  const companyId = useDefaultCompanyId();
  const { data: company } = useActiveCompany();
  const user = useAuthStore((s) => s.user);
  const { companyId: moduleCompanyId, ...moduleContext } = useModuleEnablementContext();
  const can = useCan();
  const data = usePosData(companyId);
  const actions = React.useMemo(() => (companyId ? posActions(companyId) : null), [companyId]);

  const userName = user?.fullNameAr || user?.fullNameEn || user?.email || 'مستخدم';
  const enabled = isModuleEnabledFor('pos', companyId ?? moduleCompanyId, moduleContext);

  return {
    companyId,
    company,
    currency: company?.currencyCode ?? null,
    data,
    actions,
    userId: user?.id ?? 'unknown',
    userName,
    enabled,
    can: (code: PosPermission) => can(code),
  };
}
