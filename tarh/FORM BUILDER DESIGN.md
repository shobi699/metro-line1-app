# 📝 طرح جامع فرم‌ساز سازمانی با گردش‌کار تایید (Dynamic Form & Approval Platform)
همراه با وب و موبایل بهبود و توسعه بده
**نسخه:** 1.0 — سند طراحی و سناریو
**پروژه:** metro-line1-app — سامانه سیر و حرکت خط ۱ مترو تهران
**هدف:** یک پلتفرم فرم‌ساز فوق‌منعطف که مدیر بتواند **هر فرمی** (اضافه‌کار، مرخصی، درخواست مأموریت، گزارش حادثه، نظرسنجی و...) را بدون کدنویسی بسازد، نقش‌ها و مسیر تایید را تعریف کند، پرسنل پاسخ دهند، و خروجی گزارش/اکسل/چاپ روی وب و موبایل بگیرد.

---

## ۱) چشم‌انداز و جایگاه در پروژه

پروژه هم‌اکنون اجزای پایه‌ای دارد که این پلتفرم روی آن‌ها سوار می‌شود و آن‌ها را یکپارچه می‌کند:
- ماژول `custom-fields` (تعریف فیلد داینامیک با `CustomFieldDef`) — **هسته فرم‌ساز**.
- مسیر `admin/form-builder` (صفحه موجود که توسعه می‌یابد)..
- الگوی گردش‌کار تایید در ماژول `swap` (`SwapRequestStatus: pending→approved/rejected` با `reviewedBy`) — **الگوی مرجع برای تایید/رد**.
- ماژول `settings` برای پیکربندی بدون دیپلوی، `notifications` + SSE برای اعلان، `audit` برای ثبت تغییرات، و کتابخانه `xlsx` برای خروجی اکسل.

**مسئله‌ای که حل می‌شود:** امروز هر فرآیند درخواستی (اضافه‌کار، مرخصی، مأموریت...) نیازمند یک ماژول جداگانه و کدنویسی است. این پلتفرم یک **موتور عمومی** می‌سازد که همه این فرآیندها را به‌صورت **داده** (نه کد) تعریف و اجرا می‌کند.

> تمایز با سند فالت: سیستم فالت مخصوص خرابی ناوگان با گردش‌کار تخصصی است. این پلتفرم **عمومی** است برای هر فرم درخواست/گزارش سازمانی. هر دو از یک زیرساخت مشترک (WorkflowEngine، custom-fields، اعلان) بهره می‌برند.

---

## ۲) مفاهیم کلیدی (Domain Model)

| مفهوم | توضیح | مثال |
| :--- | :--- | :--- |
| **قالب فرم (FormTemplate)** | تعریف یک نوع فرم: فیلدها + گردش‌کار + دسترسی. ساخته‌ی مدیر. | «درخواست اضافه‌کار» |
| **نسخه قالب (FormVersion)** | هر ویرایش قالب یک نسخه؛ فرم‌های در جریان با نسخه‌ی زمان ثبت کار می‌کنند. | اضافه‌کار v3 |
| **فیلد (FormField)** | یک ورودی در فرم با نوع، اعتبارسنجی، شرط نمایش. | «تعداد ساعت»، «تاریخ» |
| **ارسال (FormSubmission)** | یک نمونه پرشده توسط پرسنل که در گردش‌کار حرکت می‌کند. | درخواست اضافه‌کار احمدی برای ۱۴۰۳/۰۵/۲۰ |
| **مرحله (Stage)** | یک گام در گردش‌کار تایید با نقش مسئول و اقدامات مجاز. | «تایید سرشیفت» |
| **اقدام (Action)** | تصمیم روی یک ارسال: تایید، رد، ارجاع، بازگشت برای اصلاح. | supervisor → approve |

---

## ۳) مدل داده (Prisma Schema)

```prisma
// ── Form Builder Core ──────────────────────────────────

enum FormSubmissionStatus {
  draft         // پیش‌نویس (هنوز ارسال نشده)
  submitted     // ارسال شده — در گردش‌کار
  in_review     // در حال بررسی یک مرحله
  needs_changes // برگشت به متقاضی برای اصلاح
  approved      // تایید نهایی
  rejected      // رد شده
  cancelled     // لغو توسط متقاضی
}

model FormTemplate {
  id           String   @id @default(cuid())
  key          String   @unique              // "overtime-request"
  title        String                        // «درخواست اضافه‌کار»
  description  String?
  category     String?                        // «منابع انسانی»، «عملیات»...
  icon         String?                        // نام آیکون
  isActive     Boolean  @default(true)
  isPublished  Boolean  @default(false)
  activeVersionId String?                     // نسخه فعال
  allowMobile  Boolean  @default(true)        // نمایش در اپ موبایل
  createdBy    String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  versions    FormVersion[]
  submissions FormSubmission[]

  @@index([category])
}

model FormVersion {
  id          String   @id @default(cuid())
  templateId  String
  version     Int
  schema      Json     // { fields:[...], layout:[...] } — تعریف کامل فیلدها و چیدمان
  workflow    Json     // { stages:[...], transitions:[...], rules:[...] } — گردش‌کار
  access      Json     // { whoCanSubmit:[roleKeys/userIds], whoCanView:[...] }
  isActive    Boolean  @default(false)
  publishedAt DateTime?
  publishedBy String?
  createdAt   DateTime @default(now())

  template    FormTemplate     @relation(fields: [templateId], references: [id])
  submissions FormSubmission[]

  @@unique([templateId, version])
}

model FormSubmission {
  id            String               @id @default(cuid())
  submissionNo  Int                  @unique @default(autoincrement()) // خوانا: R-2045
  templateId    String
  versionId     String                                // نسخه‌ی قالب هنگام ثبت (قفل)
  submitterId   String
  status        FormSubmissionStatus @default(submitted)
  currentStage  String?                               // کلید مرحله جاری در گردش‌کار
  data          Json                                  // { fieldName: value } پاسخ‌های متقاضی
  targetDate    DateTime?                             // تاریخ موضوع درخواست (مثلاً روز اضافه‌کار)
  amount        Float?                                // مقدار عددی کلیدی (ساعت/مبلغ) برای گزارش
  slaDueAt      DateTime?
  submittedAt   DateTime             @default(now())
  closedAt      DateTime?
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  template  FormTemplate    @relation(fields: [templateId], references: [id])
  version   FormVersion     @relation(fields: [versionId], references: [id])
  submitter User            @relation("FormSubmitter", fields: [submitterId], references: [id])
  steps     FormApproval[]
  logs      FormLog[]

  @@index([templateId, status])
  @@index([submitterId])
  @@index([currentStage])
  @@index([targetDate])
}

model FormApproval {
  id           String   @id @default(cuid())
  submissionId String
  stageKey     String                       // «supervisor-review»
  stageTitle   String
  assigneeId   String?                      // مسئول این مرحله (نقش یا کاربر مشخص)
  decision     String?                      // approve | reject | refer | request_changes | null(pending)
  note         String?
  decidedById  String?
  decidedAt    DateTime?
  referredTo   String?                      // اگر ارجاع داده، به کدام نقش/کاربر
  createdAt    DateTime @default(now())

  submission FormSubmission @relation(fields: [submissionId], references: [id])

  @@index([submissionId])
  @@index([assigneeId, decision])
}

model FormLog {
  id           String   @id @default(cuid())
  submissionId String
  actorId      String
  action       String                       // submitted|approved|rejected|referred|edited|commented|cancelled
  fromStage    String?
  toStage      String?
  note         String?
  changes      Json?                        // برای ویرایش‌ها
  createdAt    DateTime @default(now())

  submission FormSubmission @relation(fields: [submissionId], references: [id])

  @@index([submissionId])
}
```

> نکته طراحی: ساختار فرم و گردش‌کار به‌صورت `Json` در `FormVersion` ذخیره می‌شود (نه جدول‌های سفت). این همان چیزی است که «هر فرمی بدون کدنویسی» را ممکن می‌کند — موتور، این JSON را تفسیر و اجرا می‌کند.

---

## ۴) ساختار Schema فرم (JSON داخل FormVersion)

### ۴.۱ تعریف فیلدها (`schema.fields`)
```jsonc
{
  "fields": [
    { "name": "date", "label": "تاریخ اضافه‌کار", "type": "jalali_date", "required": true },
    { "name": "hours", "label": "تعداد ساعت", "type": "number", "required": true,
      "validation": { "min": 1, "max": 8 } },
    { "name": "shiftType", "label": "نوع شیفت", "type": "select",
      "options": ["روز", "شب", "تعطیل"], "required": true },
    { "name": "reason", "label": "علت", "type": "textarea", "required": true,
      "validation": { "maxLength": 500 } },
    { "name": "attachment", "label": "پیوست (اختیاری)", "type": "file", "required": false },
    { "name": "holidayNote", "label": "توضیح تعطیلی", "type": "text",
      "visibleWhen": { "field": "shiftType", "equals": "تعطیل" } }  // نمایش شرطی
  ],
  "layout": [ { "section": "اطلاعات درخواست", "fields": ["date","shiftType","hours"] },
              { "section": "توضیحات", "fields": ["reason","holidayNote","attachment"] } ]
}
```

**انواع فیلد پشتیبانی‌شده:** متن، متن بلند، عدد، تاریخ جلالی، ساعت، کشویی، چندانتخابی، رادیو، چک‌باکس، بله/خیر، آپلود فایل/عکس، امضای دیجیتال، انتخاب کاربر/پرسنل، انتخاب قطار/واگن، فیلد محاسباتی (formula)، جداکننده/عنوان.

**قابلیت‌های پیشرفته فیلد:** اعتبارسنجی (min/max/regex/طول)، مقدار پیش‌فرض، متن راهنما، نمایش شرطی (`visibleWhen`)، فیلد تکرارشونده (repeatable — مثل «ردیف‌های قطعات»)، و فیلد محاسباتی (مثلاً `total = hours * multiplier`).

### ۴.۲ تعریف گردش‌کار (`workflow`)
```jsonc
{
  "stages": [
    { "key": "supervisor", "title": "تایید سرشیفت", "assignBy": "role",
      "assignTo": "supervisor", "actions": ["approve","reject","request_changes","refer"],
      "sla": { "hours": 24 } },
    { "key": "hr", "title": "تایید منابع انسانی", "assignBy": "role",
      "assignTo": "hr", "actions": ["approve","reject","refer"] }
  ],
  "transitions": [
    { "on": "submit", "to": "supervisor" },
    { "from": "supervisor", "on": "approve", "to": "hr" },
    { "from": "supervisor", "on": "reject", "to": "END_REJECTED" },
    { "from": "supervisor", "on": "request_changes", "to": "BACK_TO_SUBMITTER" },
    { "from": "hr", "on": "approve", "to": "END_APPROVED" }
  ],
  "rules": [
    { "if": { "field": "hours", "gt": 4 }, "then": { "addStage": "manager" } }  // شرطی: اضافه‌کار >۴ ساعت نیاز به تایید مدیر
  ]
}
```

### ۴.۳ دسترسی (`access`)
```jsonc
{
  "whoCanSubmit": ["operator", "technician"],   // کدام نقش‌ها می‌توانند ثبت کنند
  "whoCanView":   ["supervisor", "hr", "manager"],
  "referableRoles": ["safety", "finance", "manager"]  // نقش‌هایی که می‌شود به آن‌ها ارجاع داد
}
```

---

## ۵) گردش‌کار تایید و ارجاع (Approval Flow)

```
        متقاضی فرم را پر و ارسال می‌کند
                    │  status: submitted
                    ▼
        ┌───────────────────────┐   request_changes   ┌──────────────┐
        │  مرحله ۱: سرشیفت      │ ───────────────────▶ │ needs_changes│─┐
        │  approve/reject/refer  │                      └──────────────┘ │ متقاضی اصلاح
        └───┬────────┬─────┬────┘                                        │ و دوباره ارسال
            │        │     │ refer (ارجاع به نقش خاص که مدیر تعریف کرده) │
            │        │     ▼                                            ▼
            │        │  ┌──────────────────┐  پاسخ نقش ارجاعی           برمی‌گردد
            │        │  │ مرحله ارجاعی      │ ────────────────────────▶ به مرحله مبدأ
            │        │  │ (مثلاً ایمنی/مالی)│
            │        │  └──────────────────┘
            │        │ reject
            │        ▼
            │   ┌──────────┐
            │   │ rejected │ (پایان، با ثبت دلیل)
            │   └──────────┘
            ▼ approve
        ┌───────────────────────┐
        │  مرحله ۲: منابع انسانی │  ← اگر قانون شرطی فعال شد، مرحله «مدیر» تزریق می‌شود
        │  approve/reject        │
        └───────────┬───────────┘
                    ▼ approve نهایی
              ┌──────────┐
              │ approved │ (پایان — اطلاع به متقاضی + ثبت در گزارش‌ها)
              └──────────┘
```

**قواعد کلیدی:**
- **ارجاع (Refer):** مسئول یک مرحله می‌تواند فرم را به نقش خاصی که مدیر در `referableRoles` تعریف کرده ارجاع دهد (مثلاً سرشیفت درخواست را برای بررسی به «ایمنی» می‌فرستد). پس از پاسخ، به مرحله مبدأ برمی‌گردد.
- **مراحل شرطی:** موتور قواعد (`rules`) می‌تواند بر اساس مقدار فیلد، مرحله‌ای اضافه/حذف کند (اضافه‌کار >۴ ساعت ← تایید مدیر لازم است).
- **تایید موازی یا سری:** یک مرحله می‌تواند «همه باید تایید کنند» یا «هر کدام کافی است» باشد (تنظیم `mode: all|any`).
- **SLA و تشدید:** هر مرحله مهلت دارد؛ نقض ← اعلان تشدید به مدیر (بازاستفاده از جاب SLA سند فالت).
- **حسابرسی کامل:** هر اقدام در `FormLog` و `FormApproval` با before/after ثبت می‌شود.

---

## ۶) سناریوهای کاربری

### سناریو ۱ — ساخت فرم اضافه‌کار توسط مدیر (بدون کد)
مدیر وارد پنل ← «فرم جدید» ← از قالب آماده «درخواست» شروع می‌کند. با Drag & Drop فیلدها را می‌چیند: تاریخ، نوع شیفت، ساعت (۱ تا ۸)، علت. سپس گردش‌کار: مرحله ۱ «سرشیفت»، مرحله ۲ «منابع انسانی». یک قانون شرطی می‌گذارد: «اگر ساعت > ۴، مرحله مدیر اضافه شود». دسترسی: «راهبران می‌توانند ثبت کنند». **انتشار** می‌زند. فرم بلافاصله در وب و موبایل راهبران ظاهر می‌شود.

### سناریو ۲ — ثبت درخواست توسط راهبر (موبایل)
راهبر احمدی در اپ ← «فرم‌ها» ← «درخواست اضافه‌کار» ← تاریخ ۱۴۰۳/۰۵/۲۰، شیفت شب، ۶ ساعت، علت. چون ۶ > ۴ بود، سیستم خودکار مرحله مدیر را به مسیر اضافه می‌کند. ارسال ← شماره `R-2045` و وضعیت «در انتظار تایید سرشیفت». اعلان SSE به سرشیفت کشیک می‌رود.

### سناریو ۳ — تایید، ارجاع و رد
سرشیفت رضایی در کارتابل ← درخواست R-2045 را می‌بیند. چون مطمئن نیست بودجه اضافه‌کار مانده یا نه، **ارجاع** می‌دهد به «مالی». کارشناس مالی تایید موجودی بودجه می‌دهد ← برمی‌گردد به سرشیفت ← سرشیفت **تایید** ← می‌رود به منابع انسانی ← مدیر (چون >۴ ساعت) ← تایید نهایی. احمدی اعلان «تایید شد» می‌گیرد.

### سناریو ۴ — بازگشت برای اصلاح
راهبر تاریخ را اشتباه زده. سرشیفت «نیاز به اصلاح» با پیام «تاریخ با شیفت شما نمی‌خواند» ← وضعیت `needs_changes` ← راهبر اعلان، اصلاح و دوباره ارسال ← برمی‌گردد به سرشیفت.

### سناریو ۵ — گزارش‌گیری و خروجی
مدیر منابع انسانی در پایان ماه ← گزارش «اضافه‌کار» ← فیلتر: مرداد ۱۴۰۳، وضعیت تایید‌شده ← جدول همه درخواست‌ها با جمع ساعت به تفکیک پرسنل ← **خروجی اکسل** (شیت داده + شیت خلاصه با جمع per نفر) و **چاپ** برای امضای فیزیکی.

---

## ۷) گزارش‌گیری، اکسل و چاپ

هر قالب فرم به‌صورت خودکار یک **گزارش‌ساز** دارد (بدون کد اضافه):
- **لیست ارسال‌ها** با فیلتر: بازه تاریخ جلالی، وضعیت، متقاضی، مرحله جاری، و **هر فیلد فرم** (مثلاً فیلتر روی «نوع شیفت»).
- **تجمیع‌ها:** جمع/میانگین فیلدهای عددی (مثلاً مجموع ساعت اضافه‌کار per پرسنل/ماه)، شمارش بر اساس وضعیت، نمودار روند.
- **خروجی اکسل:** شیت ۱ = داده کامل با هدر فارسی، فریز و فیلتر خودکار، رنگ وضعیت؛ شیت ۲ = خلاصه تجمیعی + مشخصات گزارش (فیلترها، تاریخ، تولیدکننده). با کتابخانه `xlsx` موجود.
- **چاپ:** نمای چاپی هر ارسال (فرم پرشده + تاریخچه تاییدها + امضاها) با سربرگ سازمانی — مناسب بایگانی. و چاپ لیست گزارش.
- **خروجی PDF** برای فرم‌های نیازمند امضای رسمی.

API:
```
GET /api/forms/[key]/report?from=&to=&status=&<field>=   ← لیست + تجمیع
GET /api/forms/[key]/export?format=xlsx|pdf&...          ← خروجی با فیلتر جاری
GET /api/forms/submissions/[id]/print                    ← نمای چاپی یک ارسال
```

---

## ۸) طراحی UI (وب + موبایل حرفه‌ای)

### ۸.۱ سازنده فرم (مدیر — وب)
سه‌ستونه: **پالت فیلدها** (چپ) | **بوم فرم** با Drag & Drop و پیش‌نمایش زنده (وسط) | **تنظیمات فیلد/فرم** (راست). تب‌های بالا: «فیلدها»، «گردش‌کار» (طراح بصری مراحل)، «دسترسی»، «اعلان‌ها»، «پیش‌نمایش». دکمه «انتشار» با نسخه‌بندی.

### ۸.۲ پرکردن فرم (پرسنل — وب و موبایل)
- **موبایل:** فرم تک‌ستونه، فیلدهای لمسی بزرگ (≥44px)، تاریخ‌یاب جلالی، آپلود از دوربین، ذخیره **پیش‌نویس آفلاین** و ارسال هنگام اتصال. اعتبارسنجی زنده.
- **وب:** همان فرم با چیدمان چندستونه بر اساس `layout`.
- فرم فقط اگر `allowMobile=true` باشد در اپ ظاهر می‌شود (کنترل مدیر).

### ۸.۳ کارتابل تاییدها (مسئولین — وب و موبایل)
لیست «در انتظار من» با تب وضعیت، نشان SLA. باز کردن ← نمای فرم پرشده + تاریخچه + دکمه‌های تایید/رد/اصلاح/ارجاع (با انتخاب نقش ارجاعی). اقدام گروهی (تایید چندتایی) برای حجم بالا.

### ۸.۴ صفحه «فرم‌های من» (پرسنل)
همه ارسال‌های کاربر با وضعیت لحظه‌ای (کجای گردش‌کار است، منتظر چه کسی)، امکان پیگیری، لغو، و مشاهده تاریخچه.

همه صفحات: RTL، فونت Vazirmatn، اعداد فارسی، دارک‌مود، حالت خالی/بارگذاری/خطا — مطابق استانداردهای UI پروژه.

---

## ۹) پنل مدیریت حرفه‌ای و قابل شخصی‌سازی (Admin Console)

فلسفه: **همه‌چیز داده‌محور و بدون کدنویسی.** مدیر کل چرخه عمر فرم‌ها را از اینجا کنترل می‌کند.

### ۹.۱ ساختار پنل
```
پنل مدیریت فرم‌ها
├── 📊 داشبورد            آمار فرم‌ها، ارسال‌های در جریان، گلوگاه‌های تایید، نقض SLA
├── 📄 قالب‌های فرم        لیست/ساخت/ویرایش/نسخه‌بندی/فعال‌سازی همه فرم‌ها
├── 🧩 سازنده فرم         فیلدساز Drag & Drop + کتابخانه فیلد
├── 🔀 طراح گردش‌کار      مراحل، گذارها، قواعد شرطی، ارجاع، تایید موازی/سری
├── 👥 نقش‌ها و دسترسی     نقش سفارشی، چه کسی ثبت/می‌بیند/تایید می‌کند، نقش‌های ارجاعی
├── ⏱️ SLA و تشدید        مهلت هر مرحله، قواعد تشدید چندپله‌ای
├── 🔔 اعلان‌ها           قالب پیام + کانال (SSE/ایمیل/SMS) + تریگر هر رویداد
├── 🧮 قالب‌های آماده      Presetها: اضافه‌کار، مرخصی، مأموریت، حادثه، نظرسنجی...
├── 📊 گزارش‌ساز          تعریف گزارش سفارشی و تجمیع per فرم
├── 🎨 ظاهر و برندینگ     رنگ وضعیت، آیکون دسته، سربرگ چاپ
└── 🗂️ لاگ حسابرسی        تاریخچه کامل تغییرات و اقدامات
```

### ۹.۲ طراح گردش‌کار بصری
- افزودن/حذف/تغییرنام مراحل با Drag & Drop.
- برای هر مرحله: نقش مسئول، اقدامات مجاز (تایید/رد/اصلاح/ارجاع)، SLA، حالت تایید (همه/هرکدام).
- **قواعد شرطی بصری:** «اگر [فیلد] [شرط] [مقدار]، آنگاه [افزودن مرحله/تغییر مسیر]».
- **نقش‌های ارجاعی:** مدیر تعریف می‌کند فرم به کدام نقش‌ها قابل ارجاع است.
- **نسخه‌بندی + Dry-run:** پیش‌نمایش و تست مسیر با داده فرضی قبل از انتشار؛ فرم‌های در جریان نمی‌شکنند.

### ۹.۳ کتابخانه قالب‌های آماده (Presets)
مدیر می‌تواند با یک کلیک قالب آماده بارگذاری و سپس سفارشی کند:
درخواست اضافه‌کار، درخواست مرخصی، درخواست مأموریت، تعویض شیفت، گزارش حادثه/نزدیک به حادثه، درخواست تجهیزات، فرم بازخورد/شکایت، چک‌لیست بازرسی، نظرسنجی.

### ۹.۴ اصول پیاده‌سازی
- یک `FormEngine` واحد (`src/server/modules/forms/engine.ts`) که `schema` و `workflow` را از `FormVersion` می‌خواند و اجرا می‌کند — کد فقط مفسر است.
- بازاستفاده حداکثری: `custom-fields` برای انواع فیلد، الگوی `swap` برای تایید/رد، `notifications`+SSE برای اعلان، `audit` برای لاگ، `xlsx` برای خروجی، `settings` برای پیکربندی.
- هر تغییر پیکربندی نیازمند permission `forms-admin:manage` و ثبت در `AuditLog`.
- **Multi-tenant آماده:** چون همه‌چیز per-template است، هر واحد سازمانی می‌تواند فرم‌های خودش را داشته باشد.

### ۹.۵ Permissionهای جدید
```
resource: 'forms'
  forms:submit          ثبت فرم
  forms:view-own        مشاهده فرم‌های خود
  forms:review          تایید/رد/ارجاع در مرحله
  forms:view-all        مشاهده همه ارسال‌ها
  forms:report          گزارش و خروجی
resource: 'forms-admin'
  forms-admin:manage    ساخت/ویرایش قالب، گردش‌کار، دسترسی، اعلان
```

---

## ۱۰) API (App Router)

```
── Public/User
GET  /api/forms                          ← لیست فرم‌های قابل‌دسترس کاربر (وب/موبایل)
GET  /api/forms/[key]                     ← تعریف فرم فعال برای رندر
POST /api/forms/[key]/submit              ← ثبت ارسال جدید
GET  /api/forms/submissions/my            ← «فرم‌های من»
GET  /api/forms/submissions/[id]          ← جزئیات + تاریخچه
PATCH /api/forms/submissions/[id]         ← اصلاح (در حالت needs_changes)
POST /api/forms/submissions/[id]/cancel   ← لغو توسط متقاضی
POST /api/forms/submissions/[id]/action   ← { decision: approve|reject|request_changes|refer, note, referTo }
GET  /api/forms/inbox                      ← کارتابل «در انتظار من»

── Reports
GET  /api/forms/[key]/report
GET  /api/forms/[key]/export?format=xlsx|pdf
GET  /api/forms/submissions/[id]/print

── Admin
GET/POST      /api/admin/forms                     ← لیست/ساخت قالب
GET/PATCH     /api/admin/forms/[id]
POST          /api/admin/forms/[id]/versions       ← نسخه جدید
POST          /api/admin/forms/[id]/publish        ← انتشار نسخه
POST          /api/admin/forms/[id]/simulate       ← Dry-run گردش‌کار
GET           /api/admin/forms/presets             ← قالب‌های آماده
GET/PATCH     /api/admin/forms/config/notifications
GET/PATCH     /api/admin/forms/config/sla
GET/POST      /api/admin/roles                      ← نقش سفارشی (مشترک با سند فالت)
```

---

## ۱۱) فازبندی اجرا

| فاز | محدوده | خروجی |
| :--- | :--- | :--- |
| **فاز ۱ (هسته فرم)** | مدل‌های Prisma، سازنده فیلد (روی custom-fields)، ثبت و نمایش فرم ساده تک‌مرحله‌ای، «فرم‌های من» | ساخت و پرکردن فرم بدون گردش‌کار |
| **فاز ۲ (گردش‌کار)** | موتور گردش‌کار (مراحل/گذار/ارجاع)، کارتابل تایید، تایید/رد/اصلاح/ارجاع، لاگ کامل، اعلان SSE | چرخه تایید کامل — مثال: اضافه‌کار |
| **فاز ۳ (هوشمندی)** | قواعد شرطی، SLA + تشدید، تایید موازی/سری، نسخه‌بندی + Dry-run، موبایل + آفلاین | گردش‌کار پیشرفته و منعطف |
| **فاز ۴ (گزارش و پنل)** | گزارش‌ساز per فرم + خروجی اکسل/PDF + چاپ، پنل مدیریت کامل، Presetها، داشبورد | پلتفرم کامل بدون‌کد |

---

## ۱۲) ملاحظات فنی

- **تست:** موتور گردش‌کار و ارزیابی قواعد شرطی با Vitest پوشش کامل (الگوی `swap/service.test.ts`).
- **یکپارچگی داده:** ارسال‌ها به نسخه قالب قفل می‌شوند؛ تغییر قالب، ارسال‌های قبلی را نمی‌شکند.
- **Immutability:** پس از `approved/rejected`، فرم قفل است؛ فقط با اقدام مجاز قابل تغییر.
- **Performance:** ایندکس روی وضعیت/مرحله/تاریخ؛ تجمیع گزارش سمت DB.
- **دیتای فارسی:** اعداد فارسی و تاریخ جلالی در UI، ذخیره ISO در DB — مطابق `CLAUDE.md`.
- **اشتراک با سند فالت:** `WorkflowEngine`، مدل نقش/دسترسی، اعلان و SLA بین دو سیستم مشترک‌اند تا از دوباره‌کاری جلوگیری شود.
