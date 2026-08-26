'use client';

import * as React from 'react';
import { useCan } from '@/features/auth/hooks/use-can';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useModuleEnablementContext } from '@/features/auth/hooks/use-system-owner';
import { useCurrentEmployee } from '@/features/hr/organization/employees/hooks/useCurrentEmployee';
import { isModuleEnabledFor } from '@/shared/modules/registry';

export type UnifiedNotificationTabId = 'hr' | 'inventory' | 'store' | 'contacts';

export type UnifiedNotificationTab = {
  id: UnifiedNotificationTabId;
  label: string;
  canUpdate: boolean;
};

export function useUnifiedNotificationTabs(): {
  tabs: UnifiedNotificationTab[];
  userId: string;
  employeeId: string;
  inventoryEnabled: boolean;
  storeEnabled: boolean;
  contactsEnabled: boolean;
  hrEnabled: boolean;
} {
  const can = useCan();
  const userId = useAuthStore((s) => s.user?.id ?? s.accessProfile?.userId ?? '');
  const { data: currentEmployee } = useCurrentEmployee();
  const employeeId = currentEmployee?.id ?? '';

  const { companyId: activeCompanyId, ...moduleContext } = useModuleEnablementContext();
  const hrEnabled = isModuleEnabledFor('hr', activeCompanyId, moduleContext);
  const inventoryEnabled = isModuleEnabledFor('inventory', activeCompanyId, moduleContext);
  const storeEnabled = isModuleEnabledFor('ecommerce', activeCompanyId, moduleContext);
  const contactsEnabled = isModuleEnabledFor('contacts', activeCompanyId, moduleContext);

  const tabs = React.useMemo(() => {
    const result: UnifiedNotificationTab[] = [];

    if (hrEnabled && employeeId) {
      result.push({
        id: 'hr',
        label: 'الموارد البشرية',
        canUpdate: true,
      });
    }

    if (inventoryEnabled && userId && can('inv.notifications.read')) {
      result.push({
        id: 'inventory',
        label: 'المخازن',
        canUpdate: can('inv.notifications.update'),
      });
    }

    if (storeEnabled && userId && (can('sta.notifications.read') || can('hr.notifications.read'))) {
      result.push({
        id: 'store',
        label: 'المتجر',
        canUpdate: can('sta.notifications.update') || can('hr.notifications.update'),
      });
    }

    if (contactsEnabled && userId && (can('cnt.notifications.read') || can('hr.notifications.read'))) {
      result.push({
        id: 'contacts',
        label: 'جهات الاتصال',
        canUpdate: can('cnt.notifications.update') || can('hr.notifications.update'),
      });
    }

    return result;
  }, [hrEnabled, inventoryEnabled, storeEnabled, contactsEnabled, userId, employeeId, can]);

  return {
    tabs,
    userId,
    employeeId,
    inventoryEnabled,
    storeEnabled,
    contactsEnabled,
    hrEnabled,
  };
}
