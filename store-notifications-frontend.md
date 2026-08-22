# إشعارات المتجر — دليل الفرونت

دليل تكامل واجهة **المتجر (Store Admin)** مع نظام الإشعارات. المتجر **مستقل عن HR والمخازن** — يستخدم Core فقط.

---

## 1) ملخص سريع

| السؤال | الجواب |
|---|---|
| إعدادات الإشعارات | `GET/PATCH /store/settings/company/:companyId` |
| Inbox | `GET /notifications/inbox/user/:userId?category=store` |
| المستلمون | مستخدمون (`user_id`) — مثل المخازن |
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

## 6) Deep links

| sourceTable | التوجيه |
|---|---|
| `store_orders` | `/store-admin/orders/:sourceId` |
| `store_contact_messages` | صندوق رسائل التواصل في إدارة المحتوى |

---

## 7) UI مقترح

1. **إعدادات إشعارات** — tab أو section تحت إعدادات المتجر (ليس storefront settings)
2. **Bell** — فلتر `category=store`
3. **مجموعات toggles:** طلبات | دفع | رسائل تواصل

---

## 8) Checklist

- [ ] `GET/PATCH /store/settings/company/:companyId`
- [ ] Inbox بـ `userId` + `category=store`
- [ ] Badge من `byCategory.store`
- [ ] Deep link للطلبات

---

*آخر تحديث: أغسطس 2026*
