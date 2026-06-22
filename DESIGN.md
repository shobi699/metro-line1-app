DESIGN.md — metro-line1-app Design System
Read this before writing any component, CSS, or class.
This is the single source of truth. Do not invent values.

0. Stack Constraints
Tailwind CSS v4 — config is CSS-first via @theme inline inside globals.css. NO tailwind.config.ts.
shadcn/ui — new-york style, neutral base, CSS variables enabled.
Dark mode — next-themes, class-based, default: dark.
Direction — dir="rtl" on <html>. Use logical properties only.
Font — Vazirmatn (Persian) via next/font (local) or @fontsource/vazirmatn. Mono: Vazirmatn Code / system mono for IDs.
Icons — Lucide React only.
cn() — from @/lib/utils (clsx + tailwind-merge).
1. Design Direction
Aesthetic: Operational + clean. Control-room calm, high legibility, dark-first.
Personality: Trustworthy, fast, zero decoration. This is a safety-critical tool.
Brand: Tehran Metro Line 1 = RED. Red is the accent/brand color, used deliberately — not for decoration.
Rule: If an element has no function, remove it.

2. Color System — oklch
All colors use oklch. Format: oklch(L C H) — Lightness 0–1, Chroma 0–0.4, Hue 0–360.

/* ── Neutrals (cool gray) ────────────── */
--color-neutral-50:   oklch(0.98 0.002 247)
--color-neutral-100:  oklch(0.95 0.003 247)
--color-neutral-200:  oklch(0.90 0.004 247)
--color-neutral-300:  oklch(0.82 0.005 247)
--color-neutral-400:  oklch(0.65 0.008 247)
--color-neutral-500:  oklch(0.50 0.010 247)
--color-neutral-600:  oklch(0.38 0.008 247)
--color-neutral-700:  oklch(0.26 0.006 247)
--color-neutral-800:  oklch(0.18 0.005 247)
--color-neutral-900:  oklch(0.12 0.004 247)
--color-neutral-950:  oklch(0.08 0.003 247)

/* ── Brand / Accent (Line 1 Red) ─────── */
--color-brand-300:    oklch(0.72 0.15 27)
--color-brand-400:    oklch(0.63 0.19 27)
--color-brand-500:    oklch(0.55 0.22 27)   /* base — Line 1 red */
--color-brand-600:    oklch(0.48 0.21 27)
--color-brand-700:    oklch(0.41 0.18 27)

/* ── Critical / SOS (deep red) ──────── */
--color-critical-500: oklch(0.50 0.25 25)
--color-critical-600: oklch(0.43 0.23 25)

/* ── Warning (amber) ─────────────── */
--color-warning-400:  oklch(0.80 0.14 80)
--color-warning-500:  oklch(0.72 0.16 75)

/* ── Success (green) ─────────────── */
--color-success-400:  oklch(0.68 0.17 145)
--color-success-500:  oklch(0.58 0.19 145)

/* ── Info (blue) ────────────────── */
--color-info-500:     oklch(0.60 0.16 240)
3. Semantic Tokens → globals.css
Copy this block into src/app/globals.css:

@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* ── Radius ──────────────────── */
  --radius-sm:  calc(var(--radius) - 4px);
  --radius-md:  calc(var(--radius) - 2px);
  --radius-lg:  var(--radius);
  --radius-xl:  calc(var(--radius) + 4px);

  /* ── Semantic color aliases ───────── */
  --color-background:         var(--background);
  --color-background-subtle:  var(--background-subtle);
  --color-foreground:         var(--foreground);
  --color-foreground-muted:   var(--foreground-muted);
  --color-surface:            var(--surface);
  --color-surface-hover:      var(--surface-hover);
  --color-border:             var(--border);
  --color-border-subtle:      var(--border-subtle);
  --color-accent:             var(--accent);
  --color-accent-hover:       var(--accent-hover);
  --color-accent-foreground:  var(--accent-foreground);
  --color-critical:           var(--critical);
  --color-critical-foreground:var(--critical-foreground);
  --color-warning:            var(--warning);
  --color-success:            var(--success);
  --color-info:               var(--info);
  --color-ring:               var(--ring);

  --font-sans: "Vazirmatn", ui-sans-serif, system-ui, sans-serif;
}

/* ── Light mode ────────────────────── */
:root {
  --radius: 0.5rem;

  --background:         oklch(0.98 0.002 247);
  --background-subtle:  oklch(0.94 0.003 247);
  --foreground:         oklch(0.12 0.004 247);
  --foreground-muted:   oklch(0.50 0.010 247);

  --surface:            oklch(1.00 0 0);
  --surface-hover:      oklch(0.96 0.002 247);
  --border:             oklch(0.88 0.004 247);
  --border-subtle:      oklch(0.93 0.003 247);

  --accent:             oklch(0.55 0.22 27);
  --accent-hover:       oklch(0.48 0.21 27);
  --accent-foreground:  oklch(1.00 0 0);

  --critical:           oklch(0.50 0.25 25);
  --critical-foreground:oklch(1.00 0 0);
  --warning:            oklch(0.72 0.16 75);
  --success:            oklch(0.58 0.19 145);
  --info:               oklch(0.60 0.16 240);

  --ring:               oklch(0.55 0.22 27);
}

/* ── Dark mode (default) ────────────── */
.dark {
  --background:         oklch(0.13 0.004 247);
  --background-subtle:  oklch(0.17 0.005 247);
  --foreground:         oklch(0.95 0.002 247);
  --foreground-muted:   oklch(0.55 0.008 247);

  --surface:            oklch(0.17 0.005 247);
  --surface-hover:      oklch(0.21 0.006 247);
  --border:             oklch(0.26 0.006 247);
  --border-subtle:      oklch(0.22 0.005 247);

  --accent:             oklch(0.62 0.21 27);
  --accent-hover:       oklch(0.70 0.19 27);
  --accent-foreground:  oklch(1.00 0 0);

  --critical:           oklch(0.58 0.24 25);
  --critical-foreground:oklch(1.00 0 0);
  --warning:            oklch(0.78 0.15 78);
  --success:            oklch(0.68 0.17 145);
  --info:               oklch(0.66 0.15 240);

  --ring:               oklch(0.62 0.21 27);
}

/* ── Base styles ───────────────────── */
* { border-color: var(--border); }

html { direction: rtl; }

body {
  background-color: var(--background);
  color: var(--foreground);
  -webkit-font-smoothing: antialiased;
}
4. Typography
Sans: Vazirmatn — applied on <body>. Mono: system mono — personnel numbers, wagon codes, IDs, counts only.

Scale (strict — use only these)
Role	Tailwind class	Where
Page title	text-lg font-semibold tracking-tight	Page header
Section label	text-sm font-medium	Section headers
Body	text-sm	Tables, forms, content
Muted	text-sm text-foreground-muted	Hints, placeholders, meta
Caption/count	text-xs font-mono text-foreground-muted	counts, IDs, codes
Never use text-xl+ except on the auth screens. Never use font-bold — max font-semibold.
Always render numbers via toFa() from lib/fa.ts, except mono codes which stay latin.

5. Spacing
Multiples of 4px. Compact, information-dense.

Context	Token
Page horizontal pad	px-4
Content max-width	max-w-5xl
Section gap	space-y-6
Card padding	p-4
Table row padding	px-3 py-2.5
Input / button h	h-9
Icon size	size-4
Icon button size	size-8
6. Border Radius
Cards, inputs, dialogs, dropdowns  ->  rounded-lg  (--radius = 0.5rem)
Buttons, badges, chips             ->  rounded-md  (0.375rem)
Checkboxes, small chips            ->  rounded-sm  (0.25rem)
Never use rounded-full except avatar/status dots.

7. Shadows
Dark mode uses borders, not shadows.

Light hover:  shadow-sm
Dark hover:   shadow-none (border does the work)
Dialogs:      shadow-lg (both modes)
Transition:   transition-colors duration-150
8. Status colors (domain)
Use semantic tokens, never raw colors:

Meaning	Token
Active / approved / done	success
Pending / needs review	warning
Rejected / fault / overdue	accent (red)
SOS / emergency	critical
Informational	info
Shift codes
Morning (صبح): success tint
Evening (عصر): info tint
Night (شب): neutral-700 surface + foreground-muted
Off (استراحت): background-subtle
9. Component Specs
Button variants
default:      bg-accent text-accent-foreground hover:bg-accent-hover
ghost:        bg-transparent hover:bg-surface-hover text-foreground-muted hover:text-foreground
outline:      border border-border bg-transparent hover:bg-surface-hover
destructive:  bg-transparent hover:bg-critical/10 text-critical
sos:          bg-critical text-critical-foreground hover:bg-critical-600 font-semibold
All buttons: h-9 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer.
Icon-only: size-8 p-0 rounded-md (ghost).

Input
h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-start
text-foreground placeholder:text-foreground-muted
focus:outline-none focus:ring-1 focus:ring-ring
transition-colors duration-150
disabled:opacity-50 disabled:cursor-not-allowed
Error state: border-accent focus:ring-accent + helper text text-xs text-accent.

DataTable (directory, tickets, users)
Header row:  bg-background-subtle text-foreground-muted text-xs font-medium
Body row:    border-b border-border-subtle px-3 py-2.5 text-sm hover:bg-surface-hover
Sticky header on scroll. RTL: first column = start. Pagination footer: text-xs font-mono.
Badge / Status chip
inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium
variant tints: success/10 text-success, warning/10 text-warning,
               accent/10 text-accent, info/10 text-info, critical/10 text-critical
FileDrop (excel / roster / ticket photo)
Dashed border-2 border-border rounded-lg p-6 text-center text-sm text-foreground-muted
hover:border-accent hover:bg-surface-hover
Shows file name + size after select. Excel/roster show a parse-preview table before commit.
Safety bulletin modal (mandatory)
Dialog, not dismissible: no close X, no outside-click close, no Esc.
Header: warning icon + title. Body: scrollable bulletin text.
Footer: single full-width button "مطالعه کردم و متوجه شدم" (variant default).
Button disabled until user scrolls to the end of the body.
Shift calendar
Month grid (jalali). Each day cell: shift-code chip (see §8).
Today cell: ring-1 ring-accent. Day click opens shift detail popover.
Ticket card
Card p-4: thumbnail (annotated photo) + wagon/equipment code (mono) + priority badge
+ status badge + relative time (jalali). Click -> detail drawer.
10. Accessibility & RTL
All interactive elements keyboard-focusable; visible focus:ring-1 ring-ring.
Use logical props: ps/pe, ms/me, text-start/end, inset-inline.
Icons that imply direction (arrows) must flip in RTL.
Min contrast AA. Status must never rely on color alone — pair with icon or label.

🧩 اسکیل‌های پیشنهادی Claude Code برای UI
این اسکیل‌ها از skills.sh نصب می‌شوند و قواعد ساخت UI را به عامل می‌دهند. برای نصب فقط روی Claude Code، پرچم -a claude-code را اضافه کنید.

ضروری (کامپوننت + استایل)
# shadcn/ui رسمی — قواعد ترکیب کامپوننت، تشخیص RSC و نسخهٔ Tailwind، رنگ‌های سمنتیک
npx shadcn@latest add skills

# Tailwind v4 + shadcn یکپارچه (دقیقاً منطبق با پشتهٔ پروژه)
npx skills add jezweb/claude-skills --skill tailwind-v4-shadcn -a claude-code

# سیستم طراحی Tailwind v4 «CSS-first» (@theme، CVA، dark mode، انیمیشن نیتیو)
npx skills add wshobson/agents --skill tailwind-design-system -a claude-code
⚠️ هم‌زمان فقط یکی از دو اسکیل Tailwind (tailwind-v4-shadcn یا tailwind-design-system) را فعال نگه دارید تا قواعد متناقض نشوند. برای این پروژه tailwind-v4-shadcn ارجح است.

طراحی و تجربهٔ کاربری
# مهندسی UI + معماری کامپوننت + دسترس‌پذیری WCAG 2.1 AA (مهم برای فاز ۱۰)
npx skills add addyosmani/agent-skills --skill frontend-ui-engineering -a claude-code

# طراحی حرفه‌ای با ضدالگوها (تایپوگرافی، رنگ، چیدمان، حرکت)
npx skills add pbakaus/impeccable --skill frontend-design -a claude-code

# بانک سبک‌ها: +۵۰ استایل، ۱۶۱ ترکیب رنگ، ۵۷ جفت فونت، ۹۹ اصل UX
npx skills add nextlevelbuilder/ui-ux-pro-max-skill -a claude-code
انیمیشن (اختیاری — برای پولیش)
# قواعد انیمیشن UI: فقط transform/opacity، تایمینگ ۲۰۰–۳۰۰ms، prefers-reduced-motion
npx skills add mblode/agent-skills --skill ui-animation -a claude-code

# راهنمای کامل Framer Motion (variants، stagger، ترنزیشن صفحه، ژست‌ها)
npx skills add patricio0312rev/skills --skill framer-motion-animator -a claude-code
نکته‌ها
با ۳ اسکیل «ضروری» شروع کنید؛ همین‌ها بیشتر کار UI را پوشش می‌دهند.
RTL/فارسی: اسکیل اختصاصی RTL در دایرکتوری وجود ندارد؛ دسترس‌پذیری (frontend-ui-engineering) به‌علاوهٔ همین فایل DESIGN.md (Vazirmatn، جهت RTL، رنگ قرمز خط ۱) این بخش را پوشش می‌دهد.
مدیریت: npx skills list (نصب‌شده‌ها) و npx skills update (به‌روزرسانی).
اسکیل‌های جامعه (غیررسمی) ممیزی‌شده نیستند؛ پیش از نصب، SKILL.md آن‌ها را مرور کنید.