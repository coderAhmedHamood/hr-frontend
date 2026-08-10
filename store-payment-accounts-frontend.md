# حسابات الدفع (Payment Accounts) — دليل الفرونت

عقد التزام لحسابات الشركة المعروضة عند الشراء وربطها بالطلبات (تقارير / تتبع).

**Migration:** `1783373644659-company-payment-accounts.ts`  
**صلاحيات:** `sta.payment-accounts.create|update|delete` (لا يوجد `.read` — القائمة بـ JWT فقط)  
**بعد السحب:** `npm run db:migrate` ثم `npm run system:init`، ثم أعد تسجيل الدخول ليظهر الـ JWT المحدّث

---

## الفكرة

جدول عام لكل شركة: `company_payment_accounts`

| `type` | أمثلة استخدام |
|--------|----------------|
| `bank` | تحويل بنكي / IBAN |
| `network` | شبكة تحويل محلية |
| `wallet` | جوالي / كريمي / محفظة + رقم جوال + QR |
| `cash` | صندوق نقدي / نقطة استلام |
| `card` | بوابة بطاقة مرتبطة بحساب داخلي (اختياري) |
| `other` | أي طريقة أخرى |

حقول مرنة: `mobile` · `accountNumber` · `iban` · `qrImageUrl` · `logoUrl` · `meta` (jsonb لأي دولة).

الظهور في المتجر: غير مؤرشف + `isActive` + `showInStore`.

---

## طرق الدفع في الإعدادات (`checkoutPaymentMethods`)

القيم الموسّعة:

`cash_on_delivery` · `cash` · `bank` · `network` · `wallet` · `card` · `other`

فعّل في إعدادات المتجر الطرق التي تريدها في checkout، ثم أنشئ الحسابات المناسبة.

| عند الطلب | `paymentAccountId` |
|-----------|-------------------|
| `bank` / `network` / `wallet` | **مطلوب** — ويجب أن يطابق `type` الحساب |
| `cash_on_delivery` / `cash` / `card` / `other` | اختياري |

عند الربط يُحفظ `paymentAccountSnapshot` على الطلب (لقطة ثابتة للتقارير).

---

## إدارة (Store Admin) — JWT

**Base:** `/store-admin/companies/:companyId/payment-accounts`

| Method | Path | Permission |
|--------|------|------------|
| `POST /` | إنشاء | `create` |
| `GET /` | قائمة (`type`, `isActive`, `showInStore`, `search`, `archiveScope`) | `read` |
| `GET /:id` | تفاصيل | `read` |
| `PATCH /:id` | تعديل | `update` |
| `DELETE /:id` | أرشفة → `204` | `delete` |
| `POST /:id/restore` | استعادة | `update` |

### مثال — محفظة يمنية

```http
POST /store-admin/companies/{companyId}/payment-accounts
Authorization: Bearer …
Content-Type: application/json

{
  "type": "wallet",
  "code": "JAWALI-1",
  "nameAr": "محفظة جوالي",
  "nameEn": "Jawali wallet",
  "providerName": "Jawali",
  "accountHolderName": "شركة الورد",
  "mobile": "777123456",
  "currencyCode": "YER",
  "countryCode": "YE",
  "instructionsAr": "حوّل ثم أرفق إيصال التحويل",
  "qrImageUrl": "https://…/qr.png",
  "logoUrl": "https://…/jawali.png",
  "showInStore": true,
  "sortOrder": 10
}
```

### مثال — بنك

```json
{
  "type": "bank",
  "nameAr": "حساب البنك الأهلي",
  "providerName": "Alahli",
  "accountHolderName": "…",
  "iban": "SA…",
  "accountNumber": "…",
  "currencyCode": "SAR",
  "countryCode": "SA",
  "meta": { "swift": "NCBKSAJE" }
}
```

`internalNote` للإدارة فقط — لا يظهر في `/public/store/...`.

---

## المتجر العام (Public)

```http
GET /public/store/payment-accounts?companyId={uuid}
GET /public/store/payment-accounts?companyId={uuid}&type=wallet
```

استجابة مختصرة بدون `internalNote` / أرشفة.

---

## إنشاء الطلب

```http
POST /public/store/orders
```

```json
{
  "companyId": "…",
  "paymentMethod": "wallet",
  "paymentAccountId": "…",
  "paymentProofUrl": "https://…/receipt.jpg",
  "address": { "…" },
  "items": [ { "…" } ]
}
```

الاستجابة / تفاصيل الطلب تتضمن:

- `paymentAccountId`
- `paymentAccountSnapshot` `{ id, type, nameAr, providerName, mobile, … }`

قائمة الإدارة تدعم فلتر `paymentAccountId`.

---

## تدفق فرونت مقترح (Checkout)

1. اقرأ `checkoutPaymentMethods` من `GET /public/store/companies/:id/config`.
2. حمّل الحسابات: `GET /public/store/payment-accounts?companyId=`.
3. عند اختيار محفظة/بنك/شبكة: أرسل `paymentMethod` = نوع الحساب + `paymentAccountId`.
4. عند COD: `paymentMethod=cash_on_delivery` بدون حساب.
5. ارفع إيصال التحويل → `paymentProofUrl` و/أو `attachments`.
