import { publicStoreRequest } from '@/features/ecommerce/storefront/lib/api/store-http';

/** GET /public/store/shipping-quote */
export type PublicShippingQuote = {
  amount: string;
  currencyCode: string;
  rateId: string | null;
  matchedScope: 'city' | 'district' | null;
};

export async function fetchPublicShippingQuote(input: {
  companyId: string;
  cityId?: string | null;
  districtId?: string | null;
}): Promise<PublicShippingQuote> {
  const data = await publicStoreRequest<PublicShippingQuote>('/public/store/shipping-quote', {
    query: {
      companyId: input.companyId,
      cityId: input.cityId || undefined,
      districtId: input.districtId || undefined,
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
