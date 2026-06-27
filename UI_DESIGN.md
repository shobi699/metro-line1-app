# UI_DESIGN.md — Visual & UX Design System

> Design reference for the Tehran Metro Line 1 "Seyr-o-Harekat" personnel app.
> Persian (Farsi), RTL-first. This file is the single source of truth for the look & feel.
> Stack: Next.js (apps/web) + Expo/React Native (apps/mobile) + Tailwind v4 + shadcn/ui + Vazirmatn.
> Goal: modern, clean, professional, calm, and effortless to use for non-technical metro staff.

---

## 0. Design mandate for the agent
- Build interfaces that feel modern and trustworthy (this is an enterprise safety/HR tool, not a flashy consumer app).
- Prefer clarity over decoration: generous whitespace, strong hierarchy, few accent colors.
- Never ship a screen without loading (skeleton), empty, and error states.
- Use ONLY the tokens in this file. No hardcoded hex, px, or shadows in components.
- Design the three surfaces separately (Web, Mobile/PWA, Native App). Each section below is normative.

---

## 1. Brand & principles
- **Persian-first / RTL:** `dir="rtl"` is the default. Mirror layouts (nav on the right, chevrons flipped). Wrap latin/code/IDs in an LTR isolate (`<bdi>` / `unicode-bidi: isolate`).
- **Numerals:** show fa-IR digits (۰۱۲۳۴۵۶۷۸۹) in all user-facing UI; keep ASCII in storage and APIs.
- **Dates:** Jalali (شمسی) everywhere in the UI via dayjs-jalali; ISO/UTC in storage.
- **Identity:** Metro Line 1 is red — use a refined, accessible red as the primary brand color, balanced by calm neutrals so it never feels alarming (reserve pure alert-red for danger/SOS only).
- **Tone:** professional, reassuring, concise Persian microcopy. No jokes in safety/SOS flows.
- **Grid:** 8px spacing system (4px for fine adjustments).
- **Consistency:** one component library shared across surfaces; identical naming for the same concept.

---

## 2. Design tokens

### 2.1 Color (light mode)
```
--brand-50:  #FEF2F2
--brand-100: #FEE2E2
--brand-300: #FCA5A5
--brand-500: #E11D2E   /* primary — metro red */
--brand-600: #C11626   /* primary hover/pressed */
--brand-700: #9F1019

--bg:        #FFFFFF
--surface:   #F7F8FA   /* cards, panels */
--surface-2: #EEF1F5
--border:    #E2E6EC
--text:      #0F172A   /* primary text */
--text-muted:#5B6675
--text-faint:#8A94A6

--success:   #16A34A
--warning:   #D97706
--danger:    #DC2626   /* errors + SOS only */
--info:      #2563EB
```

### 2.2 Color (dark mode)
```
--bg:        #0B0F14
--surface:   #131922
--surface-2: #1B232E
--border:    #28323F
--text:      #E6EAF0
--text-muted:#9AA6B5
--brand-500: #F2556A   /* lifted for contrast on dark */
--brand-600: #E11D2E
```
All color pairings must meet WCAG 2.1 AA (≥4.5:1 body text, ≥3:1 large text/icons).

### 2.3 Typography (Vazirmatn variable)
```
Display   28/36  700
H1        24/32  700
H2        20/28  600
H3        17/24  600
Body      15/24  400
Body-sm   13/20  400
Caption   12/16  500   (use fa-IR digits)
Mono      latin/codes only (e.g. JetBrains Mono / system mono), LTR isolate
```
Line-height is generous for Persian; never letter-spacing on Farsi text.

### 2.4 Radius / shadow / motion
```
radius:  sm 6px | md 10px | lg 14px | xl 20px | full 9999px
shadow:  sm  0 1px 2px rgba(15,23,42,.06)
         md  0 4px 12px rgba(15,23,42,.08)
         lg  0 12px 32px rgba(15,23,42,.12)
motion:  fast 120ms | base 200ms | slow 320ms ; easing cubic-bezier(.2,.8,.2,1)
         honor prefers-reduced-motion (disable non-essential animation)
z-index: dropdown 1000 | sticky 1100 | overlay 1200 | modal 1300 | toast 1400
```

### 2.5 Implementation
- Define tokens once as CSS variables + Tailwind v4 `@theme`; map shadcn/ui tokens to them.
- Mobile (Expo): mirror the same tokens in a shared `theme.ts` in `packages/shared` so web and native stay in sync.

---

## 3. Shared components (build in packages/ui)
Button (primary/secondary/ghost/danger), IconButton, Input/Textarea, Select/Combobox, Checkbox/Radio/Switch, DatePicker (Jalali), DataTable (sortable, sticky header, RTL, pagination), SearchBar (multi-field), FileDrop (drag+preview), Dialog/Modal, BottomSheet (mobile), Toast, Tooltip, Badge/StatusChip, Avatar, Card, Tabs, Breadcrumb, Pagination, EmptyState, Skeleton, Spinner, Banner (offline/info/danger).

Every interactive component defines: default, hover, focus-visible, active, disabled, loading.

---

## 4. SURFACE A — WEB (desktop admin + personnel portal) · apps/web
**Target:** ops/admin staff on desktop; primary tool for management.

### Layout
- App frame: fixed **right-side** sidebar (RTL) `240px` (collapsible to `72px` icons), top bar `56px`, scrollable content with max content width `1200–1360px` and `24px` gutters.
- Top bar: workspace/title, global search, notifications bell, dark-mode toggle, user menu.
- Sidebar: grouped nav with icons + labels; show role-based items only.

### Breakpoints
`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Sidebar collapses to a drawer below `lg`.

### Patterns
- **DataTable-first** for directory, import jobs, tickets, receipts. Sticky header, row hover, inline status chips, right-aligned actions (RTL), bulk-select toolbar, server pagination, column-based filters.
- **Excel import wizard:** stepper → upload (FileDrop) → validation summary → per-row error report (downloadable) → preview diff → confirm.
- **Review queue** (roster ambiguities): split view — file/source on one side, mapped shifts editable on the other.
- **Forms:** single column, grouped sections, labels above fields, inline validation, sticky save bar.
- **Density:** comfortable default; offer a compact toggle for big tables.
- **Dashboards:** metric cards + charts (read receipts %, pending approvals, open tickets).

---

## 5. SURFACE B — MOBILE WEB / PWA · apps/web (responsive)
**Target:** staff opening the web app on a phone; installable PWA.

- **App shell:** top bar `52px` + bottom tab bar (4–5 items) for primary nav; sidebar becomes a slide-in drawer.
- **PWA:** installable (manifest + icons + Persian name), splash screen, offline banner, "add to home screen" prompt, service worker caching the shell.
- **Touch:** ≥44px targets, thumb-reachable primary actions, bottom-anchored CTAs and sheets.
- **Tables → cards:** convert DataTables to stacked cards/list rows on small screens; filters move into a bottom sheet.
- **Forms:** full-width inputs, large tap areas, numeric keypads for personnel/wagon numbers, sticky bottom submit.
- **Performance:** lazy-load routes, optimize images, keep first load light.

---

## 6. SURFACE C — NATIVE APP · apps/mobile (Expo / React Native)
**Target:** field staff (operators); offline-first, iOS + Android.

### Navigation & shell
- **Bottom tab nav** (RTL order): خانه / شیفت‌ها / اعلان‌ها / گزارش خرابی / پروفایل. Native stack within tabs.
- Respect safe areas (notch / home indicator); large native headers.
- Native gestures: swipe-back, pull-to-refresh, long-press actions, bottom sheets.

### Native-specific UI
- **Offline-first:** persistent subtle offline banner; queued/syncing badges on items created offline; optimistic UI with sync status.
- **Camera + annotation** (fault ticketing): full-screen capture, pen/arrow/box markup tools, multi-photo, then form (wagon/equipment code, priority).
- **Push notifications:** for new roster, mandatory bulletins, swap updates; deep-link into the relevant screen.
- **SOS:** floating/accessible danger-red action; one confirm step; sends geolocation + identity; highest visual priority; never gated behind menus.
- **Mandatory safety bulletin:** non-dismissible modal that blocks the app until "مطالعه کردم" is pressed; then records receipt.
- **Haptics** on key confirmations (submit, acknowledge, SOS).

### Visual
- Same tokens/typography as web (Vazirmatn, fa-IR digits, Jalali), tuned for native (slightly larger touch type, platform-appropriate elevation).

---

## 7. Module screen map (per surface)
| Module | Web (admin/portal) | Mobile/PWA | Native app |
|---|---|---|---|
| دفتر تلفن (Directory) | DataTable + multi-filter search; custom-field manager | Card list + search sheet | Searchable list, tap-to-call/message |
| لوحه/شیفت (Roster) | Upload + mapping review + archive | Personal calendar (month/week) | Calendar + shift detail + export to phone |
| جابجایی شیفت (Swap) | Manager inbox/approvals table | Request + status timeline | Request flow + push updates |
| بخشنامه ایمنی (Safety) | Publish + receipts dashboard (%) | Pending list | Blocking modal + acknowledge |
| تیکتینگ خرابی (Tickets) | Repair-unit kanban/table + status | Report form | Camera + annotate + submit |

---

## 8. Microcopy & states
- Persian, short, action-oriented. Buttons = verbs ("ثبت درخواست"، "تأیید رؤیت").
- Empty states explain what it is + one primary action.
- Errors are human and recoverable; never raw codes. Validation inline next to the field.
- Success via toast; destructive actions need confirm.

## 9. Accessibility checklist (every screen)
- [ ] AA contrast in light + dark
- [ ] Visible focus ring, full keyboard nav (web)
- [ ] ≥44px touch targets (mobile)
- [ ] Labels/aria on all inputs & icon buttons
- [ ] RTL verified (no clipped/mirrored issues)
- [ ] fa-IR digits + Jalali dates rendered correctly
- [ ] Respects prefers-reduced-motion

## 10. Do / Don't
- DO use whitespace, hierarchy, and 1–2 accent colors. DON'T fill screens with red.
- DO design empty/loading/error states. DON'T ship happy-path only.
- DO reuse `packages/ui`. DON'T fork one-off styled components.
- DO keep SOS/safety calm-but-prominent. DON'T animate or gamify safety flows.
