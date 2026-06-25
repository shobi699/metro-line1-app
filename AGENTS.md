<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
AGENTS.md — metro-line1-app (سیر و حرکت خط ۱)
Read this file + DESIGN.md fully before writing any code.

Project
Personnel + operations platform for Tehran Metro Line 1 (سیر و حرکت خط یک مترو تهران).
Language: Persian (Farsi), RTL. Theme: dark-first. Line 1 brand color is red.

Phase 1 scope (six capabilities):

Two-step auth + RBAC (super_admin / admin / operator)
Smart directory + dynamic profile fields (دفتر تلفن)
Excel import/export for users (اکسل)
Roster upload + shift extraction + personal calendar (لوحه)
Safety bulletins with mandatory read-receipts (بخشنامه ایمنی)
Image-based fault ticketing (تیکتینگ خرابی)
Stack (fixed)
Next.js latest — App Router; Route Handlers under app/api/ for the backend
TypeScript (strict: true)
Tailwind CSS v4 — CSS-first config via @theme inline in globals.css. NO tailwind.config.ts.
shadcn/ui — new-york style, neutral base, CSS variables
next-themes — class-based dark mode, default: dark
Zustand + persist middleware (one store per feature)
Zod — shared validation, used on both client and server
Prisma + PostgreSQL
Auth — JWT (access + refresh) with RBAC route guards
SheetJS (xlsx) for Excel import/export
i18n — Persian RTL; Vazirmatn font; jalali dates via dayjs-jalali
Package manager: npm only
Design
All visual decisions (colors, typography, spacing, radius, shadows, components)
are defined in DESIGN.md. Do not invent values — read DESIGN.md first.

Folder structure
src/
├── app/
│   ├── layout.tsx              # html dir="rtl" lang="fa", Vazirmatn, dark default
│   ├── globals.css             # CSS variables from DESIGN.md live here
│   ├── (auth)/                 # login, register, pending-approval
│   ├── (app)/                  # authenticated app shell
│   └── api/                    # Route Handlers (REST under /api)
├── components/
│   ├── ui/                     # wrapped shadcn ONLY
│   └── shared/                 # AppShell, Sidebar, ThemeToggle, DataTable, FileDrop, EmptyState
├── features/
│   ├── auth/                   # {components, store, api-client, types, index.ts}
│   ├── directory/
│   ├── roster/
│   ├── swap/
│   ├── safety/
│   └── tickets/
├── server/
│   ├── db.ts                   # Prisma client singleton
│   ├── auth/                   # jwt, password hashing, session
│   ├── rbac/                   # roles, permission matrix, guard helpers
│   └── modules/                # service layer per domain module
├── lib/
│   ├── utils.ts                # cn() utility
│   ├── fa.ts                   # fa-IR number + jalali date helpers
│   └── zod/                    # shared schemas
└── prisma/
    └── schema.prisma
Hard rules
Never import raw shadcn inside app/ or features/. Wrap in components/ui/ first.
Every components/ui/ component: forwardRef + CVA variants + cn() + typed (no any).
No inline styles. No raw hex colors — CSS variables + Tailwind tokens only.
RTL-correct always: use logical properties (ps/pe, ms/me, start/end, text-start). Never hardcode left/right.
All user-facing text is Persian. Render digits in fa-IR via lib/fa.ts.

No console.log, no unused imports, no @ts-ignore.
Named exports everywhere except app/ route files.
No business logic inside JSX — extract to hooks, store actions, or server services.
Dark mode is default (defaultTheme="dark"). Never use enableSystem.
Backend rules
Validate every request body / query with Zod; reject unknown fields.
Enforce RBAC on every protected Route Handler — no exceptions.
API responses: { data } on success, { error: { code, message } } on failure.
Never log secrets, tokens, or payslip data.
Write an audit-log row for every create/update/delete.
Registration creates a pending user; login is blocked until an admin approves.
Workflow
Work phase by phase. Do not skip ahead.
After each phase: npm run build && npm run lint. Fix all errors before continuing.
Report only: what changed, files touched, build/lint result.
No explanations unless asked.
Ambiguous choice → make conventional decision, note it in one line.
Definition of done
npm run dev starts clean
npm run build passes
npm run lint zero errors
Dark mode + RTL correct on first load
A pending user cannot log in until approved
Excel import returns a per-row error report
A mandatory safety bulletin blocks the UI until acknowledged; receipt is stored
All interactive elements keyboard-accessible