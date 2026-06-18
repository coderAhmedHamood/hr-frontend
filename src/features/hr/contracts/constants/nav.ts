import type { LucideIcon } from 'lucide-react';
import {
  FileSignature,
  BookOpen,
  Coins,
  FileStack,
} from 'lucide-react';

export type HRContractsNavItem = {
  slug: string;
  labelAr: string;
  icon: LucideIcon;
};

export type HRContractsNavGroup = {
  labelAr: string;
  items: HRContractsNavItem[];
};

/** العقود فقط — للهيدر والشريط الجانبي. */
export const hrContractsOnlyNavGroups: HRContractsNavGroup[] = [
  {
    labelAr: 'العقود',
    items: [
      { slug: 'contract-templates', labelAr: 'قوالب العقود', icon: FileStack },
      { slug: 'employment', labelAr: 'عقود العمل', icon: FileSignature },
      { slug: 'articles', labelAr: 'مواد العقود', icon: BookOpen },
      { slug: 'allowance-types', labelAr: 'أنواع البدلات', icon: Coins },
    ],
  },
];

const CONTRACTS_ONLY_SLUGS = new Set(
  hrContractsOnlyNavGroups.flatMap((g) => g.items.map((i) => i.slug)),
);

export function isHrContractsOnlyNavPath(pathname: string): boolean {
  const segment = pathname.replace(/^\/hr\/contracts\/?/, '').split('/')[0]?.split('?')[0];
  return segment != null && CONTRACTS_ONLY_SLUGS.has(segment);
}
