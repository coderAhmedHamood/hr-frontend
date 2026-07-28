import type { ReactNode } from 'react';

export default function ContactsAppLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
