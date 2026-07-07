# 🚆 طرح جامع سامانه مدیریت فالت قطار (Train Fault Management System)

**نسخه:** 1.1 — سند طراحی و سناریو برای توسعه ماژول `faults` (+ ورود/خروج اکسل، QR Code قطار، تشخیص هوشمند کد خطا از زبان محاوره‌ای)
**پروژه:** metro-line1-app — سامانه سیر و حرکت خط ۱ مترو تهران
**جایگاه:** ارتقای ماژول فعلی `tickets` به یک زیرسیستم کامل مدیریت خرابی ناوگان با گردش‌کار چندمرحله‌ای، دیتابیس مرجع قطار و کاتالوگ خطا، و موتور گزارش‌گیری پیشرفته

---

## ۱) چشم‌انداز و دامنه (Vision & Scope)

ماژول فعلی تیکت (`Ticket` + `TicketLog`) یک سیستم ساده‌ی «ثبت و تغییر وضعیت» است. هدف این طرح، تبدیل آن به یک **سامانه مدیریت خرابی ناوگان (Fleet Fault Management)** است با این ارکان:

1. **دیتابیس مرجع (Master Data):** شناسنامه قطارها و واگن‌ها + کاتالوگ استاندارد خطاها (کد خطا، سیستم، شدت پیش‌فرض، راهنمای اقدام).
2. **گردش‌کار چندنقشی (Multi-Role Workflow):** راهبر ثبت می‌کند ← مسئول/سرشیفت تایید و ویرایش می‌کند ← تعمیرات اقدامات را ثبت می‌کند ← تاییدیه نهایی و بستن.
3. **ورود اطلاعات فوق‌سریع:** اسکن QR قطار برای دسترسی آنی به اطلاعات و ثبت، تشخیص هوشمند کد خطا از شرح محاوره‌ای/صوتی راهبر، و ایمپورت گروهی اکسل — هدف: ثبت فالت زیر ۳۰ ثانیه.
4. **موتور گزارش‌گیری و تحلیل:** فالت‌های ماندگار، تکراری، گزارش باز-زمانی (Aging)، تحلیل هر قطار نسبت به هر نوع فالت، و KPIهای نگهداشت (MTTR / MTBF / Pareto) — همه با خروجی اکسل و PDF.
5. **شناسنامه فنی قطار (Train Health Profile):** تاریخچه کامل هر قطار در یک نما.

### خارج از دامنه فاز ۱
- اتصال به CMMS بیرونی یا سیستم انبار قطعات (فاز آینده)
- برنامه‌ریزی نگهداشت پیشگیرانه (PM Scheduling) — فقط زیرساخت داده‌ای آن آماده می‌شود

---

## ۲) بازیگران و نقش‌ها (Actors)

| نقش | کد نقش | وظیفه در گردش‌کار |
| :--- | :--- | :--- |
| **راهبر / اپراتور** | `operator` | ثبت اولیه فالت از روی کاتالوگ، افزودن عکس و توضیح، مشاهده فالت‌های خودش |
| **سرشیفت / مسئول سیر و حرکت** | `supervisor` (نقش سفارشی با permission) | بازبینی، ویرایش، تایید یا رد فالت، تعیین اولویت نهایی، ارجاع به تعمیرات |
| **کارشناس تعمیرات** | `maintenance` (نقش سفارشی) | دریافت کارتابل، ثبت اقدامات انجام‌شده، قطعات مصرفی، اعلام رفع خرابی یا «ماندگار» کردن فالت |
| **ناظر کیفی / مدیر** | `manager` | تایید نهایی رفع خرابی (اختیاری در تنظیمات)، مشاهده گزارش‌ها و داشبورد |
| **ادمین سیستم** | `admin` / `super_admin` | مدیریت کاتالوگ خطا، ناوگان، پیکربندی مراحل گردش‌کار و SLA |

> نقش‌ها با سیستم RBAC موجود (rank + permissions) پیاده می‌شوند. نقش‌های `supervisor` و `maintenance` به‌صورت **نقش سفارشی** با permissionهای جدید تعریف می‌شوند — نیازی به تغییر ساختار RBAC نیست.

### Permissionهای جدید (افزودن به `src/server/rbac/permissions.ts`)

```
resource: 'faults'
  faults:create          ثبت فالت
  faults:read            مشاهده فالت‌ها
  faults:review          تایید / رد / ویرایش در مرحله بازبینی
  faults:repair          ثبت اقدامات تعمیراتی
  faults:verify          تایید نهایی و بستن
  faults:reopen          بازگشایی فالت بسته‌شده
  faults:defer           ماندگار کردن (Deferred) فالت

resource: 'fleet'
  fleet:manage           مدیریت قطارها و واگن‌ها
  fleet:read             مشاهده ناوگان

resource: 'fault-catalog'
  fault-catalog:manage   مدیریت کاتالوگ خطاها
  fault-catalog:read     مشاهده کاتالوگ

resource: 'fault-reports'
  fault-reports:view     مشاهده گزارش‌ها و داشبورد تحلیلی
  fault-reports:export   خروجی اکسل / PDF
```

---

## ۳) مدل داده (Prisma Schema)

### ۳.۱ ناوگان (Fleet Master Data)

```prisma
// ── Fleet ──────────────────────────────────────────────

enum TrainStatus {
  active        // در سرویس
  standby       // آماده‌به‌کار در دپو
  maintenance   // در تعمیرات
  out_of_service // خارج از سرویس
}

model Train {
  id           String      @id @default(cuid())
  trainNumber  String      @unique          // مثلاً "110" — همان trainNumber موجود در RosterAssignment
  fleetSeries  String?                      // سری ناوگان: DC01، AC02 و...
  manufacturer String?                      // سازنده: CNR، CRRC و...
  wagonCount   Int         @default(7)
  commissionedAt DateTime?                  // تاریخ ورود به بهره‌برداری
  status       TrainStatus @default(active)
  qrToken      String      @unique @default(cuid())  // توکن QR — قابل بازتولید توسط ادمین در صورت لو رفتن برچسب
  notes        String?
  isActive     Boolean     @default(true)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  wagons Wagon[]
  faults FaultReport[]

  @@index([status])
}

model Wagon {
  id         String  @id @default(cuid())
  trainId    String
  wagonCode  String                         // کد واگن، مثلاً "110-3"
  position   Int                            // جایگاه در رام: 1..7
  wagonType  String?                        // Mc / Tp / M / T
  isActive   Boolean @default(true)

  train  Train         @relation(fields: [trainId], references: [id])
  faults FaultReport[]

  @@unique([trainId, position])
  @@index([trainId])
}
```

### ۳.۲ کاتالوگ خطا (Fault Catalog)

ساختار دوسطحی: **سیستم (Category)** ← **کد خطا (FaultCode)**. کاربر هنگام ثبت، اول سیستم را انتخاب می‌کند بعد کد خطا — جستجوی متنی هم روی هر دو فعال است.

```prisma
model FaultCategory {
  id        String  @id @default(cuid())
  code      String  @unique      // BRK, DRS, TRC, HVAC, SIG, BOG, PAN, ...
  title     String               // ترمز، درب‌ها، کشش (Traction)، تهویه، سیگنالینگ، بوژی، پانتوگراف...
  sortOrder Int     @default(0)
  isActive  Boolean @default(true)

  faultCodes FaultCode[]
}

model FaultCode {
  id              String         @id @default(cuid())
  categoryId      String
  code            String         @unique   // مثلاً BRK-012
  title           String                   // «عدم آزادسازی ترمز واگن»
  description     String?                  // شرح فنی
  defaultPriority TicketPriority @default(medium)
  safetyCritical  Boolean        @default(false)  // آیا خرابی ایمنی‌محور است؟
  requiresWagon   Boolean        @default(true)   // آیا انتخاب واگن الزامی است؟
  operatorGuide   String?                  // راهنمای اقدام فوری راهبر (نمایش هنگام ثبت)
  keywords        String?                  // برای جستجو: «ترمز، release، BP»
  aliases         String?                  // عبارات محاوره‌ای معادل: «ترمز ول نمی‌کنه | ترمز نمی‌خوابه | چرخ قفله»
  embedding       Bytes?                   // بردار ۳۸۴ بعدی (title + keywords + aliases) برای تطبیق معنایی
  isActive        Boolean        @default(true)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  category FaultCategory @relation(fields: [categoryId], references: [id])
  faults   FaultReport[]

  @@index([categoryId])
}
```

### ۳.۳ گزارش فالت و گردش‌کار (Fault Report & Workflow)

```prisma
enum FaultStatus {
  submitted        // ثبت‌شده توسط راهبر — در انتظار بازبینی
  under_review     // در حال بازبینی سرشیفت
  needs_info       // برگشت به راهبر برای تکمیل اطلاعات
  rejected         // رد شده (فالت نامعتبر / تکراری)
  approved         // تایید و ارجاع به تعمیرات
  in_repair        // در دست تعمیر
  repaired         // اقدامات ثبت شده — در انتظار تایید نهایی
  verified_closed  // تایید نهایی و بسته‌شده
  deferred         // ماندگار (رفع نشده، با مجوز ادامه سرویس یا در انتظار قطعه)
  reopened         // بازگشایی‌شده پس از بسته شدن
}

model FaultReport {
  id             String         @id @default(cuid())
  faultNo        Int            @unique @default(autoincrement()) // شماره خوانا: F-1042
  trainId        String
  wagonId        String?
  faultCodeId    String
  status         FaultStatus    @default(submitted)
  priority       TicketPriority @default(medium)

  // ثبت اولیه
  reporterId     String
  description    String                    // شرح راهبر
  locationNote   String?                   // ایستگاه/موقعیت وقوع
  occurredAt     DateTime                  // زمان وقوع (جدا از زمان ثبت)
  serviceImpact  String?                   // none | delay | evacuated | removed_from_service
  photoUrls      Json?                     // آرایه URL عکس‌ها
  annotations    Json?                     // علامت‌گذاری روی عکس (سازگار با Ticket فعلی)

  // بازبینی
  reviewerId     String?
  reviewNote     String?
  reviewedAt     DateTime?

  // تعمیرات
  assigneeId     String?                   // کارشناس تعمیرات
  repairStartAt  DateTime?
  repairEndAt    DateTime?
  rootCause      String?                   // علت ریشه‌ای
  actionsTaken   String?                   // شرح اقدامات
  partsUsed      Json?                     // [{name, qty, partNo?}]

  // بستن / ماندگاری
  verifierId     String?
  verifiedAt     DateTime?
  closedAt       DateTime?
  deferReason    String?                   // دلیل ماندگاری (انتظار قطعه، برنامه اورهال...)
  deferUntil     DateTime?                 // مهلت بازبینی مجدد فالت ماندگار

  // تحلیل تکرار
  recurrenceOfId String?                   // اگر تکرار یک فالت قبلی است، ارجاع به آن
  slaDueAt       DateTime?                 // مهلت SLA مرحله جاری
  slaBreached    Boolean        @default(false)

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  train        Train        @relation(fields: [trainId], references: [id])
  wagon        Wagon?       @relation(fields: [wagonId], references: [id])
  faultCode    FaultCode    @relation(fields: [faultCodeId], references: [id])
  reporter     User         @relation("FaultReporter", fields: [reporterId], references: [id])
  reviewer     User?        @relation("FaultReviewer", fields: [reviewerId], references: [id])
  assignee     User?        @relation("FaultAssignee", fields: [assigneeId], references: [id])
  verifier     User?        @relation("FaultVerifier", fields: [verifierId], references: [id])
  recurrenceOf FaultReport? @relation("FaultRecurrence", fields: [recurrenceOfId], references: [id])
  recurrences  FaultReport[] @relation("FaultRecurrence")
  logs         FaultLog[]

  @@index([trainId, status])
  @@index([faultCodeId])
  @@index([status])
  @@index([occurredAt])
  @@index([slaDueAt])
}

enum FaultLogAction {
  created
  status_changed
  edited            // ویرایش فیلدها (با ثبت before/after)
  assigned
  comment
  priority_changed
  attachment_added
  sla_breached
  reopened
  deferred
}

model FaultLog {
  id        String         @id @default(cuid())
  faultId   String
  actorId   String
  action    FaultLogAction
  fromStatus FaultStatus?
  toStatus   FaultStatus?
  note      String?
  changes   Json?          // {field: {before, after}} برای ویرایش‌ها
  createdAt DateTime       @default(now())

  fault FaultReport @relation(fields: [faultId], references: [id])
  actor User        @relation("FaultLogActor", fields: [actorId], references: [id])

  @@index([faultId])
}
```

### ۳.۴ پیکربندی گردش‌کار و SLA (قابل مدیریت توسط ادمین)

به‌جای هاردکد، مراحل و SLA از جدول تنظیمات خوانده می‌شود تا ادمین بتواند بدون دیپلوی تغییرشان دهد (سازگار با ماژول `settings` موجود):

```
faults.workflow.requireFinalVerification   true/false — آیا مرحله تایید نهایی فعال است؟
faults.sla.review.hours                    مهلت بازبینی بر حسب اولویت: {critical: 1, high: 4, medium: 12, low: 24}
faults.sla.repair.hours                    مهلت تعمیر: {critical: 4, high: 24, medium: 72, low: 168}
faults.recurrence.windowDays               پنجره تشخیص تکرار (پیش‌فرض 30 روز)
faults.persistent.thresholdDays            آستانه «ماندگار» شدن گزارش‌ها (پیش‌فرض 7 روز باز بودن)
faults.autoAssign.byCategory               نگاشت دسته خطا ← تیم تعمیرات: {BRK: userId/groupId, ...}
```

---

## ۴) ماشین وضعیت و گردش‌کار (State Machine)

```
                    ┌──────────────┐
     راهبر ثبت ───▶ │  submitted   │
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐   نیاز به اطلاعات   ┌────────────┐
        سرشیفت ───▶ │ under_review │ ──────────────────▶ │ needs_info │──┐
                    └──┬───────┬───┘                     └────────────┘  │ راهبر تکمیل می‌کند
                       │       │ رد (نامعتبر/تکراری)                     │ و برمی‌گردد به
                       │       ▼                                        ▼ under_review
                       │  ┌──────────┐
                       │  │ rejected │ (پایان — با ثبت دلیل)
                       │  └──────────┘
                       ▼ تایید + تعیین اولویت + ارجاع
                    ┌──────────────┐
                    │   approved   │ ← auto-assign بر اساس دسته خطا
                    └──────┬───────┘
                           ▼ تعمیرات شروع کار را می‌زند
                    ┌──────────────┐        در انتظار قطعه / مجوز
                    │  in_repair   │ ─────────────────────────────▶ ┌──────────┐
                    └──────┬───────┘                                │ deferred │
                           ▼ ثبت اقدامات + علت ریشه‌ای              └────┬─────┘
                    ┌──────────────┐                                     │ بازبینی دوره‌ای
                    │   repaired   │ ◀───────────────────────────────────┘
                    └──────┬───────┘
                           ▼ ناظر/سرشیفت تایید نهایی
                    ┌─────────────────┐        مشکل برگشت
                    │ verified_closed │ ─────────────────▶ reopened ──▶ under_review
                    └─────────────────┘
```

### قواعد گذار (Transition Guards)
- هر گذار فقط توسط نقش دارای permission مربوطه مجاز است (`faults:review`, `faults:repair`, `faults:verify`, ...).
- گذار به `repaired` بدون پر کردن `actionsTaken` و `rootCause` **مسدود** است.
- گذار به `deferred` نیازمند `deferReason` و permission ویژه `faults:defer` است.
- فالت با `safetyCritical = true` نمی‌تواند `deferred` شود مگر توسط `manager` به بالا.
- `reopened` فقط تا ۳۰ روز پس از بسته شدن مجاز است؛ بعد از آن فالت جدید با `recurrenceOfId` ثبت می‌شود.
- **هر گذار و هر ویرایش** در `FaultLog` با before/after ثبت می‌شود (Immutable Audit Trail) — سازگار با `AuditLog` موجود پروژه.

### تشخیص خودکار تکرار (Recurrence Detection)
هنگام ثبت فالت جدید، سرویس بررسی می‌کند: آیا روی **همین قطار** با **همین کد خطا** در `windowDays` گذشته فالت بسته‌شده‌ای وجود دارد؟
- اگر بله ← فیلد `recurrenceOfId` به‌صورت خودکار پر می‌شود و بنر «⚠️ فالت تکراری — سومین تکرار در ۳۰ روز اخیر» به سرشیفت و تعمیرات نمایش داده می‌شود.
- تکرار ۳+ باره ← اولویت به‌صورت خودکار یک سطح بالا می‌رود و نوتیفیکیشن به مدیر ارسال می‌شود.

---

## ۵) سناریوهای کاربری (End-to-End Scenarios)

### سناریو ۱ — چرخه کامل موفق
1. **راهبر (احمدی)** حین سرویس قطار ۱۱۰ متوجه صدای غیرعادی ترمز واگن ۳ می‌شود. در اپ موبایل: «ثبت فالت» ← قطار ۱۱۰ (پیش‌فرض از شیفت جاری در لوحه خوانده می‌شود) ← واگن ۳ ← دسته «ترمز» ← جستجوی «آزادسازی» ← کد `BRK-012`. راهنمای اقدام فوری راهبر نمایش داده می‌شود. عکس می‌گیرد، محل را روی عکس علامت می‌زند، ایستگاه وقوع «شهدا» و زمان را ثبت می‌کند. وضعیت: `submitted`.
2. **سیستم** به‌صورت خودکار: اولویت پیش‌فرض کد خطا (`high`) را می‌گذارد، تکرار را چک می‌کند، SLA بازبینی ۴ ساعته می‌سازد و به سرشیفت کشیک نوتیفیکیشن SSE می‌فرستد.
3. **سرشیفت (رضایی)** در کارتابل بازبینی فالت را باز می‌کند، توضیح را اصلاح می‌کند (ویرایش با ثبت لاگ)، اولویت را تایید و «تایید و ارجاع» می‌زند. سیستم بر اساس نگاشت `BRK ← تیم ترمز` فالت را به کارشناس تعمیرات ارجاع می‌دهد. وضعیت: `approved`.
4. **کارشناس تعمیرات (کریمی)** در کارتابل خود «شروع تعمیر» می‌زند (`in_repair`، ثبت `repairStartAt`). پس از رفع: علت ریشه‌ای «فرسودگی سیلندر ترمز»، اقدامات «تعویض سیلندر و تست BP»، قطعه مصرفی «سیلندر ترمز × ۱» را ثبت و «اعلام رفع» می‌زند (`repaired`).
5. **سرشیفت** تایید نهایی می‌کند ← `verified_closed`. مدت باز بودن، MTTR و تاریخچه به شناسنامه قطار ۱۱۰ اضافه می‌شود.

### سناریو ۲ — برگشت برای تکمیل اطلاعات
راهبر فالت درب ثبت می‌کند اما شماره واگن را اشتباه زده. سرشیفت «نیاز به اطلاعات» می‌زند با پیام «کدام واگن؟». وضعیت `needs_info` ← راهبر نوتیفیکیشن می‌گیرد، اصلاح می‌کند ← برمی‌گردد به `under_review`.

### سناریو ۳ — فالت ماندگار (Deferred)
فالت تهویه واگن ۵ قطار ۱۲۵ به قطعه وارداتی نیاز دارد. تعمیرات «ماندگار کردن» می‌زند با دلیل «در انتظار قطعه — سفارش ثبت شد» و `deferUntil` دو هفته بعد. فالت در **گزارش فالت‌های ماندگار** ظاهر می‌شود و در سررسید، نوتیفیکیشن بازبینی خودکار ارسال می‌شود. چون `safetyCritical = false` است قطار در سرویس می‌ماند.

### سناریو ۴ — فالت تکراری و تشدید (Escalation)
کد `DRS-004` (گیر کردن درب) روی قطار ۱۱۸ برای سومین بار در یک ماه ثبت می‌شود. سیستم خودکار: اولویت را از `medium` به `high` ارتقا می‌دهد، بنر تکرار نشان می‌دهد، و به مدیر نگهداشت گزارش «فالت تکرارشونده» می‌فرستد تا بررسی ریشه‌ای (RCA) انجام شود.

### سناریو ۵ — ثبت ۳۰ ثانیه‌ای با QR و زبان محاوره‌ای ⚡
راهبر در دپو کنار قطار ۱۲۵ است. QR کابین را با اپ اسکن می‌کند ← صفحه سریع قطار ۱۲۵ باز می‌شود («۲ فالت باز») ← «ثبت فالت جدید» ← میکروفون را می‌زند و می‌گوید: *«درِ واگن پنج موقع بسته شدن گیر می‌کنه و آژیر می‌زنه»* ← سیستم پیشنهاد می‌دهد: `DRS-004` گیر مکانیکی درب (٪۹۱). انتخاب می‌کند، واگن ۵ را روی شماتیک می‌زند، عکس می‌گیرد، ثبت. **کل فرآیند: ~۳۰ ثانیه، بدون تایپ.** شرح صوتی‌اش عیناً در فالت ذخیره شده است.

### سناریو ۶ — انتقال سوابق کاغذی با اکسل
مسئول دفتر فنی ۳ سال سابقه فالت کاغذی را در اکسل دارد. قالب را دانلود می‌کند، ۱۲۰۰ ردیف را در آن می‌ریزد و آپلود می‌کند ← پیش‌نمایش: ۱۱۵۲ سبز، ۳۱ زرد (کد خطای قدیمی — نگاشت پیشنهادی)، ۱۷ قرمز (شماره قطار نامعتبر). فایل خطاها را دانلود، اصلاح و مجدد آپلود می‌کند ← ثبت تراکنشی. حالا گزارش تکرار و MTTR شامل کل تاریخچه ۳ ساله است.

### سناریو ۷ — نقض SLA
فالت `critical` پانتوگراف ثبت شده ولی ۱ ساعت گذشته و بازبینی نشده. جاب دوره‌ای `slaBreached = true` می‌زند، لاگ `sla_breached` ثبت و نوتیف تشدید به مدیر ارسال می‌شود. در گزارش باز-زمانی با نشان قرمز دیده می‌شود.

---

## ۶) موتور گزارش‌گیری (Reporting Engine)

تمام گزارش‌ها با فیلتر مشترک: بازه تاریخ (جلالی در UI)، قطار، واگن، دسته/کد خطا، وضعیت، اولویت، تیم تعمیرات + خروجی **اکسل** (با `xlsx` موجود در پروژه) و چاپ.

### ۶.۱ گزارش فالت‌های ماندگار و باز (Persistent & Open Faults)
- همه فالت‌های `deferred` + فالت‌های باز بیش از `thresholdDays`.
- ستون‌ها: شماره فالت، قطار، واگن، کد خطا، روزهای باز بودن، دلیل ماندگاری، مهلت بازبینی، مسئول فعلی.
- مرتب‌سازی پیش‌فرض: قدیمی‌ترین اول. نشانگر رنگی: زرد > ۷ روز، قرمز > ۳۰ روز.

### ۶.۲ گزارش فالت‌های تکراری هر قطار (Recurrence Report)
- گروه‌بندی: قطار ← کد خطا ← تعداد تکرار در بازه.
- کوئری: `GROUP BY trainId, faultCodeId HAVING COUNT(*) >= 2` در پنجره زمانی.
- نمایش زنجیره تکرار (فالت‌های مرتبط با `recurrenceOfId`) به‌صورت Timeline.

### ۶.۳ گزارش باز-زمانی قطار (Train Aging / Downtime Report)
- برای هر قطار: تعداد فالت باز، میانگین و بیشینه مدت باز بودن، مجموع ساعات `in_repair` (تقریب Downtime)، تعداد نقض SLA.
- **MTTR** = میانگین (`repairEndAt - repairStartAt`) فالت‌های بسته‌شده.
- **MTBF تقریبی** = طول بازه ÷ تعداد فالت‌های قطار.
- نمودار ستونی مقایسه‌ای بین قطارها + خط روند ماهانه.

### ۶.۴ گزارش قطار نسبت به فالت خاص (Train × Fault Matrix)
- انتخاب یک کد خطا ← جدول همه قطارها با تعداد وقوع، آخرین وقوع، وضعیت آخرین مورد.
- و برعکس: انتخاب یک قطار ← **Pareto** کدهای خطای آن قطار (۲۰٪ خطاهایی که ۸۰٪ مشکلات را می‌سازند).

### ۶.۵ داشبورد KPI نگهداشت (صفحه مدیر)
کارت‌های بالا: فالت‌های باز | بحرانی باز | نقض SLA این ماه | MTTR ماه جاری.
نمودارها: روند ثبت/بستن ماهانه، Top 5 قطار پرخطا، Pareto دسته‌های خطا، نرخ تکرار.

### ۶.۶ شناسنامه قطار (Train Health Profile)
صفحه اختصاصی هر قطار: مشخصات، وضعیت فعلی، Timeline کامل فالت‌ها، آمار به تفکیک واگن (کدام واگن بیشترین خرابی را دارد)، فالت‌های ماندگار فعال.

---

## ۷) طراحی API (App Router — سازگار با ساختار موجود)

```
── Fleet (ادمین)
GET/POST        /api/fleet/trains
GET/PATCH/DELETE /api/fleet/trains/[id]
GET/POST        /api/fleet/trains/[id]/wagons
POST            /api/fleet/trains/import          ← ایمپورت اکسل ناوگان (الگوی Excel Import موجود)

── Fault Catalog (ادمین)
GET/POST        /api/fault-catalog/categories
GET/POST        /api/fault-catalog/codes
PATCH/DELETE    /api/fault-catalog/codes/[id]
GET             /api/fault-catalog/search?q=...    ← جستجوی متنی کاربر هنگام ثبت
POST            /api/fault-catalog/import          ← ایمپورت اکسل کاتالوگ

── Faults (گردش‌کار)
POST            /api/faults                        ← ثبت (operator) + تشخیص خودکار تکرار
GET             /api/faults?status=&trainId=&...   ← لیست با فیلتر و pagination
GET             /api/faults/[id]                   ← جزئیات + لاگ کامل
PATCH           /api/faults/[id]                   ← ویرایش فیلدها (با ثبت changes)
POST            /api/faults/[id]/transition        ← { action: approve|reject|needs_info|start_repair|complete_repair|verify|defer|reopen, note, payload }
POST            /api/faults/[id]/comments
GET             /api/faults/my-queue               ← کارتابل نقش جاری (بازبینی/تعمیرات/تایید)

── Reports
GET             /api/fault-reports/persistent
GET             /api/fault-reports/recurrence?windowDays=30
GET             /api/fault-reports/train-aging?from=&to=
GET             /api/fault-reports/matrix?faultCodeId= | ?trainId=
GET             /api/fault-reports/kpi
GET             /api/fault-reports/train/[trainId]/profile
GET             /api/fault-reports/export?type=...&format=xlsx
```

نکات پیاده‌سازی:
- یک endpoint واحد `transition` با اکشن‌محوری، منطق state machine را در `src/server/modules/faults/workflow.ts` متمرکز می‌کند (تست‌پذیر با Vitest مانند `guard.test.ts`).
- نوتیفیکیشن‌ها از ماژول `notifications` و کانال SSE موجود (`src/server/realtime`) استفاده می‌کنند.
- ولیدیشن با Zod در `src/lib/zod/faults.ts` (الگوی `safety.ts` فعلی).
- `predictTicketPriority` موجود (تحلیل کلیدواژه) به‌عنوان پیشنهاددهنده اولویت در فرم ثبت بازاستفاده می‌شود.

---

## ۸) طراحی UI (سه سطح: وب / PWA / اپ Expo — مطابق UI_DESIGN.md)

### ۸.۱ ویزارد ثبت فالت (موبایل — راهبر) — ۳ گام
مسیرهای ورود (سریع‌ترین به کندترین): **اسکن QR قطار** (گام ۱ حذف — بخش ۹) ← **شیفت جاری** (قطار پیش‌فرض از لوحه) ← انتخاب دستی.
1. **قطار و واگن:** شماره قطار پیش‌فرض از شیفت جاری راهبر (اتصال به `RosterAssignment.trainNumber`) + امکان تغییر. انتخاب واگن با نمای شماتیک رام (۷ خانه لمسی ≥ 44px).
2. **نوع خطا (هوشمند):** فیلد بزرگ «چه مشکلی پیش آمده؟ به زبان خودتان بنویسید…» + میکروفون ← سیستم ۳ کد پیشنهادی با درصد اطمینان نمایش می‌دهد (بخش ۱۰). انتخاب دستی از درخت دسته‌بندی (آیکون‌دار) همیشه در دسترس است ← نمایش «راهنمای اقدام فوری» اگر تعریف شده. اگر کد پیدا نشد: گزینه «سایر» با توضیح آزاد (بعداً سرشیفت کد صحیح را می‌گذارد).
3. **جزئیات:** شرح، ایستگاه وقوع، زمان وقوع (پیش‌فرض اکنون — جلالی)، عکس + علامت‌گذاری روی عکس (کامپوننت موجود تیکت)، اثر بر سرویس. دکمه ثبت ← نمایش شماره فالت `F-1042`.
- **حالت آفلاین موبایل:** ذخیره local (Zustand persist) و ارسال خودکار هنگام اتصال — برای تونل‌ها ضروری.

### ۸.۲ کارتابل بازبینی (وب — سرشیفت)
جدول با تب‌های وضعیت، نشان SLA (سبز/زرد/قرمز)، بنر تکرار. پنل جزئیات: ویرایش درجا، دکمه‌های تایید/رد/نیاز به اطلاعات، انتخاب کارشناس تعمیرات (یا پیشنهاد خودکار).

### ۸.۳ کارتابل تعمیرات (وب + موبایل)
لیست ارجاع‌شده‌ها ← شروع تعمیر ← فرم پایان کار: علت ریشه‌ای، اقدامات، قطعات مصرفی (ردیف‌های داینامیک)، عکس بعد از تعمیر ← اعلام رفع یا ماندگار کردن.

### ۸.۴ گزارش‌ها و داشبورد (وب — مدیر)
صفحه گزارش‌ساز با فیلترهای مشترک + ۶ گزارش بخش ۶ + شناسنامه قطار. همه با اسکلتون/خالی/خطا، دارک‌مود و اعداد فارسی.

---

## ۹) ورود سریع اطلاعات: QR Code قطار (Scan-to-Report)

هدف: راهبر در کمتر از **۳۰ ثانیه** و با حداقل تایپ، فالت را ثبت کند.

### ۹.۱ زیرساخت QR
- هر قطار (و اختیاری: هر واگن) یک برچسب QR ضدخش در کابین راهبر و بدنه دارد.
- محتوای QR یک لینک عمیق (Deep Link) است — **نه** داده خام:
  `https://<domain>/t/<qrToken>` که هم در مرورگر (PWA) و هم در اپ Expo (با `expo-linking`) باز می‌شود.
- استفاده از `qrToken` تصادفی به‌جای شماره قطار، دو مزیت دارد: جلوگیری از حدس زدن لینک قطارهای دیگر، و امکان **باطل‌کردن و چاپ مجدد** برچسب توسط ادمین بدون تغییر شناسه قطار.
- ادمین در صفحه ناوگان: تولید/بازتولید QR هر قطار + **چاپ گروهی برچسب‌ها** (خروجی PDF شامل QR + شماره قطار + لوگو، در قالب A4 برچسبی).

### ۹.۲ تجربه اسکن (Train Quick Page)
اسکن با دوربین اپ (کامپوننت `expo-camera` / BarcodeScanner) یا دوربین خود گوشی ← صفحه سریع قطار:

```
┌──────────────────────────────────┐
│  🚆 قطار ۱۱۰ — سری DC01          │
│  وضعیت: در سرویس ✅              │
│  فالت باز: ۲  |  ماندگار: ۱      │
├──────────────────────────────────┤
│  [ ⚡ ثبت فالت جدید ]            │  ← قطار از قبل انتخاب شده، مستقیم گام ۲ ویزارد
│  [ 📋 فالت‌های باز این قطار ]     │
│  [ 📖 شناسنامه و تاریخچه ]        │
└──────────────────────────────────┘
```

- اگر کاربر لاگین نباشد ← ابتدا لاگین، سپس بازگشت خودکار به همان صفحه (returnUrl).
- سطح دسترسی رعایت می‌شود: راهبر «ثبت فالت» و اطلاعات عمومی را می‌بیند؛ تعمیرات کارتابل همان قطار را؛ مهمان فقط پیام «دسترسی ندارید».
- اسکن QR واگن ← همان صفحه با **واگن از پیش انتخاب‌شده** (گام ۱ ویزارد کاملاً حذف می‌شود).
- هر اسکن در `FaultLog`/Audit با موقعیت ثبت می‌شود (اختیاری، برای تحلیل).

### ۹.۳ API
```
GET  /api/fleet/scan/[qrToken]            ← اطلاعات قطار + شمارنده فالت‌ها (بر اساس نقش)
POST /api/fleet/trains/[id]/qr/rotate     ← بازتولید توکن (ادمین)
GET  /api/fleet/qr-labels?trainIds=...    ← PDF برچسب‌های چاپی
```

---

## ۱۰) تشخیص هوشمند کد خطا از زبان محاوره‌ای (Smart Fault Matching)

راهبر لازم نیست کد خطا را بلد باشد. فقط به زبان خودش می‌نویسد (یا **می‌گوید** — ورودی صوتی) و سیستم کد را پیشنهاد می‌دهد.

> مثال: راهبر می‌نویسد «ترمز واگن سه ول نمی‌کنه، قطار کشیده میشه» ← سیستم پیشنهاد می‌دهد:
> 🥇 `BRK-012` عدم آزادسازی ترمز (٪۹۴) | 🥈 `BRK-007` گیرپاژ کفشک ترمز (٪۸۱) | 🥉 `BOG-003` قفل بوژی (٪۶۲)

### ۱۰.۱ معماری سه‌لایه (بازاستفاده کامل از زیرساخت AI موجود پروژه)

```
ورودی محاوره‌ای راهبر
        │
        ▼
لایه ۱: تطبیق کلیدواژه و aliases (فوری، بدون هزینه)
        │  اگر امتیاز < آستانه
        ▼
لایه ۲: جستجوی معنایی محلی — cosine similarity روی embedding کدهای خطا
        │  (همان مدل ۳۸۴ بعدی @xenova/transformers که در Semantic Cache پروژه فعال است
        │   — کاملاً آفلاین، < ۵۰ms، بدون هزینه API)
        │  اگر بهترین امتیاز < 0.55
        ▼
لایه ۳: AI Gateway (Gemini/OpenRouter/Ollama با Circuit Breaker موجود)
           پرامپت: شرح راهبر + ۲۰ کد نزدیک ← انتخاب ۳ کد + دلیل (JSON)
```

- **بردارسازی کاتالوگ:** هنگام ایجاد/ویرایش هر `FaultCode`، بردار `title + keywords + aliases` محاسبه و در فیلد `embedding` ذخیره می‌شود (جاب یک‌باره برای seed اولیه).
- **یادگیری از اصلاحات (Feedback Loop):** اگر سرشیفت کد پیشنهادی را عوض کند، عبارت راهبر به‌عنوان alias پیشنهادی برای کد صحیح در صف تایید ادمین می‌رود ← دقت سیستم به‌مرور بالا می‌رود.
- **UX در ویزارد:** گام ۲ با یک فیلد بزرگ «چه مشکلی پیش آمده؟ به زبان خودتان بنویسید…» + آیکون میکروفون (Speech-to-Text سیستم‌عامل). سه پیشنهاد به‌صورت کارت با درصد اطمینان؛ انتخاب دستی از درخت دسته‌بندی همیشه به‌عنوان جایگزین باز است. اگر هیچ‌کدام درست نبود ← «سایر» + متن آزاد (سرشیفت بعداً کدگذاری می‌کند).
- شرح محاوره‌ای راهبر **عیناً** در `description` می‌ماند؛ کد فقط برچسب ساختاریافته است — هیچ اطلاعاتی از دست نمی‌رود.

### ۱۰.۲ API
```
POST /api/fault-catalog/match        ← { text } → [{ faultCodeId, code, title, confidence, source: keyword|semantic|llm }]
POST /api/fault-catalog/aliases      ← ثبت alias پیشنهادی از Feedback Loop (صف تایید ادمین)
```

---

## ۱۱) ورود و خروج اکسل (Excel Import / Export)

طبق الگوی موفق Excel Import موجود پروژه (دفتر تلفن): **پیش‌نمایش قبل از ثبت + گزارش خطای خط‌به‌خط**.

### ۱۱.۱ ایمپورت‌ها

| نوع | کاربرد | ستون‌های کلیدی |
| :--- | :--- | :--- |
| **ناوگان** | راه‌اندازی اولیه / به‌روزرسانی گروهی قطارها و واگن‌ها | شماره قطار، سری، سازنده، تعداد واگن، وضعیت |
| **کاتالوگ خطا** | بارگذاری کدهای استاندارد (۱۵۰+ کد) و به‌روزرسانی | کد، دسته، عنوان، شرح، شدت، ایمنی‌محور، کلیدواژه‌ها، aliases، راهنمای راهبر |
| **فالت‌های گروهی** | انتقال سوابق قدیمی کاغذی/اکسل به سیستم + ثبت گروهی فالت‌های بازرسی دوره‌ای | شماره قطار، واگن، کد خطا، شرح، تاریخ وقوع (جلالی یا میلادی)، وضعیت، اقدامات، تاریخ رفع |

**فرآیند ایمپورت فالت (۴ مرحله):**
1. **دانلود قالب:** فایل نمونه با هدر فارسی، ردیف مثال، و Data Validation (لیست کشویی کدهای خطا و شماره قطارهای فعال داخل خود اکسل — تولید داینامیک با `xlsx`).
2. **آپلود و اعتبارسنجی:** بررسی هر ردیف — قطار موجود؟ کد خطا معتبر؟ تاریخ صحیح؟ ردیف تکراری (همان قطار+کد+تاریخ)؟ تبدیل خودکار تاریخ جلالی↔میلادی و اعداد فارسی↔ASCII.
3. **پیش‌نمایش:** جدول رنگی — سبز (آماده ثبت)، زرد (هشدار: مثلاً کد خطای غیرفعال)، قرمز (خطا + دلیل دقیق). امکان اصلاح درجا یا حذف ردیف. **فایل خطاها** قابل دانلود است (همان اکسل + ستون «خطا») تا کاربر اصلاح و دوباره آپلود کند.
4. **ثبت تراکنشی:** ثبت فقط ردیف‌های سبز/تاییدشده در یک تراکنش + لاگ `imported` برای هر فالت + گزارش نهایی «۹۶ ثبت شد، ۴ رد شد».

- فالت‌های ایمپورتی تاریخی با وضعیت واقعی‌شان وارد می‌شوند (مثلاً مستقیم `verified_closed` با تاریخ رفع) و در همه گزارش‌ها (تکرار، MTTR و...) لحاظ می‌شوند — فیلد `metadata.importBatchId` برای ردیابی و **Rollback کل دسته** توسط ادمین.

### ۱۱.۲ اکسپورت‌ها (همه‌جا، یک کلیک)

- **لیست فالت‌ها:** خروجی دقیقاً منطبق بر فیلترهای فعال صفحه (وضعیت، قطار، بازه و...) — «آنچه می‌بینی، همان را می‌گیری».
- **هر ۶ گزارش بخش ۶** (ماندگار، تکراری، باز-زمانی، ماتریس، KPI، شناسنامه قطار) دکمه «خروجی اکسل» دارند.
- **قالب حرفه‌ای خروجی:** شیت اول = داده با هدر فارسی، فریز ردیف اول، فیلتر خودکار، رنگ‌بندی وضعیت/اولویت؛ شیت دوم = «خلاصه» با آمار تجمیعی و مشخصات گزارش (بازه، فیلترها، تولیدکننده، تاریخ جلالی).
- **خروجی PDF** برای گزارش‌های چاپی مدیریتی (شناسنامه قطار، KPI ماهانه) با سربرگ سازمانی.
- **گزارش زمان‌بندی‌شده (فاز ۴):** ارسال خودکار اکسل KPI ماهانه به ایمیل/پیام مدیران.

### ۱۱.۳ API
```
GET  /api/faults/import/template          ← دانلود قالب اکسل (با Data Validation داینامیک)
POST /api/faults/import/validate          ← آپلود ← نتیجه اعتبارسنجی ردیف‌به‌ردیف (بدون ثبت)
POST /api/faults/import/commit            ← ثبت ردیف‌های تایید شده { batchId }
POST /api/faults/import/rollback          ← حذف کل دسته ایمپورت (ادمین)
GET  /api/faults/export?format=xlsx&...   ← خروجی لیست با فیلترهای جاری
GET  /api/fault-reports/export?type=persistent|recurrence|aging|matrix|kpi|train-profile&format=xlsx|pdf
POST /api/fleet/trains/import  /  /api/fault-catalog/import   ← (همان ۴ مرحله)
```

---

## ۱۲) مهاجرت از سیستم تیکت فعلی

1. ماژول جدید `faults` **در کنار** `tickets` بالا می‌آید (بدون Breaking Change).
2. اسکریپت مهاجرت اختیاری: تیکت‌های دارای `wagonCode` به `FaultReport` منتقل می‌شوند (نگاشت status: open←submitted، in_progress←in_repair، resolved/closed←verified_closed) با کد خطای عمومی `GEN-000`.
3. تیکت برای درخواست‌های غیرناوگانی (تجهیزات ایستگاه و...) باقی می‌ماند؛ منوی «گزارش خرابی» کاربر را بر اساس نوع، به فرم درست هدایت می‌کند.
4. داده اولیه (Seed): لیست قطارهای خط ۱ + کاتالوگ استاندارد ~۱۵ دسته و ~۱۵۰ کد خطای رایج مترو (قابل ایمپورت از اکسل).

---

## ۱۳) فازبندی اجرا (Roadmap)

| فاز | محدوده | خروجی |
| :--- | :--- | :--- |
| **فاز ۱ (هسته)** | مدل‌های Prisma + Migration + Seed، CRUD ناوگان و کاتالوگ، **ایمپورت اکسل ناوگان و کاتالوگ**، ثبت فالت + گردش‌کار کامل + لاگ، کارتابل‌های سه‌گانه (وب)، **خروجی اکسل لیست فالت‌ها** | چرخه ثبت‌تا‌بستن قابل استفاده |
| **فاز ۲ (ورود سریع)** | **QR Code قطار + صفحه اسکن + چاپ برچسب**، **تشخیص هوشمند کد خطا (لایه ۱ و ۲: کلیدواژه + معنایی محلی)**، ویزارد موبایل + آفلاین، **ایمپورت گروهی فالت‌ها با پیش‌نمایش** | ثبت فالت زیر ۳۰ ثانیه |
| **فاز ۳ (هوشمندی و تحلیل)** | تشخیص تکرار، SLA + جاب نقض، auto-assign، نوتیفیکیشن SSE، ۶ گزارش + داشبورد KPI + شناسنامه قطار + **خروجی اکسل/PDF همه گزارش‌ها** | لایه مدیریتی کامل |
| **فاز ۴ (ارتقا)** | **لایه ۳ تشخیص (LLM) + Feedback Loop برای aliases**، RCA ساختاریافته، اتصال RAG (دستیار AI روی تاریخچه فالت‌ها: «سابقه ترمز قطار ۱۱۰ چیست؟»)، پیش‌بینی خرابی، گزارش زمان‌بندی‌شده | پلتفرم نگهداشت هوشمند |

---

## ۱۴) ملاحظات فنی و امنیتی

- **تست:** state machine و recurrence detection با Vitest پوشش کامل بگیرند (الگوی `guard.test.ts`).
- **ABAC:** راهبر فقط فالت‌های خودش را می‌بیند/ویرایش می‌کند (تا قبل از بازبینی)؛ تعمیرات فقط کارتابل خودش را.
- **Immutability:** پس از `verified_closed` هیچ فیلدی قابل ویرایش نیست؛ فقط `reopen` با لاگ.
- **Performance:** ایندکس‌های ترکیبی تعریف‌شده + کوئری‌های گزارش با aggregation سمت دیتابیس (نه در حافظه). برای LibSQL/Turso گزارش‌های سنگین با raw SQL بهینه می‌شوند.
- **دیتای فارسی:** اعداد فارسی در UI، ذخیره ISO/ASCII در DB، تاریخ جلالی فقط در نمایش — مطابق قوانین `CLAUDE.md`.
