/** Deterministic mock reviews until the catalog API provides real ones. */

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

const REVIEW_AUTHORS = [
  'سارة أحمد', 'محمد العمري', 'فاطمة الشيباني', 'خالد الحضرمي', 'منى السقاف',
  'عبدالله الحميري', 'ريم الزبيدي', 'ياسر باعباد', 'هدى المخلافي', 'أحمد الشامي',
];

const REVIEW_COMMENTS = [
  'منتج ممتاز وجودته عالية، أنصح به بشدة.',
  'التوصيل كان سريعًا والمنتج مطابق للوصف تمامًا.',
  'جربته لأول مرة وأعجبني القوام والرائحة.',
  'سعر مناسب مقارنة بالجودة، سأكرر الطلب.',
  'يحتاج وقتًا أطول قليلًا لرؤية النتيجة لكنه فعّال.',
  'من أفضل المنتجات التي جربتها في هذه الفئة.',
  'العبوة وصلت محكمة الإغلاق وبحالة ممتازة.',
  'نتيجة جيدة مع الاستخدام المنتظم يوميًا.',
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index) * (index + 7)) % 9973;
  }
  return hash;
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function buildReviewSummary(productId: string, average: number, total: number): ReviewSummary {
  const seed = hashSeed(productId);
  if (total <= 0) {
    return { average: 0, total: 0, breakdown: [5, 4, 3, 2, 1].map((stars) => ({ stars: stars as 5 | 4 | 3 | 2 | 1, count: 0, percent: 0 })) };
  }

  // Skew most weight toward the rounded rating and its neighbors.
  const rounded = Math.round(average);
  const weights: Record<number, number> = { 5: 4, 4: 7, 3: 3, 2: 1, 1: 1 };
  const shaped: Record<number, number> = {};
  for (const stars of [5, 4, 3, 2, 1]) {
    const distance = Math.abs(stars - rounded);
    shaped[stars] = Math.max(1, (weights[stars] ?? 1) - distance * 2 + (seed % 3));
  }
  const sumWeights = Object.values(shaped).reduce((sum, w) => sum + w, 0);

  let remaining = total;
  const breakdown: ReviewBreakdown[] = [5, 4, 3, 2, 1].map((stars, index, arr) => {
    const isLast = index === arr.length - 1;
    const count = isLast ? remaining : Math.round((shaped[stars] / sumWeights) * total);
    remaining -= count;
    return { stars: stars as 5 | 4 | 3 | 2 | 1, count: Math.max(0, count), percent: Math.round((Math.max(0, count) / total) * 100) };
  });

  return { average, total, breakdown };
}

export function buildProductReviews(productId: string, average: number, total: number, count = 5): ProductReview[] {
  if (total <= 0) return [];
  const seed = hashSeed(productId);

  return Array.from({ length: Math.min(count, total) }, (_, index) => {
    const localSeed = seed + index * 37;
    const authorName = REVIEW_AUTHORS[localSeed % REVIEW_AUTHORS.length]!;
    const comment = REVIEW_COMMENTS[(localSeed + index) % REVIEW_COMMENTS.length]!;
    const ratingJitter = ((localSeed % 3) - 1) * 0.5;
    const rating = Math.min(5, Math.max(1, Math.round(average + ratingJitter)));
    return {
      id: `${productId}-review-${index}`,
      authorName,
      rating,
      date: daysAgoIso(5 + ((localSeed * 3) % 240)),
      comment,
      verified: localSeed % 4 !== 0,
    };
  });
}
