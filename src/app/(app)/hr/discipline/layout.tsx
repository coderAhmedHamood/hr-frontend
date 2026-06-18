import * as React from 'react';

export default function DisciplineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {children}
    </div>
  );
}
