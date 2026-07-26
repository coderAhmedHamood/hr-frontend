# اقتراح Backend: واجهات Bulk / Composite للمخزون والكتالوج

**من:** فريق الـ Frontend  
**إلى:** فريق الـ Backend  
**التاريخ:** 2026-07-27  
**السياق:** الربط الحالي على REST الذرّي في `inventory-api.md` يعمل وظيفيًا، لكنه مكلف جدًا عند إنشاء/تحديث منتج بخصائص ومتغيرات.

---

## 1. المشكلة

عند **إضافة أو حفظ منتج واحد** من لوحة الإدارة، الواجهة مضطرة لاستدعاء عشرات الطلبات المتسلسلة لأن كل مورد فرعي له endpoint منفصل:

| المورد | Endpoint الحالي |
|--------|------------------|
| رأس المنتج | `POST/PATCH /inventory/products` |
| الوسائط | `/inventory/product-media` |
| وحدات القياس | `/inventory/product-uom-lines` |
| أسطر الخصائص | `/inventory/product-attribute-lines` |
| قيم الخصائص | `/inventory/product-attribute-values` |
| المتغيرات | `/inventory/product-variants` |
| ربط المتغير ↔ القيمة | `/inventory/product-variant-attribute-values` |

### قياس فعلي من المتصفح

عند حفظ منتج واحد لوحظ حوالي **~89 طلب HTTP** (قراءة + كتابة + إعادة تحميل بعد الحفظ) عبر Network tab.

أسباب التضخم:

1. **Create ذرّي:** كل قيمة لون/مقاس = `POST` منفصل، وكل متغير = `POST` + عدة `POST` للروابط.
2. **Read قبل الكتابة:** لمزامنة الحالة نجلب الموجود ثم نقارن (N قراءات).
3. **Re-fetch بعد كل سطر قيمة:** أثناء المزامنة قد يُعاد `GET product-attribute-values?productId=…` لكل سطر خاصية.
4. **Hydrate بعد الحفظ:** لإرجاع المنتج كاملًا نعيد جلب media + attributes + values + variants + links.

النتيجة: بطء ملحوظ، ضغط على السيرفر، صعوبة التعامل مع الأخطاء الجزئية (نصف المنتج محفوظ ونصف فاشل).

> ملاحظة: نفس النمط يتكرر في **خصائص الكتالوج** (`catalog-attributes` + `catalog-attribute-values`) وفي **عمليات المستودع** (operation + lines).

---

## 2. الهدف

تقليل عدد الطلبات من **عشرات** إلى **1–3** لكل عملية حفظ/قراءة منتج، مع:

- معاملة ذرّية (transaction) على مستوى المنتج الكامل عند الإمكان
- إرجاع المنتج **مكتمل التحميل** (nested) في الاستجابة
- الإبقاء على الـ endpoints الذرّية للتعديلات الصغيرة إن لزم

---

## 3. المقترح الأساسي — Products

### 3.1 قراءة منتج كامل

```http
GET /inventory/products/:id?include=media,uomLines,attributes,variants
```

أو مسار مخصص أوضح:

```http
GET /inventory/products/:id/full
```

**Response (مقترح):**

```json
{
  "id": "…",
  "companyId": "…",
  "sku": "BURGER-001",
  "nameAr": "…",
  "priceAmount": "25",
  "priceCurrency": "SAR",
  "media": [ { "id": "…", "url": "…", "alt": "", "type": "image", "position": 0, "isPrimary": true } ],
  "uomLines": [ { "id": "…", "nameAr": "قطعة", "relativeQuantity": "1", "isReference": true, "packagingType": "unit", "sortOrder": 0 } ],
  "attributes": [
    {
      "id": "…",
      "catalogAttributeId": "…",
      "nameAr": "الوان مصابيح",
      "displayType": "color",
      "createVariant": "always",
      "sortOrder": 0,
      "values": [
        {
          "id": "…",
          "catalogAttributeValueId": "…",
          "nameAr": "اصفر",
          "colorHex": "#effd86",
          "sortOrder": 0
        }
      ]
    }
  ],
  "variants": [
    {
      "id": "…",
      "combinationKey": "…",
      "sku": "BURGER-001-اصفر",
      "nameAr": "… (اصفر)",
      "salePriceAmount": "25",
      "salePriceCurrency": "SAR",
      "costPriceAmount": "0",
      "costPriceCurrency": "SAR",
      "quantityCache": "0",
      "stockStatus": "out_of_stock",
      "isActive": true,
      "attributeValueIds": ["<product_attribute_value_id>", "…"]
    }
  ]
}
```

بديل للروابط بدل `attributeValueIds`:

```json
"attributeLinks": [
  {
    "productAttributeValueId": "…",
    "attributeNameAr": "الوان مصابيح",
    "valueNameAr": "اصفر",
    "colorHex": "#effd86"
  }
]
```

---

### 3.2 إنشاء منتج كامل دفعة واحدة (الأولوية القصوى)

```http
POST /inventory/products/full
```

أو توسيع `POST /inventory/products` بقبول حقول متداخلة اختيارية.

**Request body (مقترح):**

```json
{
  "companyId": "…",
  "sku": "BURGER-001",
  "nameAr": "منتج تجريبي",
  "nameEn": null,
  "slug": null,
  "categoryId": null,
  "brandId": null,
  "status": "draft",
  "stockStatus": "out_of_stock",
  "productType": "goods",
  "tracking": "none",
  "invoicePolicy": "ordered",
  "priceAmount": 25,
  "priceCurrency": "SAR",
  "costPriceAmount": 0,
  "costPriceCurrency": "SAR",
  "trackInventory": true,
  "lowStockThreshold": 5,
  "allowBackorder": false,
  "posAvailable": false,
  "saleOk": true,
  "purchaseOk": true,
  "tags": [],
  "seoMetaTitle": null,
  "seoMetaDescription": null,

  "media": [
    {
      "clientKey": "m1",
      "url": "https://…",
      "alt": "",
      "type": "image",
      "position": 0,
      "isPrimary": true
    }
  ],

  "uomLines": [
    {
      "clientKey": "u1",
      "nameAr": "قطعة",
      "relativeQuantity": 1,
      "isReference": true,
      "packagingType": "unit",
      "sortOrder": 0
    }
  ],

  "attributes": [
    {
      "clientKey": "a1",
      "catalogAttributeId": "<uuid أو null>",
      "nameAr": "الوان مصابيح",
      "displayType": "color",
      "createVariant": "always",
      "sortOrder": 0,
      "values": [
        {
          "clientKey": "v-yellow",
          "catalogAttributeValueId": "<uuid من الكتالوج إن وُجد>",
          "nameAr": "اصفر",
          "colorHex": "#effd86",
          "defaultExtraPrice": null,
          "sortOrder": 0
        }
      ]
    }
  ],

  "variants": [
    {
      "clientKey": "var1",
      "sku": "BURGER-001-اصفر",
      "nameAr": "منتج تجريبي (اصفر)",
      "combinationKey": "v-yellow",
      "salePriceAmount": 25,
      "salePriceCurrency": "SAR",
      "costPriceAmount": 0,
      "costPriceCurrency": "SAR",
      "stockStatus": "out_of_stock",
      "isActive": true,
      "attributeValueClientKeys": ["v-yellow"]
    }
  ]
}
```

**قواعد مهمة للـ Backend:**

1. تنفيذ كل شيء داخل **transaction** واحدة؛ أي فشل → rollback كامل.
2. إنشاء قيم الخصائص (`product_attribute_values`) **قبل** ربط المتغيرات.
3. قبول `clientKey` مؤقت من الواجهة؛ الرد يعيد خريطة `clientKey → id` الحقيقي.
4. `attributeValueClientKeys` / `combinationKey` يُحوَّلان إلى `product_attribute_value` ids الحقيقية داخليًا — **لا يُقبل إرسال `catalog-attribute-value` id كـ `productAttributeValueId`**.
5. الاستجابة = نفس شكل `GET …/full` + اختياريًا:

```json
{
  "idMap": {
    "m1": "uuid-media",
    "a1": "uuid-line",
    "v-yellow": "uuid-product-attribute-value",
    "var1": "uuid-variant"
  }
}
```

**Response:** `201` + المنتج الكامل (nested).

---

### 3.3 تحديث منتج كامل دفعة واحدة

```http
PUT /inventory/products/:id/full
```

أو `PATCH /inventory/products/:id/full`

**استراتيجية موصى بها (replace-nested):**

- رأس المنتج: patch عادي
- لكل مجموعة متداخلة (`media` | `uomLines` | `attributes` | `variants`):
  - العناصر ذات `id` موجود → تحديث
  - العناصر بـ `clientKey` فقط / بدون `id` → إنشاء
  - العناصر الموجودة في DB وغير المرسلة → أرشفة/حذف حسب سياسة الـ soft-delete الحالية
  - روابط المتغيرات تُعاد بناؤها من قائمة القيم المرسلة

بديل أخف: وضع عمليات صريحة:

```json
{
  "product": { "nameAr": "…" },
  "media": { "upsert": […], "removeIds": ["…"] },
  "attributes": { "upsert": […], "removeIds": ["…"] },
  "variants": { "upsert": […], "removeIds": ["…"] }
}
```

---

### 3.4 قائمة منتجات (اختياري)

للقائمة يكفي الرأس + صورة أساسية بدون شجرة كاملة:

```http
GET /inventory/products?include=primaryMedia
```

تجنّب N+1 لصور القائمة.

---

## 4. مقترحات مشابهة (نفس الألم)

### 4.1 Catalog Attributes

اليوم: `POST catalog-attributes` ثم N × `POST catalog-attribute-values`.

**مقترح:**

```http
POST /inventory/catalog-attributes/full
PATCH /inventory/catalog-attributes/:id/full
GET  /inventory/catalog-attributes/:id/full
```

Body يتضمن `values: [...]` دفعة واحدة.

### 4.2 Warehouse Operations

اليوم: إنشاء العملية ثم سطر بسطر لـ `warehouse-operation-lines`.

**مقترح:**

```http
POST /inventory/warehouse-operations/full
{
  "companyId": "…",
  "type": "receipt",
  "warehouseId": "…",
  "reference": "…",
  "lines": [
    { "productId": "…", "variantId": null, "quantity": 10, "sku": "…", "productName": "…" }
  ]
}
```

مع تنفيذ آثار المخزون/الـ ledger داخل نفس الـ transaction إن كان ذلك جزءًا من اعتماد العملية.

### 4.3 Bulk عام (إن فضّلتم نمطًا موحّدًا)

```http
POST /inventory/bulk
```

```json
{
  "operations": [
    { "method": "POST", "path": "/inventory/product-attribute-values", "body": { … } },
    { "method": "POST", "path": "/inventory/product-variants", "body": { … } }
  ]
}
```

مفيد، لكن **أقل أولوية** من `products/full` لأن الواجهة تحتاج منطق علاقات (قيمة → متغير) يُفضَّل أن يعيش في الـ Backend داخل endpoint دلالي واحد.

---

## 5. الأولويات المقترحة

| الأولوية | العنصر | الأثر المتوقع |
|---------|--------|----------------|
| P0 | `POST /inventory/products/full` | حفظ منتج جديد: من ~50–90 طلب → 1 |
| P0 | `GET /inventory/products/:id/full` | إلغاء 5–8 قراءات بعد الحفظ/الفتح |
| P1 | `PUT|PATCH /inventory/products/:id/full` | تعديل منتج بمتغيرات بدون شلال طلبات |
| P1 | `catalog-attributes/full` | نفس المشكلة عند إدارة الخصائص العامة |
| P2 | `warehouse-operations/full` | استلام/صرف متعدد الأسطر |
| P3 | Bulk عام / `include=` على القوائم | تحسينات إضافية |

---

## 6. ما سيفعله الـ Frontend بعد توفر الـ API

1. استبدال `syncNested` + `hydrateProduct` المتعدّد الاستدعاءات بطلب `full` واحد.
2. الإبقاء مؤقتًا على الـ endpoints الذرّية كـ fallback إن لم تُرسل الحقول المتداخلة.
3. إرسال `clientKey` و`catalogAttributeValueId` فقط؛ عدم إرسال معرفات كتالوج كـ `productAttributeValueId`.

---

## 7. معايير قبول (Acceptance)

- إنشاء منتج بـ 2 خاصية × 3 قيم × 6 متغيرات + صورة + UOM يتم بـ **≤ 2 طلبات** (create full + اختياري refresh إن لزم).
- فشل تحقق على متغير واحد يلغي العملية بالكامل (لا منتج يتيم بدون متغيرات متسقة).
- الاستجابة تعيد ids حقيقية لكل العناصر المتداخلة.
- التوثيق يُحدَّث في `inventory-api.md` بنفس أسلوب الأقسام الحالية.

---

## 8. ملخص للمناقشة

الـ REST الذرّي الحالي مناسب للتعديلات الصغيرة والتشخيص، لكنه غير مناسب لمسار «حفظ منتج من الفورم». نحتاج **واجهة مركّبة (composite)** للمنتج (والخصائص/العمليات لاحقًا) لتقليل التكلفة والأخطاء الجزئية.

إذا وافقتم على الشكل، نضبط عقد JSON النهائي معكم ثم نحوّل الـ Frontend عليه مباشرة.
