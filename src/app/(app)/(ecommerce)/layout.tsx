'use client';

export default function EcommerceModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="store-admin-app flex min-h-0 flex-1 flex-col gap-5 animate-fade-in">
      {children}
    </div>
  );
}
