export type ProductReview = {
  id: string;
  authorName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
};

export type ReviewBreakdown = {
  stars: 5 | 4 | 3 | 2 | 1;
  count: number;
  percent: number;
};

export type ReviewSummary = {
  average: number;
  total: number;
  breakdown: ReviewBreakdown[];
};
