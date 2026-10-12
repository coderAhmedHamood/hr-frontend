'use client';

import * as React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InventoryOperationKindPage } from '@/features/inventory/admin/operations/components/inventory-operation-kind-page';
import { OpeningBalanceImportDialog } from '@/features/inventory/admin/opening-balance/components/opening-balance-import-dialog';

export function OpeningBalancePage() {
  const [importOpen, setImportOpen] = React.useState(false);
  const importButton = React.useMemo(
    () => (
      <Button type="button" variant="outline" size="sm" onClick={() => setImportOpen(true)}>
        <FileSpreadsheet className="size-4" />
        <span className="hidden sm:inline">استيراد من Excel</span>
      </Button>
    ),
    [],
  );

  return (
    <>
      <InventoryOperationKindPage kind="opening" headerExtra={importButton} />
      <OpeningBalanceImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
