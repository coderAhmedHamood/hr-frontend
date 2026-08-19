import type { ReactNode } from 'react';

export default function InventoryAppLayout({ children }: { children: ReactNode }) {
  return <div className="inventory-app flex min-h-0 flex-1 flex-col">{children}</div>;
}
