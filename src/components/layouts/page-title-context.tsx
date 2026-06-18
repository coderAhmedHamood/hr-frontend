'use client';

import * as React from 'react';

export interface PageTitleMeta {
  titleAr: string;
  descriptionAr?: string;
  iconName?: string;
}

interface PageTitleContextValue {
  meta: PageTitleMeta;
  setMeta: (m: PageTitleMeta) => void;
}

export const PageTitleContext = React.createContext<PageTitleContextValue>({
  meta: { titleAr: '' },
  setMeta: () => {},
});

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = React.useState<PageTitleMeta>({ titleAr: '' });
  return (
    <PageTitleContext value={{ meta, setMeta }}>
      {children}
    </PageTitleContext>
  );
}

export function usePageTitle() {
  return React.use(PageTitleContext);
}

export function useSetPageTitle(m: PageTitleMeta) {
  const { setMeta } = usePageTitle();
  React.useEffect(() => { setMeta(m); }, [m.titleAr, m.descriptionAr, m.iconName, setMeta]);
}
