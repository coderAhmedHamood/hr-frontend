'use client';

import * as React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InventoryOperationKindPage } from '@/features/inventory/admin/operations/components/inventory-operation-kind-page';
import { PhysicalCountDialog } from '@/features/inventory/admin/physical-count/components/physical-count-dialog';

export function PhysicalCountsPage() {
  const [open, setOpen] = React.useState(false);
  const countButton = React.useMemo(
    () => (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ClipboardCheck className="size-4" />
        <span className="hidden sm:inline">جرد مستودع</span>
      </Button>
    ),
    [],
  );

  return (
    <>
      <InventoryOperationKindPage kind="physical_count" headerExtra={countButton} />
      <PhysicalCountDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
