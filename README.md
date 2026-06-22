# مترو خط ۱ — Metro Line 1 Crew Management

سیستم مدیریت پرسنل خط ۱ مترو تهران

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first, oklch tokens) |
| UI | shadcn/ui (New York, base-ui) |
| DB | Prisma 7 + SQLite (libsql adapter) |
| Auth | JWT (access 15m + refresh 7d, bcrypt 12) |
| State | Zustand |
| i18n | Persian RTL, Vazirmatn font, jalali dates |
| Dark mode | next-themes (class-based, default dark) |
| Icons | Lucide React |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npx prisma migrate reset --force
npx tsx prisma/seed.ts

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role | National ID | Password |
|------|-------------|----------|
| Super Admin | `0000000000` | `admin123` |
| Admin | `9999999999` | `admin123` |
| Operator | `1111111111` through `6666666666` | `admin123` |

## Features

### Auth & RBAC
- Two-step registration (pending approval by admin)
- JWT access + refresh tokens
- 3-tier role hierarchy: operator → admin → super_admin
- 20 granular permissions across 6 modules

### Directory (دفتر تلفن)
- User list with search/filter/pagination
- Dynamic custom fields (admin-managed)
- Excel import with per-row error report
- Excel export

### Shifts (شیفت)
- Personal shift calendar (jalali month grid)
- Admin shift calendar (all users)
- Roster upload from Excel → auto-shift extraction

### Shift Swapping (تعویض شیفت)
- Swap request with rule engine:
  - Minimum 10h rest between shifts
  - Max 6 consecutive shifts
  - Role parity check
- Accept/reject workflow
- Admin approval

### Safety Bulletins (بخشنامه ایمنی)
- Create/acknowledge with read receipts
- Non-blocking modal until scroll + acknowledge
- Receipt tracking with % seen

### Fault Ticketing (تیکتینگ خرابی)
- Photo + on-image annotation
- Priority levels (low → critical)
- Status workflow: open → in_progress → resolved → closed
- Audit trail per ticket

## Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint check
npm run typecheck    # TypeScript check
npx vitest run       # Run unit tests
npx prisma studio    # Open Prisma Studio
npx tsx prisma/seed.ts  # Re-seed database
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (RTL, Vazirmatn, dark mode)
│   ├── globals.css             # oklch theme tokens
│   ├── (auth)/                 # login, register, pending-approval
│   ├── (app)/                  # authenticated shell
│   │   ├── layout.tsx          # sidebar + bulletin guard
│   │   └── dashboard/
│   └── api/                    # Route handlers (26 endpoints)
├── components/
│   ├── ui/                     # shadcn wrappers (button, card, etc.)
│   └── shared/                 # sidebar, bulletin-guard, data-table, etc.
├── server/
│   ├── auth/                   # password, jwt
│   ├── rbac/                   # permissions, guard
│   └── modules/                # services per domain
├── stores/                     # Zustand stores
├── lib/
│   ├── fa.ts                   # toFa(), jalali()
│   └── utils.ts                # cn()
└── generated/prisma/           # Prisma client output
```

## Environment Variables

```env
DATABASE_URL="file:prisma/dev.db"
JWT_ACCESS_SECRET="<random-secret>"
JWT_REFRESH_SECRET="<random-secret>"
```

## License

Internal use only — Tehran Metro
