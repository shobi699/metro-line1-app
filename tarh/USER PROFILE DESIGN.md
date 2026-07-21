# 👤 طرح جامع پروفایل کاربری حرفه‌ای (User Profile Platform)

**نسخه:** 1.0 — سند طراحی و سناریو
**پروژه:** metro-line1-app — سامانه سیر و حرکت خط ۱ مترو تهران
**هدف:** ارتقای صفحه پروفایل فعلی به یک **پروفایل جامع پرسنل عملیاتی**: شناسنامه شغلی و صلاحیت‌ها، مدارک با انقضا و یادآوری، خودخدمتی (Self-Service) با گردش تایید تغییرات، امنیت حساب و دستگاه‌ها، و پنل مدیریتی که ساختار پروفایل را **بدون کدنویسی** شکل می‌دهد.

---

## ۱) زیرساخت موجود که طرح روی آن سوار می‌شود

- مدل `User` (کد ملی یکتا، نقش، وضعیت، `customFields Json`) و ماژول `custom-fields` (`CustomFieldDef` با entityType/نوع/اجباری/گزینه‌ها) — **هسته پروفایل داینامیک از قبل هست**.
- ماژول `directory` با ایمپورت/اکسپورت اکسل خط‌به‌خط.
- پنل‌های ادمین موجود: `documents-queue` (صف بررسی مدارک)، `operator-licenses` (گواهینامه راهبری)، `biometrics`.
- سایر داده‌های پروفایل‌ساز که هم‌اکنون تولید می‌شوند: عملکرد/KPI، آموزش و آزمون، حضور، شیفت، گیمیفیکیشن — پروفایل، **ویترین یکپارچه** این‌ها می‌شود.
- الگوهای اثبات‌شده: گردش تایید (`swap`)، رسید immutable، `AuditLog`، Notification Gateway (اسناد قبلی) برای یادآوری انقضا.

---

## ۲) معماری اطلاعاتی پروفایل — تب‌های کاربر

```
پروفایل من
├── 🪪 مشخصات          فردی (نام، تماس، اضطراری) + سازمانی (کد پرسنلی، واحد، سمت) + فیلدهای سفارشی
├── 🎖️ صلاحیت‌ها        گواهینامه راهبری، مجوزها، دوره‌های گذرانده — با وضعیت اعتبار و انقضا
├── 📎 مدارک            کارت ملی، مدرک تحصیلی، گواهی سلامت... — آپلود، وضعیت بررسی، انقضا
├── 📊 کارنامه کاری      خلاصه شیفت ماه، حضور، امتیاز عملکرد، رتبه — فقط‌خواندنی از ماژول‌ها
├── 🔐 امنیت و دستگاه‌ها  تغییر رمز، دستگاه‌های فعال (خروج از راه دور)، تاریخچه ورود
└── ⚙️ ترجیحات           تم، زبان اعداد، لایه‌های تقویم، کانال‌های اعلان (در چارچوب سازمان)
```

نمای عمومی (آنچه همکاران در دفتر تلفن می‌بینند) از نمای شخصی جداست و فیلد‌به‌فیلد توسط ادمین سطح‌بندی می‌شود: عمومی / هم‌گروه / مدیر / محرمانه.

---

## ۳) مدل داده (Prisma — افزایشی و سازگار)

```prisma
model ProfileSection {                       // ساختار پروفایل، داده‌محور
  id        String  @id @default(cuid())
  key       String  @unique                  // "personal" | "org" | "emergency" | سفارشی
  title     String
  icon      String?
  sortOrder Int     @default(0)
  visibility Json                            // per نقش: چه کسی ببیند/ویرایش کند
  isActive  Boolean @default(true)
}
// CustomFieldDef موجود گسترش می‌یابد: sectionKey, visibilityLevel(public|team|manager|private),
// editableBy(self|admin), requiresApproval(bool), showInDirectory(bool)

model ProfileChangeRequest {                 // خودخدمتی با گردش تایید
  id          String   @id @default(cuid())
  userId      String
  changes     Json                           // {field:{before,after}}
  status      String   @default("pending")   // pending | approved | rejected
  note        String?
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime @default(now())

  @@index([status])
  @@index([userId])
}

model UserDocument {                         // مدارک با چرخه بررسی و انقضا
  id          String   @id @default(cuid())
  userId      String
  typeKey     String                         // ارجاع به DocumentType
  fileUrl     String
  status      String   @default("pending")   // pending | approved | rejected | expired
  issuedAt    DateTime?
  expiresAt   DateTime?
  reviewNote  String?
  reviewedBy  String?
  createdAt   DateTime @default(now())

  @@index([userId, typeKey])
  @@index([expiresAt])
}

model DocumentType {                          // انواع مدرک — تعریف ادمین
  id            String  @id @default(cuid())
  key           String  @unique               // "national_card" | "health_cert" | ...
  title         String
  requiredFor   Json?                         // نقش‌هایی که این مدرک برایشان الزامی است
  hasExpiry     Boolean @default(false)
  remindDays    Json?                         // [60,30,7] روز مانده به انقضا → یادآوری
  needsReview   Boolean @default(true)
  isActive      Boolean @default(true)
}

model Credential {                            // صلاحیت‌ها و گواهینامه‌ها
  id         String   @id @default(cuid())
  userId     String
  typeKey    String                           // "operator_license_A" | دوره‌ها...
  number     String?
  issuedAt   DateTime?
  expiresAt  DateTime?
  status     String   @default("valid")       // valid | expiring | expired | suspended
  meta       Json?

  @@index([userId])
  @@index([expiresAt])
}

model UserSession {                           // دستگاه‌ها و نشست‌ها
  id         String   @id @default(cuid())
  userId     String
  device     String?
  platform   String?
  ip         String?
  lastActive DateTime @default(now())
  revokedAt  DateTime?

  @@index([userId, revokedAt])
}
```

---

## ۴) قابلیت‌های کلیدی

### ۴.۱ خودخدمتی با گردش تایید (Self-Service)
کاربر فیلدهای مجاز (تلفن، آدرس، تماس اضطراری...) را خودش ویرایش می‌کند. فیلدهایی که ادمین «نیازمند تایید» علامت زده ← `ProfileChangeRequest` ← کارتابل منابع انسانی ← تایید/رد با یادداشت ← اعمال + لاگ before/after. فیلدهای هویتی (کد ملی، نام رسمی) فقط توسط ادمین.

### ۴.۲ مدارک و صلاحیت‌ها با چرخه عمر
آپلود مدرک از موبایل (دوربین) ← صف بررسی (`documents-queue` موجود، ارتقایافته) ← تایید/رد با دلیل. **موتور انقضا:** جاب روزانه، مدارک/گواهینامه‌های نزدیک انقضا را برمی‌دارد ← یادآوری پلکانی (۶۰/۳۰/۷ روز) از Notification Gateway به خود فرد + گزارش تجمیعی به مسئول ← منقضی‌شده = نشان قرمز در پروفایل و **پرچم صلاحیت** (اتصال آینده: هشدار در لوحه اگر راهبرِ بدون گواهی معتبر اعزام شود).

### ۴.۳ کارنامه کاری یکپارچه (Read-only Aggregation)
یک صفحه، خلاصه‌ی زنده از ماژول‌های موجود: شیفت‌های ماه (از تقویم)، درصد حضور (attendance)، امتیاز و رتبه (performance/gamification)، دوره‌های گذرانده (learning)، تعویض‌های اخیر (swap). هر کارت ← لینک به ماژول اصلی. برای مدیر: همین نما per پرسنل با مقایسه با میانگین واحد.

### ۴.۴ امنیت حساب
نمایش دستگاه‌های فعال با «خروج از این دستگاه»، تاریخچه ورودها (زمان/IP/دستگاه)، تغییر رمز با سیاست قابل تنظیم، و (فاز بعد، هم‌راستا با tosee.md) ورود دومرحله‌ای پیامکی داخلی.

### ۴.۵ پروفایل عمومی و QR کارت پرسنلی
نمای عمومی در دفتر تلفن فقط فیلدهای `showInDirectory`. هر پرسنل یک **QR کارت** دارد (مشابه الگوی QR قطار): اسکن ← پروفایل عمومی + دکمه تماس/چت — برای شناسایی سریع در محیط عملیاتی، با سطح دسترسی.

---

## ۵) سناریوها

### سناریو ۱ — تغییر شماره تلفن با تایید
احمدی در موبایل شماره جدید می‌زند ← چون «نیازمند تایید» است، درخواست به کارتابل HR می‌رود ← تایید ← شماره در دفتر تلفن و Gateway پیامک به‌روز می‌شود ← لاگ before/after ثبت است.

### سناریو ۲ — انقضای گواهینامه راهبری
گواهینامه رضایی ۶۰ روز دیگر منقضی می‌شود ← پوش یادآوری + کارت زرد در پروفایل ← ۳۰ روز: پیامک + گزارش به مسئول آموزش ← تمدید و آپلود مدرک جدید ← بررسی و تایید ← وضعیت سبز. اگر منقضی شود: پرچم قرمز صلاحیت و اطلاع خودکار به سرشیفت.

### سناریو ۳ — ادمین ساختار پروفایل را تغییر می‌دهد
سازمان می‌خواهد «گروه خونی» و «شماره بیمه» اضافه شود ← ادمین در پنل: دو فیلد جدید در بخش «فردی»، یکی با سطح «محرمانه» (فقط HR) و یکی «هم‌گروه» ← فرم پروفایل همه کاربران در همان لحظه به‌روز است — بدون کد.

### سناریو ۴ — گم شدن گوشی
کاربر از وب وارد می‌شود ← امنیت ← دستگاه «Samsung A54» را «خروج» می‌زند ← نشست باطل، توکن‌های پوش آن دستگاه هم غیرفعال (اتصال به NotificationDevice).

### سناریو ۵ — استخدام جدید (Onboarding)
کارمند جدید تایید می‌شود ← چک‌لیست تکمیل پروفایل: فیلدهای الزامی + مدارک الزامی نقشش (از DocumentType.requiredFor) ← نوار پیشرفت «پروفایل شما ۶۰٪ کامل است» ← تا تکمیل مدارک الزامی، نشان «در انتظار تکمیل» برای HR گزارش می‌شود.

---

## ۶) پنل مدیریت حرفه‌ای و قابل شخصی‌سازی (Admin Console)

```
پنل مدیریت پروفایل
├── 📊 داشبورد            کامل‌بودن پروفایل‌ها per واحد، مدارک در صف، انقضاهای نزدیک
├── 🧩 ساختار پروفایل      بخش‌ها (Drag & Drop) + فیلدساز: نوع، اجباری، سطح نمایش
│                          (عمومی/هم‌گروه/مدیر/محرمانه)، قابل‌ویرایش توسط (خود/ادمین)،
│                          نیازمند تایید؟ نمایش در دفتر تلفن؟ — با پیش‌نمایش زنده فرم
├── 📎 انواع مدارک          تعریف مدرک: الزامی برای کدام نقش‌ها، انقضا دارد؟ پله‌های یادآوری، نیازمند بررسی؟
├── 🎖️ انواع صلاحیت         گواهینامه‌ها و دوره‌ها + قواعد پرچم صلاحیت
├── ✅ کارتابل تاییدها       تغییرات پروفایل + صف بررسی مدارک (ادغام documents-queue)
├── ⏰ قواعد انقضا           پله‌های یادآوری پیش‌فرض، گیرندگان گزارش تجمیعی، اتصال به Gateway
├── 👁️ سطوح دید دفتر تلفن   ماتریس فیلد × نقش بیننده
├── 🔐 سیاست امنیت          قواعد رمز، مدت نشست، حداکثر دستگاه فعال
├── 📥 ایمپورت/اکسپورت      اکسل پرسنل (موجود) + اکسل مدارک/صلاحیت‌ها با پیش‌نمایش ۴مرحله‌ای
└── 🗂️ لاگ حسابرسی          هر تغییر ساختار و داده با before/after
```

**Permissionها:** `profile:edit-own`، `profile:view-team`، `profile:review-changes`، `documents:review`، `profile-admin:manage`.

---

## ۷) API (App Router)

```
── کاربر
GET   /api/profile/me                         ← پروفایل کامل + ساختار فرم (سکشن‌ها/فیلدها)
PATCH /api/profile/me                         ← ویرایش مستقیم فیلدهای آزاد
POST  /api/profile/change-requests            ← فیلدهای نیازمند تایید
GET   /api/profile/me/summary                 ← کارنامه کاری تجمیعی
GET/POST/DELETE /api/profile/documents        ← مدارک من
GET   /api/profile/credentials                ← صلاحیت‌های من
GET   /api/profile/sessions  |  POST /api/profile/sessions/[id]/revoke
GET   /api/profile/qr        |  GET /api/p/[qrToken]      ← کارت QR و نمای عمومی

── ادمین
GET/POST/PATCH /api/admin/profile/sections | /fields       ← ساختارساز
GET/POST/PATCH /api/admin/profile/document-types | /credential-types
GET   /api/admin/profile/change-requests?status=pending
POST  /api/admin/profile/change-requests/[id]/approve|reject
GET/POST /api/admin/profile/documents-queue
GET/PATCH /api/admin/profile/config                         ← انقضا، امنیت، دید
POST  /api/admin/profile/import  |  GET /api/admin/profile/export
```

---

## ۸) فازبندی اجرا

| فاز | محدوده | خروجی |
| :--- | :--- | :--- |
| **فاز ۱ (پروفایل داینامیک)** | ProfileSection + گسترش CustomFieldDef، صفحه پروفایل تب‌دار وب/موبایل، سطوح دید، ساختارساز پنل | پروفایل شکل‌پذیر بدون کد |
| **فاز ۲ (خودخدمتی و مدارک)** | ChangeRequest + کارتابل، UserDocument/DocumentType + صف بررسی ارتقایافته، آپلود موبایل، نوار تکمیل + Onboarding | چرخه داده پرسنلی کامل |
| **فاز ۳ (صلاحیت و انقضا)** | Credential، موتور انقضا + یادآوری پلکانی از Gateway، پرچم صلاحیت، اکسل مدارک/صلاحیت | Compliance صلاحیت‌ها |
| **فاز ۴ (امنیت و ویترین)** | UserSession + خروج از راه دور + تاریخچه ورود، کارنامه تجمیعی، QR کارت پرسنلی، داشبورد HR | پروفایل کامل حرفه‌ای |

---

## ۹) ملاحظات فنی

- داده فیلدهای سفارشی در `User.customFields` (Json) می‌ماند — بدون migration per فیلد؛ ایندکس‌گذاری فیلدهای پرجستجو با ستون‌های generated در صورت نیاز.
- سطوح دید در **سرور** اعمال می‌شود (فیلتر فیلد قبل از پاسخ)، نه صرفاً UI.
- فایل مدارک: ذخیره‌سازی داخلی با URL امضاشده کوتاه‌عمر؛ حذف = soft-delete با نگهداری قانونی قابل تنظیم.
- کارنامه تجمیعی از سرویس‌های ماژول‌های موجود می‌خواند (نه کپی داده) — Single Source of Truth.
- تست: قواعد دید/ویرایش فیلد، گردش تایید، موتور انقضا با Vitest.
