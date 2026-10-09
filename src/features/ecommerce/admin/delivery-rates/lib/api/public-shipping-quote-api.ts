import { publicStoreRequest } from '@/features/ecommerce/storefront/lib/api/store-http';

/** GET /public/store/shipping-quote */
export type PublicShippingQuote = {
  /** The fee charged (0 once the free-delivery amount is reached). */
  amount: string;
  /** The rate before free delivery (absent from an older backend). */
  baseAmount?: string;
  /** Free delivery from this items amount (null: never). */
  freeAboveAmount?: string | null;
  freeApplied?: boolean;
  currencyCode: string;
  rateId: string | null;
  matchedScope: 'city' | 'district' | null;
};

export async function fetchPublicShippingQuote(input: {
  companyId: string;
  cityId?: string | null;
  districtId?: string | null;
  /** The cart's items amount (free delivery above the rate's threshold). */
  subtotal?: number;
}): Promise<PublicShippingQuote> {
  const data = await publicStoreRequest<PublicShippingQuote>('/public/store/shipping-quote', {
    query: {
      companyId: input.companyId,
      cityId: input.cityId || undefined,
      districtId: input.districtId || undefined,
      subtotal: input.subtotal,
    },
    nullOn404: true,
  });
  return (
    data ?? {
      amount: '0.0000',
      currencyCode: 'YER',
      rateId: null,
      matchedScope: null,
    }
  );
}
