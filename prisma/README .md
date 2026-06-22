🚇 سامانه سیر و حرکت خط ۱ مترو
اپ داخلی اطلاع‌رسانی و مدیریت پرسنل سیر و حرکت خط ۱ مترو — وب رسپانسیو + پشتیبانی RTL و فارسی.

این مخزن برای ساخت با Claude Code آماده شده است. ابتدا AGENTS.md، DESIGN.md، PROMPT.md و RULES.md را بخوانید، سپس فازها را به ترتیب اجرا کنید.

✨ ماژول‌های فاز ۱
ماژول	شرح
احراز هویت و RBAC	ثبت‌نام، ورود، تأیید مدیر، چهار نقش (مدیر کل/مدیر/راهبر/پرسنل)
دفتر تلفن	فهرست پرسنل با جستجو، فیلدهای پویا، ورود/خروج اکسل
لوحه و شیفت	بارگذاری و استخراج لوحه، تقویم شیفت جلالی
جابجایی شیفت	موتور قوانین + جریان تأیید مدیر
بخشنامه ایمنی	تأییدیه مطالعهٔ اجباری + داشبورد درصد مطالعه
تیکتینگ	گزارش خرابی تصویری با حاشیه‌نویسی
🧱 پشتهٔ فناوری
Next.js (App Router) + TypeScript (strict)
Route Handlers برای API (بدون بک‌اند جدا)
Prisma + PostgreSQL
Tailwind CSS v4 (CSS-first، بدون فایل config) + shadcn/ui (new-york)
next-themes (دارک پیش‌فرض) + Zustand (state) + Zod (اعتبارسنجی)
JWT (access + refresh) + bcrypt + RBAC
SheetJS برای اکسل، Vazirmatn + RTL + تقویم جلالی، اعداد fa-IR
مدیر بسته: npm
🚀 راه‌اندازی سریع
# ۱) نصب وابستگی‌ها
npm install

# ۲) تنظیم متغیرهای محیطی
cp .env.example .env
# مقادیر DATABASE_URL و JWT_*_SECRET را پر کنید

# ۳) ساخت دیتابیس و اجرای مهاجرت‌ها
npx prisma migrate dev --name init

# ۴) دادهٔ اولیه (نقش‌ها + مدیر کل + دادهٔ نمونه)
npm run db:seed

# ۵) اجرای حالت توسعه
npm run dev
# http://localhost:3000
ساخت تولید
npm run build
npm run start
🔑 ورود اولیه
پس از seed با حساب مدیر کل وارد شوید (از .env):

کد پرسنلی: مقدار SUPERADMIN_PERSONNEL_CODE
رمز: مقدار SUPERADMIN_PASSWORD
بلافاصله پس از اولین ورود رمز را تغییر دهید.

📁 ساختار پوشه‌ها
metro-line1/
├── prisma/
│   ├── schema.prisma      # مدل‌های فاز ۱
│   └── seed.ts            # نقش‌ها + مدیر کل + دادهٔ نمونه
├── src/
│   ├── app/
│   │   ├── (auth)/        # ورود / ثبت‌نام
│   │   ├── (app)/         # صفحات داخل اپ (نقش‌محور)
│   │   └── api/           # Route Handlers
│   ├── components/        # shadcn/ui و کامپوننت‌های مشترک
│   ├── lib/
│   │   ├── auth/          # jwt، bcrypt، guard نقش
│   │   ├── rbac.ts        # ماتریس دسترسی
│   │   ├── fa.ts          # ابزار فارسی/جلالی/اعداد
│   │   └── prisma.ts      # کلاینت Prisma
│   └── store/             # Zustand
├── public/uploads/        # فایل‌های آپلودی (لوحه/عکس)
├── .env.example
├── AGENTS.md  DESIGN.md  PROMPT.md  RULES.md
└── README.md
👥 نقش‌ها و دسترسی (RBAC)
نقش	توضیح
SUPERADMIN	مدیر کل — کنترل کامل، تأیید مدیران
MANAGER	مدیر — تأیید پرسنل، جابجایی شیفت، بخشنامه
SUPERVISOR	راهبر — مدیریت لوحه و تیکت در حوزهٔ خود
STAFF	پرسنل — مشاهدهٔ شیفت، ثبت درخواست/تیکت، تأیید بخشنامه
حساب جدید با وضعیت PENDING ساخته می‌شود و تا تأیید مدیر اجازهٔ ورود ندارد.

🧪 اسکریپت‌های npm
npm run dev          # توسعه
npm run build        # ساخت تولید
npm run start        # اجرای تولید
npm run lint         # بررسی لینت
npm run db:seed      # دادهٔ اولیه
npx prisma studio    # مرور دیتابیس
✅ معیارهای پذیرش فاز ۱
npm run build بدون خطا پاس می‌شود.
اپ در حالت dark و جهت RTL درست رندر می‌شود.
حساب PENDING نمی‌تواند وارد شود؛ پس از تأیید مدیر فعال می‌شود.
رسید مطالعهٔ بخشنامه غیرقابل‌تغییر ذخیره می‌شود.
نقض قوانین جابجایی شیفت با دلیل شفاف مسدود می‌شود.
ورود/خروج اکسل دفتر تلفن با گزارش خطای ردیفی کار می‌کند.
