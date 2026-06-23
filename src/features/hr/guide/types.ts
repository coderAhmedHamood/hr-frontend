export type GuideField = {
  name: string;
  description: string;
  required?: boolean;
};

export type GuideBlock = {
  id: string;
  title: string;
  paragraphs?: string[];
  fields?: GuideField[];
  bullets?: string[];
  note?: string;
};

export type GuidePage = {
  slug: string;
  title: string;
  categoryId: GuideCategoryId;
  why: string;
  prerequisites?: string[];
  systemHref?: string;
  systemHrefLabel?: string;
  blocks: GuideBlock[];
  relatedSlugs?: string[];
};

export type GuideCategoryId =
  | 'prologue'
  | 'organization'
  | 'attendance'
  | 'leaves'
  | 'requests'
  | 'discipline'
  | 'payroll'
  | 'recruitment'
  | 'settings'
  | 'usage';

export type GuideCategory = {
  id: GuideCategoryId;
  label: string;
};
