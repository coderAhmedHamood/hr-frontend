import type { ReactNode } from 'react';

export default function SystemAppLayout({ children }: { children: ReactNode }) {
  return <div className="system-app flex min-h-0 flex-1 flex-col">{children}</div>;
}
