# 🎓 طرح جامع سامانه آموزش پرسنل (Training & Learning Platform)

**نسخه:** 1.0 — سند طراحی و سناریو
**پروژه:** metro-line1-app — سامانه سیر و حرکت خط ۱ مترو تهران
**هدف:** تبدیل بخش آموزش فعلی (که روی پست‌های دارای آزمونِ **کلاینت‌ساید** سوار است و مدل داده اختصاصی ندارد) به یک **LMS سازمانی کامل**: دوره‌های ساخت‌یافته، مسیر یادگیری per نقش، آزمون با تصحیح **سمت سرور** و بانک سوال، گواهینامه با انقضا و بازآموزی دوره‌ای، پیشرفت آفلاین موبایل — با گزارش‌گیری انطباق (Compliance) و پنل مدیریت کاملاً بدون‌کد.

---

## ۱) وضعیت موجود و زیرساخت قابل اتکا

- **وضعیت فعلی:** `learning/exams` آزمون‌ها را از `Post.hasQuiz` می‌خواند، تایمر و نمره در state مرورگر — نه ضدتقلب است، نه گزارش‌پذیر، نه ساخت‌یافته. `learning/gallery` گالری محتواست. **مدل Course/Exam/Enrollment وجود ندارد** — این سند آن را می‌سازد.
- **قابل بازاستفاده:** `KnowledgeArticle` و `Post` (محتوای متنی/ویدئویی درس‌ها)، **Credential پروفایل** (سند پروفایل — گواهینامه با انقضا و پرچم صلاحیت)، Audience Builder (هدف‌گیری نقش)، Notification Gateway (یادآوری مهلت)، موتور فرم‌ساز (انواع سوال)، `xlsx`، گیمیفیکیشن (امتیاز تکمیل)، دستیار AI (پرسش از محتوای دوره — RAG).

---

## ۲) مفاهیم و ساختار

```
مسیر یادگیری (per نقش)  ⊃  دوره  ⊃  فصل  ⊃  درس (متن/ویدئو/PDF/آزمونک)
                                   └─ آزمون پایانی (از بانک سوال) ─▶ گواهینامه ─▶ Credential پروفایل
ثبت‌نام: خودخواسته | اجباری با مهلت | بازآموزی دوره‌ای (هر N ماه خودکار)
```

| مفهوم | توضیح |
| :--- | :--- |
| **مسیر (Path)** | زنجیره دوره‌های یک نقش: «مسیر راهبر تازه‌وارد» = ۵ دوره با ترتیب و پیش‌نیاز |
| **دوره (Course)** | واحد آموزشی با فصل/درس، آزمون، حدنصاب، گواهی |
| **بانک سوال** | سوالات مستقل از آزمون، با دسته/سختی — آزمون از بانک می‌کشد (تصادفی‌سازی) |
| **بازآموزی (Recurrence)** | «ایمنی سالانه»: گواهی ۱۲ماهه ← ۳۰ روز مانده، ثبت‌نام خودکار مجدد + یادآوری |

---

## ۳) مدل داده (Prisma)

```prisma
model Course {
  id           String  @id @default(cuid())
  key          String  @unique
  title        String
  description  String?
  coverUrl     String?
  category     String?
  status       String  @default("draft")      // draft | published | archived
  audience     Json?                           // چه نقش‌هایی ببینند/ثبت‌نام کنند
  mandatoryFor Json?                           // نقش‌های الزامی + deadlineDays
  recurrenceMonths Int?                        // بازآموزی دوره‌ای
  passScore    Int     @default(70)
  certTemplate Json?                           // قالب گواهی + credentialTypeKey (اتصال پروفایل)
  estMinutes   Int?
  sortOrder    Int     @default(0)
  createdBy    String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  chapters   Chapter[]
  enrollments Enrollment[]
}

model Chapter { id String @id @default(cuid()); courseId String; title String; sortOrder Int @default(0)
  course Course @relation(fields:[courseId], references:[id]); lessons Lesson[] }

model Lesson {
  id        String @id @default(cuid())
  chapterId String
  title     String
  kind      String                              // article | video | pdf | quiz | live_ref(جلسه حضوری)
  contentRef Json                               // {postId|articleId|videoUrl|fileUrl|quizId|meetingTypeKey}
  minSeconds Int?                               // حداقل زمان مطالعه (ضد ورق‌زدن)
  sortOrder Int @default(0)
  chapter Chapter @relation(fields:[chapterId], references:[id])
}

model LearningPath { id String @id @default(cuid()); key String @unique; title String
  roleKeys Json; courseIds Json /*با ترتیب و پیش‌نیاز*/; isActive Boolean @default(true) }

model QuestionBank {
  id        String @id @default(cuid())
  category  String                              // ایمنی/ترمز/آیین‌نامه...
  kind      String                              // single | multi | truefalse | ordering | image_choice
  text      String
  mediaUrl  String?
  options   Json                                // [{key,text,correct}]
  difficulty String @default("normal")          // easy | normal | hard
  explanation String?                           // نمایش پس از آزمون (قابل تنظیم)
  isActive  Boolean @default(true)
}

model Exam {
  id           String @id @default(cuid())
  courseId     String?
  title        String
  drawRules    Json                             // [{category,difficulty,count}] — کشیدن از بانک
  questionCount Int
  durationMin  Int
  passScore    Int
  maxAttempts  Int    @default(3)
  cooldownHrs  Int    @default(24)              // فاصله بین تلاش‌ها
  shuffle      Boolean @default(true)           // ترتیب سوال و گزینه تصادفی per نفر
  showAnswers  String  @default("after_pass")   // never | after_each | after_pass | after_close
}

model Enrollment {
  id          String   @id @default(cuid())
  userId      String
  courseId    String
  source      String   @default("self")         // self | mandatory | recurrence | admin
  deadline    DateTime?
  status      String   @default("in_progress")  // in_progress | completed | failed | expired
  progress    Json                              // {lessonId: {doneAt, seconds}}
  completedAt DateTime?
  score       Int?
  certificateId String?
  @@unique([userId, courseId, source])          // بازآموزی = رکورد جدید
  @@index([courseId, status])
  @@index([deadline])
}

model ExamAttempt {
  id        String   @id @default(cuid())
  examId    String
  userId    String
  enrollmentId String?
  questions Json                                // snapshot سوالات کشیده‌شده (بدون پاسخ صحیح سمت کلاینت!)
  answers   Json?
  score     Int?
  passed    Boolean?
  startedAt DateTime @default(now())
  submittedAt DateTime?
  meta      Json?                               // device, focusLost (ضدتقلب نرم)
  @@index([examId, userId])
}

model Certificate {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  serial    String   @unique                    // شماره گواهی + QR اعتبارسنجی
  issuedAt  DateTime @default(now())
  expiresAt DateTime?
  credentialId String?                          // ← Credential پروفایل (پرچم صلاحیت)
}
```

**تصحیح سمت سرور (اصلاح نقص فعلی):** کلاینت فقط صورت سوال/گزینه‌ها را می‌گیرد؛ پاسخ صحیح هرگز ارسال نمی‌شود؛ نمره در submit سروری محاسبه و ثبت می‌شود. تایمر سروری (startedAt + duration) — پایان مهلت = auto-submit.

---

## ۴) سناریوها

### سناریو ۱ — مسیر تازه‌وارد
راهبر جدید تایید می‌شود ← ثبت‌نام خودکار در «مسیر راهبر تازه‌وارد» (۵ دوره، مهلت ۳۰ روز) ← موبایل: درس‌ها آفلاین دانلود، ویدئو در قطار برگشت ← آزمونک هر فصل ← آزمون پایانی ۲۵ سواله از بانک (برای هر نفر ترکیب متفاوت) ← قبولی ۸۲ ← گواهی با QR ← Credential پروفایل سبز ← نوار Onboarding پروفایل کامل.

### سناریو ۲ — بازآموزی ایمنی سالانه (Compliance)
دوره «ایمنی عمومی» با `recurrenceMonths=12` و الزامی برای همه نقش‌های عملیاتی ← ۳۰ روز مانده به انقضای گواهی هر فرد: ثبت‌نام خودکار + اعلان پلکانی (Gateway) ← داشبورد انطباق مدیر ایمنی: ۹۱٪ معتبر، ۲۳ نفر در مهلت، ۴ نفر منقضی (پرچم قرمز صلاحیت — هشدار در لوحه طبق سند لوحه/پروفایل).

### سناریو ۳ — آزمون ضدتقلب نرم
سوالات و گزینه‌ها per نفر شافل؛ خروج از فوکوس صفحه ثبت (meta)؛ ۳ تلاش با فاصله ۲۴ساعته؛ پاسخ‌نامه فقط پس از قبولی ← تحلیل سوال (بخش ۵) نشان می‌دهد سوال ۷ را ۸۰٪ غلط زدند ← یا سوال بد است یا آموزش ناقص — هر دو قابل اقدام.

### سناریو ۴ — درس جلسه حضوری
درس نوع `live_ref` به «کلاس عملی ترمز» متصل است ← رزرو از سامانه جلسات (سند جلسات) ← حضور مدرس تایید می‌کند ← درس تیک می‌خورد — آموزش حضوری و آنلاین در یک پیشرفت واحد.

### سناریو ۵ — ادمین بدون‌کد دوره می‌سازد
کارشناس آموزش: دوره جدید «TSR زمستانی» ← فصل/درس با Drag & Drop (اتصال به مقاله موجود دانش + ویدئوی آپلودی) ← ۱۵ سوال به بانک (یا ایمپورت اکسل سوالات) ← قواعد کشیدن آزمون: ۱۰ سوال (۶ عادی، ۴ سخت) ← مخاطب: راهبران ← الزامی با مهلت ۱۴ روز ← انتشار — بدون یک خط کد.

---

## ۵) گزارش‌گیری (پاسخ به «قابل گزارش‌گیری»)

- **انطباق (Compliance Matrix):** نقش × دوره الزامی ← درصد معتبر/در مهلت/منقضی؛ لیست افراد معوق با یادآوری گروهی؛ خروجی اکسل برای بازرسی.
- **پیشرفت:** تکمیل per دوره/واحد/ماه، میانگین زمان تا تکمیل، قیف رهاکردن (کدام درس).
- **تحلیل آزمون (Item Analysis):** per سوال: نرخ پاسخ صحیح، تفکیک قوی/ضعیف — شناسایی سوال معیوب و شکاف آموزشی.
- **مدرس/محتوا:** امتیاز درس‌ها (👍/👎 پایان درس)، پرسش‌های پرتکرار از دستیار AI روی هر دوره (ورودی بهبود محتوا).
- **گواهینامه‌ها:** صادرشده/نزدیک‌انقضا/باطل + اعتبارسنجی عمومی با QR.
- همه با اکسل دوشیته + گزارش ماهانه خودکار به مدیران.

---

## ۶) پنل مدیریت حرفه‌ای و قابل شخصی‌سازی (Admin Console)

```
پنل مدیریت آموزش
├── 📊 داشبورد            انطباق کلی، دوره‌های فعال، آزمون‌های امروز، معوق‌ها
├── 📚 دوره‌ساز            فصل/درس Drag & Drop، اتصال به دانش/پست/ویدئو/PDF، حداقل زمان درس،
│                          پیش‌نمایش موبایل، نسخه‌بندی و انتشار
├── 🧭 مسیرهای نقش         ساخت مسیر per نقش با ترتیب و پیش‌نیاز؛ ثبت‌نام خودکار تازه‌واردها
├── 🗃️ بانک سوال            CRUD + دسته/سختی + ایمپورت اکسل سوالات (پیش‌نمایش ۴مرحله‌ای) + تحلیل سوال
├── 📝 آزمون‌ساز            قواعد کشیدن از بانک، زمان/حدنصاب/تلاش/فاصله، سیاست نمایش پاسخ، شافل
├── 🎖️ گواهینامه‌ها          قالب گواهی (لوگو/امضا/QR)، نگاشت به Credential پروفایل، ابطال
├── ⏰ الزام و بازآموزی      نقش‌های الزامی + مهلت، دوره بازآموزی، پله‌های یادآوری (Gateway)
├── 👥 ثبت‌نام و استثنا      ثبت‌نام دستی/گروهی (اکسل)، معافیت با دلیل، تمدید مهلت
├── 📈 مرکز گزارش           همه گزارش‌های بخش ۵ + اکسل + زمان‌بندی ارسال
├── 🎮 انگیزش               امتیاز گیمیفیکیشن per تکمیل/قبولی، نشان‌ها
└── 🗂️ لاگ حسابرسی          هر تغییر دوره/سوال/گواهی با before/after
```

**Permissionها:** `learning:enroll`، `learning:take-exam`، `learning:view-team` (سرشیفت: انطباق تیمش)، `learning:author` (دوره‌ساز)، `learning:question-bank`، `learning:reports`، `learning-admin:manage`.

---

## ۷) API (App Router)

```
── کاربر
GET  /api/learning/my-path                    ← مسیر و دوره‌های من + پیشرفت + مهلت‌ها
GET  /api/learning/courses/[key]              ← ساختار دوره (بدون پاسخ سوالات!)
POST /api/learning/lessons/[id]/complete      ← تیک درس (با اعتبارسنجی minSeconds سروری)
POST /api/learning/exams/[id]/start           ← کشیدن سوالات + شروع تایمر سروری
POST /api/learning/attempts/[id]/submit       ← تصحیح سروری، نمره، گواهی در قبولی
GET  /api/learning/certificates/my  |  GET /api/cert/verify/[serial]   ← اعتبارسنجی عمومی QR
GET  /api/learning/offline-pack?courseId=     ← بسته آفلاین موبایل

── سرشیفت/مدیر
GET  /api/learning/team-compliance            ← ماتریس تیم من
POST /api/learning/remind {courseId, userIds}

── ادمین
GET/POST/PATCH /api/admin/learning/courses | /paths | /questions | /exams | /certificates
POST /api/admin/learning/questions/import
GET/PATCH /api/admin/learning/rules            ← الزام/بازآموزی/یادآوری/انگیزش
GET  /api/admin/learning/reports?type=compliance|progress|item-analysis|certs  |  /export
```

---

## ۸) UI (وب + موبایل — چکیده با استانداردهای پروژه)

- **«آموزش من» (موبایل):** کارت مسیر با حلقه پیشرفت + «ادامه از جایی که بودی» (دکمه قهرمان) + مهلت‌های نزدیک با نشان زرد/قرمز؛ درس‌خوان تمام‌صفحه (متن/ویدئو با ادامه از ثانیه قبل)؛ دانلود دوره برای آفلاین با نشان ⬇؛ آزمون: یک سوال در نما، تایمر بالا، ارسال با تایید.
- **وب:** کاتالوگ با فیلتر دسته/وضعیت/الزامی + جستجو؛ صفحه دوره دوستونه (سرفصل چسبان + محتوا)؛ نمای سرشیفت: جدول انطباق تیم با یادآوری گروهی.
- گواهی: صفحه قابل چاپ A4 با QR + دکمه افزودن به پروفایل (خودکار).
- RTL، اعداد فارسی، جلالی، دارک‌مود، skeleton/خالی/خطا، لمس ≥44px.

---

## ۹) فازبندی اجرا

| فاز | محدوده | خروجی |
| :--- | :--- | :--- |
| **فاز ۱ (هسته LMS)** | مدل‌ها + دوره‌ساز + درس‌خوان وب/موبایل + Enrollment و پیشرفت + مهاجرت آزمون‌های Post به بانک سوال | آموزش ساخت‌یافته واقعی |
| **فاز ۲ (آزمون سروری)** | بانک سوال + ایمپورت اکسل، Exam/Attempt با تصحیح و تایمر سروری، شافل، سیاست پاسخ | آزمون معتبر و ضدتقلب |
| **فاز ۳ (گواهی و الزام)** | Certificate + QR + اتصال Credential، الزام/مهلت/بازآموزی خودکار + یادآوری Gateway، ماتریس انطباق | Compliance کامل |
| **فاز ۴ (تحلیل و پنل)** | Item Analysis، قیف پیشرفت، مسیرها + ثبت‌نام خودکار تازه‌وارد، بسته آفلاین، پنل کامل + گیمیفیکیشن | LMS سازمانی بدون‌کد |

---

## ۱۰) ملاحظات فنی

- **امنیت آزمون:** پاسخ صحیح فقط سرور؛ snapshot سوالات در Attempt (تغییر بانک، آزمونِ باز را نمی‌شکند)؛ rate-limit شروع آزمون؛ ثبت focus-loss صرفاً گزارشی (نه مسدودکننده — پرهیز از سخت‌گیری کاذب).
- **ویدئو:** میزبانی داخلی/آبجکت‌استوریج سازمان با URL امضاشده (سازگار با سیاست استقلال زیرساخت).
- بازآموزی با جاب روزانه (الگوی موتور انقضای پروفایل — بازاستفاده مستقیم).
- تست: تصحیح، قواعد کشیدن سوال، بازآموزی، اعتبار minSeconds — Vitest.
