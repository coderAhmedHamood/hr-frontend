import * as React from 'react';

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col animate-fade-in">{children}</div>;
}
