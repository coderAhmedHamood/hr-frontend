# تقارير مبيعات المتجر — دليل الفرونت

عقد التزام بين الـ Backend ولوحة **إدارة المتجر** (Store Admin).

**Base:** `{HOST}/store-admin/reports/sales`  
**Auth:** `Authorization: Bearer <access_token>`  
**صلاحية:** `sta.reports.read`  
**JSON:** camelCase · Envelope: `{ status, message, data, error }`  
**مبالغ:** دائماً **string** بـ 4 منازل عشرية (مثل `"1200.0000"`)

بعد سحب الـ Backend:

```bash
npm run system:init   # يضيف صلاحية sta.reports.read
```

Swagger: **Store Admin - Sales Reports**

---

## 0) كيف تستفيد بأفضل صورة

| شاشة فرونت | Endpoint | الغرض |
|------------|----------|--------|
| بطاقات KPI أعلى الداشبورد | `GET …/summary` | إيراد، عدد طلبات، AOV، مدفوع، ملغى… |
| رسم بياني زمني | `GET …/timeseries` | يوم / أسبوع / شهر |
| فطيرة/أعمدة الحالات | `GET …/by-status` | أين تتوقف الطلبات في المسار |
| طرق الدفع | `GET …/by-payment` | COD vs بطاقة + حالة الدفع |
| خريطة/جدول مدن | `GET …/by-city` | أين يبيع المتجر أكثر |
| أفضل المنتجات | `GET …/by-product` | ما يُباع فعلياً (بنود) |
| أفضل العملاء | `GET …/by-partner` | شركاء + ضيوف مجمّعين |
| جدول تفصيلي / تصدير Excel | `GET …/lines` | كل سطر منتج + بيانات الطلب |

**نصيحة UI:** نفس شريط الفلاتر لكل الشاشات؛ غيّر الفلاتر → أعد طلب كل الـ endpoints الظاهرة معاً.

---

## 1) الفلاتر المشتركة (Query)

كلها اختيارية ما عدا `companyId`.

| Query | نوع | ملاحظة |
|-------|-----|--------|
| `companyId` | uuid * | إلزامي |
| `from` | ISO date/datetime | بداية شاملة، مثل `2026-08-01` |
| `to` | ISO date/datetime | نهاية شاملة لليوم إن كانت تاريخاً فقط |
| `status` | enum طلب | `pending` … `refunded` |
| `paymentStatus` | enum | `pending` \| `paid` \| `failed` \| `refunded` |
| `paymentMethod` | enum | `cash_on_delivery` \| `card` |
| `source` | enum | `storefront` \| `seed` |
| `partnerId` | uuid | عميل معيّن |
| `hasPartner` | boolean | `true` مسجّل فقط / `false` ضيف فقط |
| `city` | string | مطابقة نص `shipCity` |
| `countryId` | uuid | من geo |
| `cityId` | uuid | من geo |
| `districtId` | uuid | من geo |
| `productId` | uuid | طلبات تحتوي هذا المنتج |
| `variantId` | uuid | متغير معيّن |
| `currencyCode` | string | مثل `YER` |
| `search` | string | رقم طلب / اسم / هاتف (و`productName` في lines) |
| `excludeCancelledRefunded` | boolean | **افتراضي `true`** للإيراد |

### قاعدة الإيراد

- عندما **لا** تُرسل `status` و`excludeCancelledRefunded !== false`:  
  أرقام **الإيراد** تستبعد `cancelled` و`refunded`.
- إن أرسلت `status=cancelled` صراحةً: يُحسب ذلك الوضع فقط (لا استبعاد تلقائي).
- `ordersCount` في summary يشمل كل ما يطابق الفلاتر (قبل استبعاد الإيراد)، بينما `revenueOrdersCount` / `revenueTotal` بعد الاستبعاد.

---

## 2) الملخص — `GET /store-admin/reports/sales/summary`

```bash
curl -s "$HOST/store-admin/reports/sales/summary?companyId=COMPANY&from=2026-08-01&to=2026-08-31" \
  -H "Authorization: Bearer $TOKEN"
```

### Response `data`

```ts
{
  companyId: string;
  from: string | null;
  to: string | null;
  ordersCount: number;           // كل الطلبات المطابقة
  revenueOrdersCount: number;    // المستخدمة للإيراد
  revenueTotal: string;          // مجموع totalAmount
  merchandiseTotal: string;      // مجموع subtotal
  shippingTotal: string;         // مجموع الشحن
  averageOrderValue: string;     // revenueTotal / revenueOrdersCount
  paidOrdersCount: number;
  paidAmount: string;            // مجموع المدفوع فعلياً
  pendingOrdersCount: number;
  deliveredOrdersCount: number;
  cancelledOrdersCount: number;
  refundedOrdersCount: number;
  guestOrdersCount: number;
  partnerOrdersCount: number;
  unitsSold: number;             // مجموع كميات البنود لإيرادات
  currencyCode: string | null;
}
```

### بطاقات مقترحة

1. **الإيراد** → `revenueTotal`
2. **عدد الطلبات** → `revenueOrdersCount` (أو `ordersCount`)
3. **متوسط الطلب** → `averageOrderValue`
4. **محصّل (مدفوع)** → `paidAmount` / `paidOrdersCount`
5. **وحدات مباعة** → `unitsSold`
6. **ملغى** → `cancelledOrdersCount` (تحذير تشغيلي)

---

## 3) السلسلة الزمنية — `GET …/timeseries`

| Query إضافي | قيم |
|-------------|-----|
| `granularity` | `day` (افتراضي) \| `week` \| `month` |

```ts
{
  granularity: 'day' | 'week' | 'month';
  points: Array<{
    periodKey: string;      // "2026-08-01" أو "2026-08"
    periodStart: string;    // ISO
    ordersCount: number;
    revenueTotal: string;
    merchandiseTotal: string;
    shippingTotal: string;
    unitsSold: number;
  }>;
}
```

ارسم خطاً لـ `revenueTotal` وأعمدة لـ `ordersCount`.

---

## 4) التوزيعات

### `GET …/by-status`

```ts
Array<{ status: StoreOrderStatus; ordersCount: number; revenueTotal: string }>
```

لا يستبعد الملغى تلقائياً هنا — يعكس كل الحالات ضمن الفلاتر (مفيد لقمع التحويل).

### `GET …/by-payment`

```ts
Array<{
  paymentMethod: 'cash_on_delivery' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  ordersCount: number;
  revenueTotal: string;
}>
```

### `GET …/by-city` · `by-product` · `by-partner`

Query إضافي: `limit` (افتراضي 50، أقصى 200).

**مدينة:**

```ts
{
  cityId: string | null;
  cityName: string;
  countryId: string | null;
  ordersCount: number;
  revenueTotal: string;
  unitsSold: number;
}
```

**منتج:**

```ts
{
  productId: string;
  variantId: string | null;
  productName: string;
  productSlug: string;
  ordersCount: number;
  unitsSold: number;
  lineRevenueTotal: string;  // مجموع lineTotalAmount
}
```

**شريك:**

```ts
{
  partnerId: string | null;  // null = ضيوف مجمّعين
  label: string;
  ordersCount: number;
  revenueTotal: string;
  unitsSold: number;
}
```

---

## 5) التقرير المفصل — `GET …/lines`

صفحي: `page`, `limit` + نفس الفلاتر.

كل صف = **بند منتج داخل طلب**:

```ts
{
  orderId: string;
  orderNumber: string;
  orderCreatedAt: string;
  status: StoreOrderStatus;
  paymentStatus: StorePaymentStatus;
  paymentMethod: StorePaymentMethod;
  source: 'storefront' | 'seed';
  partnerId: string | null;
  customerNameAr: string;
  shipCity: string;
  shipCityId: string | null;
  lineId: string;
  productId: string;
  variantId: string | null;
  productName: string;
  quantity: number;
  unitPriceAmount: string;
  lineTotalAmount: string;
  currencyCode: string;
}
```

مناسب لجدول قابل للفرز محلياً أو تصدير CSV من الفرونت.

---

## 6) Checklist شاشات

**واجهة الفرونت:** `/reports/sales` — قائمة المتجر → **المبيعات** → **تقارير المبيعات**

### داشبورد مبيعات

- [x] فلاتر: من/إلى، مدينة، طريقة دفع، حالة دفع، مصدر، مسجّل/ضيف، بحث
- [x] 4–6 بطاقات من `summary`
- [x] Chart من `timeseries?granularity=day|week|month`
- [x] جداول مصغّرة: `by-product` + `by-city` + `by-partner` + توزيع حالات

### تقرير تشغيلي

- [x] `by-status` لمعرفة اختناقات التأكيد/الشحن
- [x] `by-payment` لمتابعة COD غير المحصّل (`paymentStatus=pending`)

### تقرير تفصيلي

- [x] جدول `lines` مع تصدير CSV
- [x] النقر على `orderNumber` → `/orders?order=:id`

---

## 7) أخطاء شائعة

| الحالة | النتيجة |
|--------|---------|
| بدون `companyId` | `400` |
| `from` بعد `to` | `400` |
| بدون صلاحية `sta.reports.read` | `403` |
| قوائم فارغة | لا طلبات في الفترة / أو كلّها ملغاة مع استبعاد الإيراد |

---

## 8) أمثلة curl

```bash
# ملخص أغسطس
curl -s "$HOST/store-admin/reports/sales/summary?companyId=$CID&from=2026-08-01&to=2026-08-31" \
  -H "Authorization: Bearer $TOKEN"

# يوم بيوم
curl -s "$HOST/store-admin/reports/sales/timeseries?companyId=$CID&from=2026-08-01&to=2026-08-31&granularity=day" \
  -H "Authorization: Bearer $TOKEN"

# أفضل 20 منتج
curl -s "$HOST/store-admin/reports/sales/by-product?companyId=$CID&from=2026-08-01&to=2026-08-31&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# بنود مفصّلة لمدينة geo
curl -s "$HOST/store-admin/reports/sales/lines?companyId=$CID&cityId=$CITY_ID&page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```
