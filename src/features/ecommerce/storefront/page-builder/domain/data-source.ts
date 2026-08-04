/** Section data source kinds — extensible without UI changes. */
export const DATA_SOURCE_KINDS = [
  'manual',
  'category',
  'tag',
  'collection',
  'query',
  'recommendation',
] as const;

export type DataSourceKind = (typeof DATA_SOURCE_KINDS)[number];

export type ManualDataSource = {
  kind: 'manual';
  entityIds: string[];
};

export type CategoryDataSource = {
  kind: 'category';
  categoryId: string;
  limit: number;
};

export type TagDataSource = {
  kind: 'tag';
  tag: string;
  limit: number;
};

export type CollectionDataSource = {
  kind: 'collection';
  collectionId: string;
  limit: number;
};

export type QueryDataSource = {
  kind: 'query';
  sort: 'createdAt' | 'price' | 'sales' | 'name';
  sortDirection: 'asc' | 'desc';
  limit: number;
  categoryId: string | null;
  tag: string | null;
  /** Active “new product” promo flag (backend `isNewProduct`). */
  isNewProduct?: boolean | null;
  /** Active “today’s deal” promo flag (backend `isTodayDeal`). */
  isTodayDeal?: boolean | null;
  /** Active wholesale flag (backend `isWholesale`). */
  isWholesale?: boolean | null;
  /** Active discount flag (backend `isDiscounted`). */
  isDiscounted?: boolean | null;
};

/** Future recommendation engine slot — not implemented server-side yet. */
export type RecommendationDataSource = {
  kind: 'recommendation';
  slot: string;
  limit: number;
};

export type DataSourceConfig =
  | ManualDataSource
  | CategoryDataSource
  | TagDataSource
  | CollectionDataSource
  | QueryDataSource
  | RecommendationDataSource;
