# إشعارات المتجر — دليل الفرونت

دليل تكامل واجهة **المتجر (Store Admin)** مع نظام الإشعارات. المتجر **مستقل عن HR والمخازن** — يستخدم Core فقط.

---

## 1) ملخص سريع

| السؤال | الجواب |
|---|---|
| إعدادات الإشعارات | `GET/PATCH /store/settings/company/:companyId` |
| Inbox | `GET /notifications/inbox/user/:userId?category=store` |
| المستلمون | مستخدمون (`user_id`) — `sta.notifications.read` على مستوى الشركة |
| جداول storefront | `store_company_settings` منفصلة — إعدادات الإشعارات في `store_settings` |

---

## 2) الصلاحيات

| الصلاحية | الاستخدام |
|---|---|
| `sta.settings.read` | قراءة إعدادات إشعارات المتجر |
| `sta.settings.update` | تعديل toggles |
| `sta.notifications.read` | inbox + unread count |
| `sta.notifications.update` | mark read |

---

## 3) API الإعدادات

**Swagger tag:** `Store - Notification Settings`

### GET `/store/settings/company/:companyId`

```json
{
  "notificationsEnabled": true,
  "notifyOrderPlaced": true,
  "notifyOrderConfirmed": true,
  "notifyOrderProcessing": false,
  "notifyOrderShipped": true,
  "notifyOrderDelivered": true,
  "notifyOrderCancelled": true,
  "notifyOrderRefunded": true,
  "notifyPaymentUpdated": true,
  "notifyContactMessageReceived": true
}
```

### PATCH — كل الحقول اختيارية

> **ملاحظة:** هذا API **منفصل** عن `/store-admin/companies/:companyId/settings` (هوية المتجر، SEO، …).

---

## 4) Inbox

```
GET /notifications/inbox/user/:userId?category=store&companyId=
GET /notifications/inbox/user/:userId/unread-count?companyId=
POST /notifications/inbox/user/:userId/recipients/:recipientId/read
POST /notifications/inbox/user/:userId/mark-all-read?companyId=
```

**Permission inbox:** `sta.notifications.read|update` (أو أي صلاحية inbox أخرى — `PermissionMatch.Any`).

---

## 5) الأحداث (`sourceKind`)

| sourceKind | الحدث | severity | toggle | افتراضي |
|---|---|---|---|---|
| `store_order_placed` | طلب جديد | info | `notifyOrderPlaced` | on |
| `store_order_confirmed` | تأكيد | info | `notifyOrderConfirmed` | on |
| `store_order_processing` | معالجة | info | `notifyOrderProcessing` | **off** |
| `store_order_shipped` | شحن | info | `notifyOrderShipped` | on |
| `store_order_delivered` | تسليم | success | `notifyOrderDelivered` | on |
| `store_order_cancelled` | إلغاء | warning | `notifyOrderCancelled` | on |
| `store_order_refunded` | استرداد | warning | `notifyOrderRefunded` | on |
| `store_payment_updated` | تحديث دفع | info/error | `notifyPaymentUpdated` | on |
| `store_contact_message_received` | رسالة تواصل | info | `notifyContactMessageReceived` | on |

**category:** `store`

---

## 6) الجمهور (Audience) — من يستلم فعلياً؟

> **تحديث:** لم يعد الإرسال broadcast لكل `user_companies`. الجمهور = من يملك `sta.notifications.read` فعلياً على **مستوى الشركة كاملة**.

### القاعدة

| # | الشرط | المعنى للفرونت |
|---|---|---|
| **1** | صلاحية `sta.notifications.read` | من لا يملكها **لا يستلم** إشعاراً (ولا يرى inbox أصلاً) |

**لا يوجد شرط (ب) نطاق فرع** — `store_orders` لا يحمل `branch_id`؛ كل أحداث المتجر company-wide مُفلترة بالصلاحية فقط.

**مصادر منح الصلاحية (أيّها يكفي):**

- دور **store-admin** نشط يتضمن `sta.notifications.read`
- `company_superuser` للشركة **+** تطبيق store-admin **مفعّل** في `company_applications`
- overlay `ALLOW` company-wide في `user_permissions`

**DENY overlay** company-wide على الصلاحية يمنع الاستلام حتى مع دور أو superuser.

> **`is_all_branches` غير ذي صلة** لإشعارات المتجر — لا بُعد فرع في قرار الجمهور.

### `audienceKind=company`

يعني **نطاق الشركة كاملة، مُفلترة بالصلاحية** — **وليس** broadcast حرفي لكل عضو `user_companies`.

### المنفّذ (من نفّذ العملية)

- **يستلم الإشعار أيضاً** إن كان مؤهلاً — **لا** يُستبعد.
- `triggeredByUserId` في سجل الإشعار = للعرض/التدقيق فقط (مثل «نفّذها: أحمد») — يُمرَّر عند تغيير حالة الطلب أو الدفع من لوحة الإدارة؛ طلب guest من storefront قد يكون بدون actor.

### أخطاء شائعة (ليست bugs)

| الملاحظة | التفسير |
|---|---|
| «المستخدم في الشركة ولم يستلم» | قد لا يملك `sta.notifications.read` أو store-admin غير مفعّل للشركة |
| «المنفّذ لم يُستبعد» | **مقصود** — يبقى في المستلمين |
| «صفر مستلمين + warn في اللوج» | العملية التجارية **تكمل**؛ لا يوجد أحد مؤهل |

**Rollout (backend):** `STORE_AUDIENCE_MODE=legacy|shadow|v2` — افتراضي `v2`.

---

## 7) Deep links

| sourceTable | التوجيه |
|---|---|
| `store_orders` | `/store-admin/orders/:sourceId` |
| `store_contact_messages` | صندوق رسائل التواصل في إدارة المحتوى |

---

## 8) UI مقترح

1. **إعدادات إشعارات** — tab أو section تحت إعدادات المتجر (ليس storefront settings)
2. **Bell** — فلتر `category=store`
3. **مجموعات toggles:** طلبات | دفع | رسائل تواصل

---

## 9) Checklist

- [ ] `GET/PATCH /store/settings/company/:companyId`
- [ ] Inbox بـ `userId` + `category=store`
- [ ] Badge من `byCategory.store`
- [ ] Deep link للطلبات

---

*آخر تحديث: أغسطس 2026*
