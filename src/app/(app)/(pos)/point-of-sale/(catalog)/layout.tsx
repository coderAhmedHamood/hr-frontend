'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useModuleEnablementContext } from '@/features/auth/hooks/use-system-owner';
import { isModuleEnabledFor } from '@/shared/modules/registry';
import { posRoutes } from '@/features/pos/constants/routes';

/**
 * The products app's screens inside نقاط البيع: shown only while that app is
 * enabled for the company; a direct link otherwise goes back to the overview.
 */
export default function PosCatalogLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { companyId, ...moduleContext } = useModuleEnablementContext();
  const catalogEnabled = isModuleEnabledFor('catalog', companyId, moduleContext);

  React.useEffect(() => {
    if (companyId && !catalogEnabled) router.replace(posRoutes.overview);
  }, [companyId, catalogEnabled, router]);

  if (!catalogEnabled) return null;
  return <>{children}</>;
}
