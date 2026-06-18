'use client';

import * as React from 'react';

interface SidebarContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

export const SidebarContext = React.createContext<SidebarContextValue>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const toggle = React.useCallback(() => setOpen(v => !v), []);
  return (
    <SidebarContext value={{ open, setOpen, toggle }}>
      {children}
    </SidebarContext>
  );
}

export function useSidebar() {
  return React.use(SidebarContext);
}
