# نقشه راه توسعه — Metro Line 1 App

---

## فاز ۱: بحرانی (امنیت + دیتابیس)

### ۱.۱ مهاجرت SQLite → PostgreSQL
- **فایل‌ها**: `prisma/schema.prisma`, `src/server/db.ts`, `.env`
- **تغییرات**:
  - تغییر `provider = "sqlite"` به `provider = "postgresql"` در schema.prisma
  - تغییر اتصال db.ts از PrismaLibSql به PrismaPg
  - به‌روزرسانی DATABASE_URL در .env
  - `npx prisma migrate dev --name init-pg`
  - اطمینان از عملکرد JSON fields در PostgreSQL

### ۱.۲ فعال‌سازی Auth Middleware
- **فایل**: `src/middleware.ts`
- **تغییرات**:
  - استخراج JWT از header Authorization
  - اعتبارسنجی توکن برای تمام مسیرهای `/api/*`
  - استثنا: `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/config`
  - رد درخواست‌های بدون توکن معتبر با 401

### ۱.۳ حفاظت مسیرهای بدون احراز هویت
- **فایل‌ها**: `src/app/api/config/route.ts`, `src/app/api/debug/route.ts`
- **تغییرات**:
  - config: محدود کردن اطلاعات حساس (فقط فیلدهای عمومی)
  - debug: حذف کامل یا محدودیت شدید به super_admin
  - بررسی تمام مسیرهای API برای اطمینان از وجود auth guard

### ۱.۴ فیکس تست‌های خراب
- **فایل‌ها**:
  - `src/server/modules/swap/service.test.ts` — اضافه کردن mock برای `prisma.setting`
  - `src/server/modules/chat/service.test.ts` — اضافه کردن mock برای `prisma.setting`
- **تغییرات**: تکمیل mocks برای تمام مدل‌های Prisma که service ها استفاده می‌کنن

---

## فاز ۲: حذف داده‌های Mock

### ۲.۱ داشبورد عملیاتی
- **فایل**: `src/app/(app)/dashboard/page.tsx`
- **تغییرات**:
  - جایگزینی `announcements` hardcoded با API واقعی
  - جایگزینی `stations` و `trains` با داده واقعی (یا API شبیه‌سازی)
  - اتصال `scadaSystems` به API تنظیمات
  - اتصال `operationLogs` به audit log واقعی

### ۲.۲ پنل OCC
- **فایل**: `src/app/(app)/occ/page.tsx`
- **تغییرات**:
  - جایگزینی FaultTicketCard های hardcoded با درخواست واقعی به `/api/tickets`

### ۲.۳ کنفرانس صوتی
- **فایل**: `src/app/(app)/comms/conference/page.tsx`
- **تغییرات**:
  - جایگزینی `mockPersonnel` با درخواست واقعی به `/api/users`
  - جایگزینی `rooms` hardcoded با API مدیریت اتاق‌ها

### ۲.۴ بی‌سیم راهبری
- **فایل**: `src/app/(app)/comms/radio/page.tsx`
- **تغییرات**:
  - حذف لاگ‌های اولیه hardcoded

### ۲.۵ پنل اقدامات زنده
- **فایل**: `src/app/(app)/admin/live-actions/page.tsx`
- **تغییرات**:
  - حذف شبیه‌ساز mock و اتصال به داده واقعی

### ۲.۶ Message Composer
- **فایل**: `src/components/shared/message-composer.tsx`
- **تغییرات**:
  - حذف mockVoiceUrl hardcoded

---

## فاز ۳: کیفیت کد

### ۳.۱ حذف `any` type
- **فایل‌های اصلی** (بیشترین نقض):
  - `src/app/(app)/admin/users/page.tsx` — ۱۳ مورد
  - `src/app/(app)/performance/page.tsx` — ۱۴ مورد
  - `src/app/(app)/admin/shifts/page.tsx` — ۱۰ مورد
  - `src/server/modules/directory/service.ts` — ۳ مورد
  - `src/server/modules/directory/import.ts` — ۳ مورد
  - `src/server/modules/performance/service.ts` — ۳ مورد
- **روش**: تعریف interface برای هر مورد + استفاده از type assertion فقط در جای ضروری

### ۳.۲ حذف console.error
- **فایل‌ها**: ۲۰ فایل در وب، ۲۵ فایل در موبایل
- **روش**: جایگزینی با error boundary یا حذف کامل

### ۳.۳ اضافه کردن ایندکس به دیتابیس
- **فایل**: `prisma/schema.prisma`
- **ایندکس‌های مورد نیاز**:
  - `SwapRequest`: `@@index([sourceShiftId])`, `@@index([targetShiftId])`
  - `Feedback`: `@@index([userId])`
  - `CrisisEvent`: `@@index([activatedBy])`
  - `Nomination`: `@@index([employeeId])`
  - `Post`: `@@index([authorId])`

### ۳.۴ جلوگیری از auto-seed در هر درخواست
- **فایل**: `src/server/db.ts`
- **تغییرات**: اجرای seed فقط در محیط development و فقط یک بار

---

## فاز ۴: توسعه موبایل

### ۴.۱ صفحات جدید موبایل
- **صفحات مورد نیاز**:
  - PerformanceScreen (عملکرد)
  - ContentScreen (محتوا/اخبار)
  - ExamsScreen (آزمون)
  - OCCScreen (مرکز فرماندهی)
  - PollsScreen (نظرسنجی)

### ۴.۲ سیستم تم یکپارچه
- **فایل‌ها**: تمام صفحات موبایل
- **تغییرات**:
  - ایجاد فایل مشترک `theme.ts` با رنگ‌های یکپارچه
  - جایگزینی رنگ‌های hardcoded در `App.tsx` و تمام صفحات
  - استفاده از Design Tokens مشابه وب اپ

### ۴.۳ کاهش حجم فایل‌ها
- **فایل‌ها**:
  - `RadioSimulatorScreen.tsx` (1041 خط) → استخراج منطق به hooks
  - `VoiceConferenceScreen.tsx` (1349 خط) → استخراج منطق به hooks

### ۴.۴ حذف console.error موبایل
- **فایل‌ها**: ۲۵ فایل
- **روش**: جایگزینی با silent error handling

---

## ترتیب اجرا

| مرحله | فاز | مدت تقریبی |
|-------|-----|-----------|
| ۱ | ۱.۱ مهاجرت PostgreSQL | ۲ روز |
| ۲ | ۱.۲ فعال‌سازی Middleware | ۱ روز |
| ۳ | ۱.۳ حفاظت مسیرها | ۱ روز |
| ۴ | ۱.۴ فیکس تست‌ها | ۱ روز |
| ۵ | ۲.۱-۲.۶ حذف Mock Data | ۳ روز |
| ۶ | ۳.۱ حذف any types | ۳ روز |
| ۷ | ۳.۲ حذف console.error | ۱ روز |
| ۸ | ۳.۳ اضافه کردن ایندکس | ۱ روز |
| ۹ | ۳.۴ جلوگیری از auto-seed | ۰.۵ روز |
| ۱۰ | ۴.۱ صفحات جدید موبایل | ۳ روز |
| ۱۱ | ۴.۲ سیستم تم موبایل | ۲ روز |
| ۱۲ | ۴.۳ کاهش حجم فایل‌ها | ۱ روز |
| ۱۳ | ۴.۴ حذف console.error موبایل | ۰.۵ روز |
| **مجموع** | | **~۲۰ روز کاری** |

---

## تأیید نهایی

پس از هر مرحله:
1. `npm run build` — باید بدون خطا باشه
2. `npm run lint` — باید بدون خطا باشه
3. `npx vitest run` — تمام تست‌ها باید pass کنن
4. `npx tsc --noEmit` — بدون خطای type
5. بررسی دستی صفحات موبایل
