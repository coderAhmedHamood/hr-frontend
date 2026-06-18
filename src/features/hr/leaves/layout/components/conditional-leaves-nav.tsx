'use client';

import { HideOnPathPrefixes } from '@/components/shared/hide-on-path-prefixes';
import { LeavesNav } from '@/features/hr/leaves/layout/components/leaves-nav';
import { LEAVES_NAV_HIDDEN_PREFIXES } from '@/features/hr/leaves/layout/constants/leaves-nav';

export function ConditionalLeavesNav() {
  return (
    <HideOnPathPrefixes prefixes={LEAVES_NAV_HIDDEN_PREFIXES}>
      <LeavesNav />
    </HideOnPathPrefixes>
  );
}
