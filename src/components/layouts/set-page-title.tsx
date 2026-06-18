'use client';

import { useSetPageTitle, type PageTitleMeta } from '@/components/layouts/page-title-context';

export function SetPageTitle(props: PageTitleMeta) {
  useSetPageTitle(props);
  return null;
}
