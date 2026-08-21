# Storefront — product promos & filters

Guide for the storefront team: how demo seed data maps to ERP «العروض والترويج», homepage sections, and public API filters.

## Promo fields on each product (ERP / CMS)

| CMS toggle | DB fields | Storefront filter param |
|---|---|---|
| منتج حديث | `isNewProduct`, `newUntil` (null = no expiry) | `isNewProduct=true` |
| تخفيضات اليوم | `isTodayDeal`, `dealPriceAmount`, `dealDays`, `dealUntil` | `isTodayDeal=true` |
| أسعار جملة | `isWholesale`, `wholesalePriceAmount`, `wholesaleUntil` | `isWholesale=true` |
| خصومات | `isDiscounted`, `discountPercent`, `discountUntil` | `isDiscounted=true` |

Response also includes `*Active` booleans (e.g. `isTodayDealActive`) computed server-side from flag + until date.

## Demo seed distribution (100 products)

**16 curated** (`ecommerce-products.data.json`) — mixed promos on real SKUs.

**84 bulk** (`ND-DEMO-001` … `ND-DEMO-084`):

| SKU range | Promo |
|---|---|
| 001–015 | منتج حديث فقط |
| 016–027 | تخفيضات اليوم (+ `dealPriceAmount`, `dealDays=7`) |
| 028–035 | جملة (+ `wholesalePriceAmount`) |
| 036–045 | خصم 20% |
| 046–084 | **منتجات عامة** — بدون أي عرض |

All until-dates are **null** in seed (= no expiry, matches CMS “بدون تاريخ انتهاء”).

Re-apply: `npm run seed:ecommerce-products` then `npm run seed:demo`.

## Public API

### 1. Promo counts (nav badges, fast UI)

```
GET /public/inventory/products/promo-stats?companyId={uuid}
```

```json
{
  "totalActive": 100,
  "newProducts": 22,
  "todayDeals": 18,
  "wholesale": 10,
  "discounted": 12,
  "general": 55
}
```

- Call once on shell load (cache ~1–5 min).
- `general` = active products with **no** active promo window (exclusive count).
- Buckets can overlap on the same SKU (curated products may have multiple flags).

### 2. Product lists

```
GET /public/inventory/products?companyId={uuid}&page=1&limit=24
```

**General catalog (no promo filters):** omit `isNewProduct`, `isTodayDeal`, `isWholesale`, `isDiscounted`. Returns all active sellable products — use for `/store/products`.

**Filtered pages:**

| Page | Query |
|---|---|
| `/store/products?new=1` | `&isNewProduct=true` |
| `/store/offers` | `&isTodayDeal=true` |
| `/store/wholesale` | `&isWholesale=true` |
| Discounts (custom route) | `&isDiscounted=true` |

Optional: `search`, `categoryId`, `brandId`, `tags`, `sort`, `sortDirection`.

Pagination: `page`, `limit` (default from backend pagination DTO).

### 3. Store config (page toggles)

```
GET /public/store/companies/{companyId}/config
```

- `settings.storePageOffersEnabled` → show deals nav/page
- `settings.storePageWholesaleEnabled` → show wholesale nav/page

## Homepage CMS sections (seed)

| Section | `dataSource` filter |
|---|---|
| وصل حديثاً | `{ "isNewProduct": true, "limit": 12 }` |
| تخفيضات اليوم | `{ "isTodayDeal": true, "limit": 8 }` |
| أسعار الجملة | `{ "isWholesale": true, "limit": 8 }` |
| خصومات | `{ "isDiscounted": true, "limit": 8 }` |

Frontend resolves each section by calling the public products API with the same query params as `dataSource`.

## Frontend checklist

1. **Shell:** load `config` + `promo-stats` in parallel.
2. **All products:** list API **without** promo params; show badges from `isNewProductActive`, etc. on cards.
3. **Promo pages:** one boolean param each; reuse same product card component.
4. **Do not** filter client-side from a full catalog fetch — use server filters for performance.
5. **Pricing display:** base = `priceAmount`; deal = `dealPriceAmount`; wholesale = `wholesalePriceAmount`; discount = apply `discountPercent` to base when `isDiscountActive`.
