# فرانت موبایل جدید (Light + مدرن + تقویم شیفت حرفه‌ای) — خط ۱ مترو

<aside>
📘

[**DESIGN.md](http://DESIGN.md) — metro-line1-app Design System.** مرجع یگانه طراحی. قبل از نوشتن هر کامپوننت، CSS یا class این را بخوان. مقادیر را خودت اختراع نکن.

</aside>

<aside>
🌓

**تصمیم تم پیش‌فرض (حل تناقض spec):** پیش‌فرض = **هماهنگ با سیستم (system)**. هر دو حالت Light و Dark باید کامل پشتیبانی شوند؛ در نبود ترجیح سیستم، fallback = Light. جملات «dark-first» در بخش ۱ منسوخ است و فقط حس بصری (control-room calm) را توصیف می‌کند، نه حالت پیش‌فرض را.

</aside>

## متا و توکن‌ها (Design Tokens — YAML)

```yaml
name: Tehran Metro Staff System
defaultTheme: system   # light | dark | system  — fallback: light
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#5d3f3c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#926f6b'
  outline-variant: '#e6bdb8'
  surface-tint: '#c00014'
  primary: '#ae0011'
  on-primary: '#ffffff'
  primary-container: '#d71920'
  on-primary-container: '#ffece9'
  inverse-primary: '#ffb4ab'
  secondary: '#575e70'
  on-secondary: '#ffffff'
  secondary-container: '#d9dff5'
  on-secondary-container: '#5c6274'
  tertiary: '#5d5254'
  on-tertiary: '#ffffff'
  tertiary-container: '#766a6c'
  on-tertiary-container: '#fdecee'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000d'
  secondary-fixed: '#dce2f7'
  secondary-fixed-dim: '#c0c6db'
  on-secondary-fixed: '#141b2b'
  on-secondary-fixed-variant: '#404758'
  tertiary-fixed: '#efdfe1'
  tertiary-fixed-dim: '#d2c3c5'
  on-tertiary-fixed: '#22191b'
  on-tertiary-fixed-variant: '#4f4446'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  numeric-hero:  { fontFamily: Vazirmatn, fontSize: 26px, fontWeight: '800', lineHeight: 36px }
  screen-title:  { fontFamily: Vazirmatn, fontSize: 22px, fontWeight: '700', lineHeight: 32px }
  section-title: { fontFamily: Vazirmatn, fontSize: 17px, fontWeight: '700', lineHeight: 26px }
  card-title:    { fontFamily: Vazirmatn, fontSize: 15px, fontWeight: '600', lineHeight: 24px }
  body-md:       { fontFamily: Vazirmatn, fontSize: 14px, fontWeight: '400', lineHeight: 22px }
  caption-sm:    { fontFamily: Vazirmatn, fontSize: 12px, fontWeight: '500', lineHeight: 18px }
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 20px
  element-gap: 12px
  section-padding: 24px
  stack-space: 16px
```

## Brand & Style

این سیستم طراحی برای محیط پر‌ریسک و پرسرعت پرسنل حمل‌ونقل شهری مهندسی شده. اولویت با زیبایی‌شناسی **Modern Corporate** است، با تمرکز بر وضوح اطلاعات پرتراکم و کاربردی پریمیوم. حس کاربر باید اطمینان و اعتبار رسمی باشد. UI تعادل بین «قرمز خط ۱» مقتدر و پس‌زمینهٔ آبی روشن آرام را حفظ می‌کند تا خستگی ذهنی در شیفت‌های طولانی کم شود. سبک تمیز و کارکردی، با ارتفاع نرم (soft elevation) به‌جای خطوط تیز.

## Colors

رویکرد **Light-First**. **Primary Red** هویت اصلی است، مخصوص اکشن‌های کلیدی، نقاط تماس برند و شناسهٔ خط ۱. پس‌زمینهٔ اپ (#F6F8FB) بوم خنکی است که کارت‌های سطح اصلی (#FFFFFF) را با کمترین سایه برجسته می‌کند. رنگ‌های عملیاتی (روز/شب/آف) برای تشخیص فوری نوع شیفت در تقویم جلالی و داشبورد کاملاً متمایزند. سلسله‌مراتب متن: اصلی #111827 ، ثانویه #64748B.

## Typography

فقط **Vazirmatn**، بهینه برای خوانایی متن فارسی RTL.

- **جهت:** تمام چیدمان‌ها و ترازها راست‌به‌چپ.
- **اعداد:** گلیف فارسی برای متن؛ اعداد لاتین فقط برای کدهای فنی/عملیاتی که بک‌اند قدیمی الزام کند. در سبک Numeric Hero گلیف فارسی ترجیح دارد.
- **سلسله‌مراتب:** `Numeric Hero` برای زمان ورود و ساعات شیفت؛ `Screen Title` برای هدرهای ناوبری؛ `Caption` برای متن چیپ‌ها و فوتر.

## Layout & Spacing

فلسفهٔ **Fluid Mobile Grid**.

- **حاشیه:** ۲۰px افقی ثابت برای لبهٔ همهٔ صفحات.
- **گاتر:** فاصلهٔ ۱۲px بین کارت‌ها در استک عمودی.
- **هدف لمس:** حداقل ۴۸×۴۸px برای همهٔ عناصر تعاملی.
- **تراز:** محتوا اکیداً RTL. در دکمه‌ها آیکون سمت چپ لیبل، در ردیف‌های لیست آیکون سمت راست.

## Elevation & Depth

عمق با **Tonal Layering** و سایه‌های نرم و محیطی.

- **Level 0 (پس‌زمینه):** #F6F8FB (تخت).
- **Level 1 (کارت/سطح):** #FFFFFF با سایهٔ مشکی ۴٪، blur ۱۰px، Y-offset ۲px.
- **Level 2 (اکشن شناور/باتم شیت فعال):** #FFFFFF با سایهٔ مشکی ۸٪، blur ۲۰px، Y-offset ۴px.
- **حاشیه:** از خطوط سنگین پرهیز کن. فقط جایی که دو سطح سفید به هم می‌رسند (مثلاً مودال روی کارت) از حاشیهٔ ۱px با #E2E8F0 استفاده کن.

## Shapes

- **عناصر تعاملی:** دکمه و اینپوت با **Medium Radius (16px)**.
- **کانتینرهای اصلی:** کارت داشبورد با **Card Radius (20px)**.
- **اورلی‌ها:** باتم شیت با **Top Radius (28px)** فقط گوشه‌های بالا.
- **کامپوننت‌های کوچک:** چیپ و تگ با **Small Radius (10px)**.

## Components (خلاصهٔ بصری)

- **Shift Hero Cards:** کارت پرکنتراست با تایپوگرافی `Numeric Hero` برای زمان. پیل عمودی رنگی روی لبهٔ راست (RTL) برای نوع شیفت (روز/شب).
- **Segmented Controls:** پس‌زمینهٔ #F1F5F9 با سطح سفید لغزنده برای حالت فعال.
- **Bottom Navigation:** نوار توپر #FFFFFF، آیکون فعال `Primary Red` و غیرفعال `Text Secondary`. بدون لیبل برای ظاهر تمیز، یا `Caption` کوچک اگر دسترس‌پذیری لازم کرد.
- **Jalali Calendar Cells:** خانهٔ مربعی با `Small Radius`. روز جاری با پس‌زمینهٔ `Primary Red Soft` و متن `Primary Red`.
- **Action Chips:** برای فیلتر. غیرفعال: پس‌زمینهٔ خاکستری؛ فعال: `Primary Red` با متن سفید.
- **Settings Rows:** تمام‌عرض، پس‌زمینهٔ `Main Surface`، آیکون سمت راست و chevron سمت چپ (RTL).
- **Buttons:** Primary = `Primary Red` با متن سفید؛ Secondary = `Primary Red Soft` با متن `Primary Red`.

---

## ۰) Stack Constraints

- **Tailwind CSS v4** — پیکربندی CSS-first با `@theme inline` داخل `globals.css`. **بدون** `tailwind.config.ts`.
- **shadcn/ui** — سبک new-york، بیس neutral، CSS variables فعال.
- **Dark mode** — next-themes، class-based، `defaultTheme="system"` (fallback: light).
- **Direction** — `dir="rtl"` روی `<html>`. فقط logical properties.
- **Font** — Vazirmatn (فارسی) با next/font (local) یا @fontsource/vazirmatn. Mono: Vazirmatn Code / system mono برای IDها.
- **Icons** — فقط Lucide React.
- **cn()** — از `@/lib/utils` (clsx + tailwind-merge).

## ۱) Design Direction

- **Aesthetic:** Operational + clean. Control-room calm، خوانایی بالا.
- **Personality:** قابل‌اعتماد، سریع، بدون تزئین. این یک ابزار ایمنی‌محور است.
- **Brand:** خط ۱ مترو تهران = قرمز. قرمز رنگ تأکید/برند است، عامدانه — نه تزئینی.
- **Rule:** اگر عنصری کارکردی ندارد، حذفش کن.

<aside>
⚠️

در نسخهٔ خام این بخش «dark-first» آمده بود؛ طبق تصمیم پروژه پیش‌فرض **system** است و هر دو تم باید کامل پشتیبانی شوند.

</aside>

## ۲) Color System — oklch

فرمت: `oklch(L C H)` — Lightness ۰–۱، Chroma ۰–۰٫۴، Hue ۰–۳۶۰.

```css
/* ── Neutrals (cool gray) ── */
--color-neutral-50:   oklch(0.98 0.002 247);
--color-neutral-100:  oklch(0.95 0.003 247);
--color-neutral-200:  oklch(0.90 0.004 247);
--color-neutral-300:  oklch(0.82 0.005 247);
--color-neutral-400:  oklch(0.65 0.008 247);
--color-neutral-500:  oklch(0.50 0.010 247);
--color-neutral-600:  oklch(0.38 0.008 247);
--color-neutral-700:  oklch(0.26 0.006 247);
--color-neutral-800:  oklch(0.18 0.005 247);
--color-neutral-900:  oklch(0.12 0.004 247);
--color-neutral-950:  oklch(0.08 0.003 247);

/* ── Brand / Accent (Line 1 Red) ── */
--color-brand-300:    oklch(0.72 0.15 27);
--color-brand-400:    oklch(0.63 0.19 27);
--color-brand-500:    oklch(0.55 0.22 27);   /* base — Line 1 red */
--color-brand-600:    oklch(0.48 0.21 27);
--color-brand-700:    oklch(0.41 0.18 27);

/* ── Critical / SOS (deep red) ── */
--color-critical-500: oklch(0.50 0.25 25);
--color-critical-600: oklch(0.43 0.23 25);

/* ── Warning (amber) ── */
--color-warning-400:  oklch(0.80 0.14 80);
--color-warning-500:  oklch(0.72 0.16 75);

/* ── Success (green) ── */
--color-success-400:  oklch(0.68 0.17 145);
--color-success-500:  oklch(0.58 0.19 145);

/* ── Info (blue) ── */
--color-info-500:     oklch(0.60 0.16 240);
```

## ۳) Semantic Tokens → globals.css

این بلوک را در `src/app/globals.css` کپی کن:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* ── Radius ── */
  --radius-sm:  calc(var(--radius) - 4px);
  --radius-md:  calc(var(--radius) - 2px);
  --radius-lg:  var(--radius);
  --radius-xl:  calc(var(--radius) + 4px);

  /* ── Semantic color aliases ── */
  --color-background:          var(--background);
  --color-background-subtle:   var(--background-subtle);
  --color-foreground:          var(--foreground);
  --color-foreground-muted:    var(--foreground-muted);
  --color-surface:             var(--surface);
  --color-surface-hover:       var(--surface-hover);
  --color-border:              var(--border);
  --color-border-subtle:       var(--border-subtle);
  --color-accent:              var(--accent);
  --color-accent-hover:        var(--accent-hover);
  --color-accent-foreground:   var(--accent-foreground);
  --color-critical:            var(--critical);
  --color-critical-foreground: var(--critical-foreground);
  --color-warning:             var(--warning);
  --color-success:             var(--success);
  --color-info:                var(--info);
  --color-ring:                var(--ring);

  --font-sans: "Vazirmatn", ui-sans-serif, system-ui, sans-serif;
}

/* ── Light mode ( fallback تم system ) ── */
:root {
  --radius: 0.5rem;
  --background:          oklch(0.98 0.002 247);
  --background-subtle:   oklch(0.94 0.003 247);
  --foreground:          oklch(0.12 0.004 247);
  --foreground-muted:    oklch(0.50 0.010 247);
  --surface:             oklch(1.00 0 0);
  --surface-hover:       oklch(0.96 0.002 247);
  --border:              oklch(0.88 0.004 247);
  --border-subtle:       oklch(0.93 0.003 247);
  --accent:              oklch(0.55 0.22 27);
  --accent-hover:        oklch(0.48 0.21 27);
  --accent-foreground:   oklch(1.00 0 0);
  --critical:            oklch(0.50 0.25 25);
  --critical-foreground: oklch(1.00 0 0);
  --warning:             oklch(0.72 0.16 75);
  --success:             oklch(0.58 0.19 145);
  --info:                oklch(0.60 0.16 240);
  --ring:                oklch(0.55 0.22 27);
}

/* ── Dark mode ( وقتی سیستم dark است یا کاربر انتخاب کند ) ── */
.dark {
  --background:          oklch(0.13 0.004 247);
  --background-subtle:   oklch(0.17 0.005 247);
  --foreground:          oklch(0.95 0.002 247);
  --foreground-muted:    oklch(0.55 0.008 247);
  --surface:             oklch(0.17 0.005 247);
  --surface-hover:       oklch(0.21 0.006 247);
  --border:              oklch(0.26 0.006 247);
  --border-subtle:       oklch(0.22 0.005 247);
  --accent:              oklch(0.62 0.21 27);
  --accent-hover:        oklch(0.70 0.19 27);
  --accent-foreground:   oklch(1.00 0 0);
  --critical:            oklch(0.58 0.24 25);
  --critical-foreground: oklch(1.00 0 0);
  --warning:             oklch(0.78 0.15 78);
  --success:             oklch(0.68 0.17 145);
  --info:                oklch(0.66 0.15 240);
  --ring:                oklch(0.62 0.21 27);
}

/* ── Base styles ── */
* { border-color: var(--border); }
html { direction: rtl; }
body {
  background-color: var(--background);
  color: var(--foreground);
  -webkit-font-smoothing: antialiased;
}
```

## ۴) Typography (پیاده‌سازی)

- **Sans:** Vazirmatn — روی `<body>`. **Mono:** system mono — فقط شماره پرسنلی، کد واگن، ID و شمارش‌ها.

**مقیاس (اکیداً فقط این‌ها):**

| نقش | کلاس Tailwind | کجا |
| --- | --- | --- |
| Page title | text-lg font-semibold tracking-tight | هدر صفحه |
| Section label | text-sm font-medium | عنوان بخش |
| Body | text-sm | جدول، فرم، محتوا |
| Muted | text-sm text-foreground-muted | راهنما، placeholder، متا |
| Caption/count | text-xs font-mono text-foreground-muted | شمارش، ID، کد |

هرگز `text-xl+` جز صفحات auth. هرگز `font-bold` — حداکثر `font-semibold`. همهٔ اعداد با `toFa()` از `lib/fa.ts` رندر شوند، جز کدهای mono که لاتین می‌مانند.

## ۵) Spacing

مضرب ۴px. فشرده و پر‌اطلاعات.

| زمینه | توکن |
| --- | --- |
| پد افقی صفحه | px-4 |
| حداکثر عرض محتوا | max-w-5xl |
| فاصلهٔ بخش | space-y-6 |
| پد کارت | p-4 |
| پد ردیف جدول | px-3 py-2.5 |
| ارتفاع input / button | h-9 |
| اندازه آیکون | size-4 |
| دکمهٔ آیکونی | size-8 |

## ۶) Border Radius

- کارت، اینپوت، دیالوگ، دراپ‌داون → `rounded-lg` (--radius = 0.5rem)
- دکمه، بج، چیپ → `rounded-md` (0.375rem)
- چک‌باکس، چیپ کوچک → `rounded-sm` (0.25rem)
- هرگز `rounded-full` جز آواتار/نقطهٔ وضعیت.

<aside>
ℹ️

**تذکر دو مقیاس radius:** بخش Shapes (محصول/موبایل) از ۱۰/۱۶/۲۰/۲۸px صحبت می‌کند، ولی پیاده‌سازی shadcn/Tailwind از مقیاس --radius=0.5rem استفاده می‌کند. برای کامپوننت‌های بزرگ موبایل (کارت ۲۰px، شیت ۲۸px) از کلاس سفارشی `rounded-[20px]` / `rounded-t-[28px]` استفاده کن.

</aside>

## ۷) Shadows

- در حالت تاریک از border استفاده کن، نه shadow.
- Light hover: `shadow-sm` ؛ Dark hover: `shadow-none` (border کار را می‌کند).
- Dialogs: `shadow-lg` (هر دو حالت).
- Transition: `transition-colors duration-150`.

## ۸) Status Colors (دامنه)

از توکن سمنتیک استفاده کن، نه رنگ خام:

| معنا | توکن |
| --- | --- |
| فعال / تأیید / انجام‌شده | success |
| در انتظار / نیاز به بازبینی | warning |
| ردشده / خرابی / معوق | accent (قرمز) |
| SOS / اضطراری | critical |
| اطلاع‌رسانی | info |

**کد شیفت‌ها:** صبح (day) = tint سبز/success ؛ عصر (evening) = tint آبی/info ؛ شب (night) = سطح neutral-700 + foreground-muted ؛ آف/استراحت = background-subtle.

## ۹) Component Specs

### Button variants

```
default:      bg-accent text-accent-foreground hover:bg-accent-hover
ghost:        bg-transparent hover:bg-surface-hover text-foreground-muted hover:text-foreground
outline:      border border-border bg-transparent hover:bg-surface-hover
destructive:  bg-transparent hover:bg-critical/10 text-critical
sos:          bg-critical text-critical-foreground hover:bg-critical-600 font-semibold
```

همه: `h-9 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer`. آیکون‌فقط: `size-8 p-0 rounded-md` (ghost).

### Input

```
h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-start
text-foreground placeholder:text-foreground-muted
focus:outline-none focus:ring-1 focus:ring-ring
transition-colors duration-150
disabled:opacity-50 disabled:cursor-not-allowed
```

حالت خطا: `border-accent focus:ring-accent` + متن کمکی `text-xs text-accent`.

### DataTable (دفتر تلفن، تیکت، کاربران — فقط دسکتاپ)

- Header row: `bg-background-subtle text-foreground-muted text-xs font-medium`
- Body row: `border-b border-border-subtle px-3 py-2.5 text-sm hover:bg-surface-hover`
- Sticky header در اسکرول. RTL: ستون اول = start. پیجینیشن: `text-xs font-mono`.

<aside>
📱

**موبایل:** DataTable فقط برای دسکتاپ/پنل ادمین است. روی موبایل همهٔ جدول‌ها به **کارت/لیست کارتی** تبدیل می‌شوند (رجوع به بخش «طراحی موبایل» پایین).

</aside>

### Badge / Status chip

```
inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium
tints: success/10 text-success · warning/10 text-warning · accent/10 text-accent
       info/10 text-info · critical/10 text-critical
```

### FileDrop (excel / roster / ticket photo)

```
border-2 border-dashed border-border rounded-lg p-6 text-center text-sm text-foreground-muted
hover:border-accent hover:bg-surface-hover
```

بعد از انتخاب، نام و حجم فایل را نشان می‌دهد. Excel/roster قبل از commit یک جدول parse-preview نشان می‌دهند.

### Safety bulletin modal (اجباری)

- Dialog غیرقابل‌بستن: بدون X، بدون بستن با کلیک بیرون، بدون Esc.
- Header: آیکون هشدار + عنوان. Body: متن اسکرول‌شو.
- Footer: دکمهٔ تمام‌عرض «مطالعه کردم و متوجه شدم» (variant default).
- دکمه تا رسیدن کاربر به انتهای متن غیرفعال است.

### Shift calendar

- Month grid (jalali). هر خانه: چیپ کد شیفت (ببین §8). روز جاری: `ring-1 ring-accent`. کلیک روز → پاپ‌اور/شیت جزئیات شیفت.

### Ticket card

- `Card p-4`: تصویر بندانگشتی (عکس annotate‌شده) + کد واگن/تجهیز (mono) + بج اولویت + بج وضعیت + زمان نسبی (jalali). کلیک → drawer جزئیات.

## ۱۰) Accessibility & RTL

- همهٔ عناصر تعاملی keyboard-focusable؛ فوکوس قابل‌رویت: `focus:ring-1 ring-ring`.
- logical props: `ps/pe`، `ms/me`، `text-start/end`، `inset-inline`.
- آیکون‌های جهت‌دار (فلش) در RTL آینه شوند.
- حداقل کنتراست AA. وضعیت هرگز فقط با رنگ مشخص نشود — همراه آیکون یا لیبل.

---

## 🧩 اسکیل‌های پیشنهادی Claude Code برای UI

این اسکیل‌ها از [skills.sh](http://skills.sh) نصب می‌شوند. برای نصب فقط روی Claude Code پرچم `-a claude-code` را اضافه کن.

**ضروری (کامپوننت + استایل):**

```bash
# shadcn/ui رسمی — قواعد ترکیب کامپوننت، RSC، نسخه Tailwind، رنگ سمنتیک
npx shadcn@latest add skills

# Tailwind v4 + shadcn یکپارچه (منطبق با پشته پروژه)
npx skills add jezweb/claude-skills --skill tailwind-v4-shadcn -a claude-code

# سیستم طراحی Tailwind v4 CSS-first (@theme، CVA، dark mode، انیمیشن)
npx skills add wshobson/agents --skill tailwind-design-system -a claude-code
```

<aside>
⚠️

هم‌زمان فقط یکی از دو اسکیل Tailwind (tailwind-v4-shadcn یا tailwind-design-system) را فعال نگه دار تا قواعد متناقض نشوند. برای این پروژه tailwind-v4-shadcn ارجح است.

</aside>

**طراحی و تجربهٔ کاربری:**

```bash
# مهندسی UI + معماری کامپوننت + دسترس‌پذیری WCAG 2.1 AA
npx skills add addyosmani/agent-skills --skill frontend-ui-engineering -a claude-code

# طراحی حرفه‌ای با ضدالگوها (تایپوگرافی، رنگ، چیدمان، حرکت)
npx skills add pbakaus/impeccable --skill frontend-design -a claude-code

# بانک سبک‌ها: +50 استایل، 161 ترکیب رنگ، 57 جفت فونت، 99 اصل UX
npx skills add nextlevelbuilder/ui-ux-pro-max-skill -a claude-code
```

**انیمیشن (اختیاری — برای پولیش):**

```bash
# قواعد انیمیشن: فقط transform/opacity، تایمینگ 200–300ms، prefers-reduced-motion
npx skills add mblode/agent-skills --skill ui-animation -a claude-code

# راهنمای Framer Motion (variants، stagger، ترنزیشن صفحه، ژست‌ها)
npx skills add patricio0312rev/skills --skill framer-motion-animator -a claude-code
```

**نکته‌ها:**

- با ۳ اسکیل «ضروری» شروع کن؛ بیشتر کار UI را پوشش می‌دهند.
- RTL/فارسی: اسکیل اختصاصی RTL وجود ندارد؛ دسترس‌پذیری (frontend-ui-engineering) به‌علاوهٔ همین [DESIGN.md](http://DESIGN.md) این بخش را پوشش می‌دهد.
- مدیریت: `npx skills list` و `npx skills update`.
- اسکیل‌های جامعه ممیزی‌شده نیستند؛ قبل از نصب [SKILL.md](http://SKILL.md) را مرور کن.

---

## 🎨 طراحی موبایل (خلاصهٔ کاربردی)

- **ناوبری پایین:** خانه / شیفت‌ها / اعلان‌ها / گفتگو / پروفایل (RTL)؛ آیتم فعال قرمز برند.
- **خانه:** سلام + تاریخ جلالی + چیپ وضعیت، کارت هیرو شیفت امروز، کارت‌های متریک ۲ستونه، دسترسی سریع.
- **جدول → کارت:** هیچ جدول دسکتاپی روی موبایل؛ دفترتلفن/تیکت/لوحه همه کارتی.
- **تقویم شیفت:** ماهانه/هفتگی/لیست، خانه‌های بزرگ، کدگذاری رنگ+آیکون+برچسب برای روز/شب/آف/کامل/مرخصی/آموزش، شیت جزئیات روز، خلاصهٔ ماه.
- **تنظیمات شخصی‌سازی:** تم/رنگ تأکیدی/فونت/تراکم، نمایش آیکون/رنگ روی روزهای تقویم، شروع هفته، دسترس‌پذیری، امنیت، داده/همگام‌سازی.
- **آیکون/تصویر سه‌بعدی:** برای هیرو و حالت‌های خالی، بهینه و lazy-load.

---

## 🚀 Kickoff Prompt برای Claude Code

<details><summary>پرامپت کامل (کپی کن و به ایجنت بده)</summary>

```markdown
Read DESIGN.md first. It is the single source of truth. Do not invent values.

Redesign the entire mobile frontend of the Tehran Metro Line 1 personnel app. The current dark UI, buttons, tables and calendar are rejected.

Build a new light-first, modern Persian RTL mobile UI. Default theme = system (fallback light); both light and dark must be fully supported.

Stack: Next.js + Tailwind CSS v4 (CSS-first @theme inline in globals.css, NO tailwind.config.ts), shadcn/ui (new-york, neutral, CSS variables), next-themes (class-based, defaultTheme system), dir="rtl" with logical properties only, Vazirmatn via next/font, Lucide icons only, cn() from @/lib/utils. Use the exact oklch semantic tokens and globals.css block from DESIGN.md.

Focus on:
- premium light theme, professional rounded cards
- modern button system per DESIGN.md §9
- NO desktop tables on mobile; convert all tables to card lists
- advanced Jalali shift calendar with visible day/night/off/full states
- optional icons on calendar days controlled by settings
- 3D icons/illustrations for dashboard, empty states, modules
- advanced user settings: appearance, calendar, notifications, accessibility, security, sync
- Persian digits via toFa(), Vazirmatn, strict RTL
- accessibility (WCAG AA, focus-ring, never color-only), 48x48 touch targets
- offline-friendly UX (small chip, red only for real errors/SOS)

Implement:
1. new Home screen
2. new Shift Calendar screen
3. shift details bottom sheet
4. new Settings screen
5. new bottom tab navigation
6. new mobile card-list components
7. new button system
8. 3D illustration empty states
9. persisted user personalization settings

Do not reuse the old dark UI. Do not use mobile tables. Do not make the calendar tiny. Do not overuse red. Use red only as Line 1 brand accent and danger/SOS.
```

</details>