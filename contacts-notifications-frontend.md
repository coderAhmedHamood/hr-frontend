# إشعارات جهات الاتصال — دليل الفرونت

دليل تكامل واجهة **جهات الاتصال (Contacts / CRM)** مع نظام الإشعارات. **مستقل عن HR والمتجر والمخازن**.

---

## 1) ملخص سريع

| السؤال | الجواب |
|---|---|
| إعدادات الإشعارات | `GET/PATCH /contacts/settings/company/:companyId` |
| Inbox | `GET /notifications/inbox/user/:userId?category=contacts` |
| المستلمون | مستخدمون نشطون في الشركة (أو فرع عند وجود `branchId`) |
| category | `contacts` |

---

## 2) الصلاحيات

| الصلاحية | الاستخدام |
|---|---|
| `cnt.settings.read` | قراءة إعدادات الإشعارات |
| `cnt.settings.update` | تعديل toggles |
| `cnt.notifications.read` | inbox |
| `cnt.notifications.update` | mark read |

---

## 3) API الإعدادات

**Swagger tag:** `Contacts - Notification Settings`

### GET `/contacts/settings/company/:companyId`

```json
{
  "notificationsEnabled": true,
  "notifyPartnerCreated": true,
  "notifyPartnerRegistered": true,
  "notifyPartnerStatusChanged": true,
  "notifyPartnerActivityCreated": false,
  "notifyPartnerNoteCreated": false
}
```

---

## 4) Inbox

```
GET /notifications/inbox/user/:userId?category=contacts&companyId=
GET /notifications/inbox/user/:userId/unread-count?companyId=
POST /notifications/inbox/user/:userId/recipients/:recipientId/read
POST /notifications/inbox/user/:userId/mark-all-read?companyId=
```

---

## 5) الأحداث (`sourceKind`)

| sourceKind | الحدث | toggle | افتراضي |
|---|---|---|---|
| `contacts_partner_created` | إنشاء جهة اتصال | `notifyPartnerCreated` | on |
| `contacts_partner_registered` | تسجيل بوابة عميل | `notifyPartnerRegistered` | on |
| `contacts_partner_status_changed` | تغيير الحالة | `notifyPartnerStatusChanged` | on |
| `contacts_partner_activity_created` | نشاط CRM | `notifyPartnerActivityCreated` | **off** |
| `contacts_partner_note_created` | ملاحظة | `notifyPartnerNoteCreated` | **off** |

---

## 6) الجمهور (Audience)

- جهة اتصال **بفرع** → `audienceKind=branch` — مستخدمو الفرع
- بدون فرع → `audienceKind=company` — كل مستخدمي الشركة النشطين

---

## 7) Deep links

| sourceTable | التوجيه |
|---|---|
| `partners` | `/contacts/partners/:sourceId` |
| `partner_activities` | نشاط CRM على بطاقة الشريك |
| `partner_notes` | ملاحظات الشريك |

---

## 8) Checklist

- [ ] إعدادات → `/contacts/settings/company/:companyId`
- [ ] Inbox → `category=contacts`
- [ ] Bell tab منفصل في ERP shell

---

*آخر تحديث: أغسطس 2026*
