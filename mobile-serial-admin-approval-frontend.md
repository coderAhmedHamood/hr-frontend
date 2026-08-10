# موافقة الإدارة على جهاز جوال جديد

عند تفعيل إعداد HR يُطلب موافقة الإدارة قبل إرسال إيميل تفعيل الجهاز للمستخدم.

**Migration:** `1783373644660-mobile-serial-admin-approval.ts`  
بعد السحب: `npm run db:migrate`

---

## إعداد HR

`PATCH /hr/settings/company/:companyId`

```json
{ "requireAdminApprovalForNewMobileDevice": true }
```

| القيمة | السلوك |
|--------|--------|
| `false` (افتراضي) | كما السابق: جهاز جديد → إيميل OTP/رابط مباشرة للمستخدم |
| `true` | جهاز جديد (بعد ربط جهاز سابق) → طلب موافقة إدارة → بعد الموافقة يُرسل الإيميل |

أول ربط سيريال للحساب (`registered`) **لا** يمر عبر الموافقة.

---

## دخول التطبيق (جهاز جديد + الإعداد مفعّل)

`POST /auth/login` مع `loginChannel: app|mobile` + `mobileSerialNumber` مختلف:

**HTTP 403**

```json
{
  "code": "MOBILE_SERIAL_ADMIN_APPROVAL_REQUIRED",
  "message": "… بانتظار موافقة الإدارة …",
  "approvalRequestId": "…",
  "mobileSerialChangeEmailSent": false
}
```

عند الإعداد مغلقاً يبقى الكود القديم: `MOBILE_SERIAL_VERIFICATION_REQUIRED`.

---

## إدارة الطلبات — JWT

**Base:** `/system/mobile-serial-approvals`  
صلاحيات: قائمة `system.users.read` · موافقة/رفض `system.users.update`

| Method | Path |
|--------|------|
| `GET /?companyId=&status=pending` | قائمة (تتضمن `userFullNameAr` / `userFullNameEn` / `userEmail` / `userPhone`) |
| `POST /:id/approve` | موافقة → إرسال إيميل التفعيل |
| `POST /:id/reject` | رفض (بدون إيميل) |

بعد الموافقة يكمل المستخدم التفعيل عبر OTP أو الرابط كما السابق (`/auth/mobile-serial/confirm` أو verify).
