'use client';

export default function EcommerceModuleLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col gap-6 animate-fade-in">{children}</div>;
}
