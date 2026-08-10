# موافقة الإدارة على جهاز جديد (تطبيق / موقع)

عند تفعيل إعدادات HR يُطلب موافقة الإدارة قبل إرسال إيميل تفعيل الجهاز — **لكل قناة بشكل مستقل**.

**Migrations:**  
`1783373644660-mobile-serial-admin-approval.ts`  
`1783373644661-device-auth-channels.ts`  

بعد السحب: `npm run db:migrate`

---

## إعدادات HR

`PATCH /hr/settings/company/:companyId`

```json
{
  "requireAdminApprovalForNewMobileDevice": true,
  "enforceWebDeviceSerial": true,
  "requireAdminApprovalForNewWebDevice": true
}
```

| الحقل | القناة | المعنى |
|--------|--------|--------|
| `requireAdminApprovalForNewMobileDevice` | `app` / `mobile` | `true` = موافقة إدارة ثم إيميل · `false` = إيميل مباشرة |
| `enforceWebDeviceSerial` | `web` | `true` = يلزم `mobileSerialNumber` على دخول الويب · `false` = ويب بدون فحص جهاز |
| `requireAdminApprovalForNewWebDevice` | `web` | يعمل فقط إذا `enforceWebDeviceSerial=true` · موافقة إدارة ثم إيميل أو إيميل مباشرة |

الافتراضي للكل: `false`.  
أول ربط سيريال لكل قناة **لا** يمر بالموافقة.

سيريال التطبيق (`users.mobile_serial_number`) منفصل عن سيريال الويب (`users.web_device_serial`).

---

## أمثلة دخول

### تطبيق (دائماً يلزم السيريال)

```json
{
  "email": "…",
  "password": "…",
  "loginChannel": "app",
  "mobileSerialNumber": "DEVICE-APP-1"
}
```

### موقع — فقط إذا `enforceWebDeviceSerial=true`

```json
{
  "email": "…",
  "password": "…",
  "loginChannel": "web",
  "mobileSerialNumber": "BROWSER-FINGERPRINT-1"
}
```

### جهاز جديد + موافقة إدارة مفعّلة لتلك القناة → `403`

```json
{
  "code": "MOBILE_SERIAL_ADMIN_APPROVAL_REQUIRED",
  "approvalRequestId": "…",
  "loginChannel": "app",
  "mobileSerialChangeEmailSent": false
}
```

`loginChannel` في الخطأ يكون `app` أو `web`.  
بدون موافقة إدارة: الكود `MOBILE_SERIAL_VERIFICATION_REQUIRED` (إيميل مباشرة).

---

## إدارة الطلبات — JWT

**Base:** `/system/mobile-serial-approvals`  
صلاحيات: قائمة `system.users.read` · موافقة/رفض `system.users.update`

| Method | Path |
|--------|------|
| `GET /?companyId=&status=pending&loginChannel=app` | قائمة (فلتر `loginChannel=app\|web`) |
| `POST /:id/approve` | موافقة → إيميل التفعيل |
| `POST /:id/reject` | رفض |

كل عنصر يتضمن: `loginChannel`, `userFullNameAr`, `userFullNameEn`, `userEmail`, `userPhone`, …

بعد الموافقة يكمل المستخدم التفعيل عبر OTP / الرابط كما السابق. 
