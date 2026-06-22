metro-line1-app — Build Prompt for Claude Code
Read AGENTS.md, RULES.md, and DESIGN.md fully before starting.
Follow phases in order. No skipping. After each phase run npm run build && npm run lint
and fix everything before continuing.

Phase 1 — Project Setup
Create the project:

npx create-next-app@latest metro-line1-app \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm
Inside metro-line1-app/:

npm install zustand zod clsx tailwind-merge class-variance-authority lucide-react
npm install xlsx dayjs dayjs-jalali jose bcryptjs
npm install @prisma/client && npm install -D prisma
npm install -D prettier prettier-plugin-tailwindcss
npx shadcn@latest init
shadcn answers: Style New York, Base color Neutral, CSS variables Yes.

Add Vazirmatn font (next/font local or @fontsource/vazirmatn) and set <html dir="rtl" lang="fa">.
Paste the globals.css block from DESIGN.md §3 exactly.

Add prettier.config.js:

module.exports = {
  plugins: ['prettier-plugin-tailwindcss'],
  singleQuote: true,
  semi: false,
}
✅ Checkpoint: npm run build passes; app renders dark + RTL.

Phase 2 — Folder Structure & Foundations
Create the structure from AGENTS.md. Add:

src/lib/utils.ts — cn() (clsx + tailwind-merge)
src/lib/fa.ts — toFa(n) digit conversion + jalali(date) formatter
src/server/db.ts — Prisma client singleton
.env.example with DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
✅ Checkpoint: npm run lint passes.

Phase 3 — Database Schema (Prisma)
Define prisma/schema.prisma for Phase 1 entities (see DESIGN/AGENTS + module spec):
User, Role, CustomFieldDef, ImportJob, RosterFile, Shift, SwapRequest,
SafetyBulletin, ReadReceipt, Ticket, TicketLog, AuditLog.

Key points:

User.status enum: pending | active | suspended
Role.key enum: super_admin | admin | operator
User.customFields = Json
timestamps on every model; AuditLog references actor + entity + action
Then:

npx prisma migrate dev --name init
Add a seed script creating one super_admin and the three roles.

✅ Checkpoint: npm run build passes; prisma migrate succeeds.

Phase 4 — Auth + RBAC
src/server/auth/ — password hashing (bcryptjs), JWT issue/verify (jose), refresh rotation.
src/server/rbac/ — role hierarchy + permission matrix + requireRole() guard helper.
Route Handlers: POST /api/auth/register (creates pending), POST /api/auth/login
(blocks non-active), POST /api/auth/refresh, POST /api/auth/logout,
POST /api/admin/users/:id/approve.
features/auth/ — login, register, pending-approval screens + Zustand session store.
Zod DTOs for every endpoint. Unit tests for guard + approval flow.
✅ Checkpoint: build + lint pass; a pending user cannot log in.

Phase 5 — Directory + Custom Fields + Excel
Service + Route Handlers: list/search users (?q=&role=&station=&plate=),
CRUD custom field defs, POST /api/import/users, GET /api/export/users.
Excel import: parse with xlsx, validate each row with Zod, produce a per-row
error report (row number + reason); never commit a partially valid file silently.
features/directory/ UI: DataTable + multi-criteria search + dynamic profile fields
FileDrop with parse-preview before commit.
✅ Checkpoint: build + lint pass; bad rows produce a downloadable error report.

Phase 6 — Roster + Shift Calendar
POST /api/roster/upload — parse Excel/PDF → normalized rows → map to Shifts.
Ambiguous mappings go to an admin review queue (never auto-commit).
GET /api/shifts/me, GET /api/shifts (admin).
features/roster/ UI: jalali month calendar with shift-code chips (DESIGN §8),
admin upload + review screen.
✅ Checkpoint: build + lint pass; a sample roster yields correct per-user shifts.

Phase 7 — Shift Swapping
POST /api/swap-requests, /accept, /approve, GET /inbox (manager kartabl).
Rule engine: min rest hours, max consecutive shifts, role parity. State machine per DESIGN.
features/swap/ UI: request flow + manager inbox.
✅ Checkpoint: build + lint pass; rule violations are blocked with a clear reason.

Phase 8 — Safety Bulletins (mandatory read-receipts)
POST /api/bulletins, GET /api/bulletins/pending, POST /:id/acknowledge,
GET /:id/receipts (admin dashboard with % seen).
Read-receipts are immutable: store time + device; never editable/deletable.
features/safety/ UI: non-dismissible modal (DESIGN §9) that blocks the app until acknowledged.
✅ Checkpoint: build + lint pass; UI is blocked until acknowledged; receipt persisted.

Phase 9 — Fault Ticketing
POST /api/tickets (photo + annotations + wagon/equipment code), GET /api/tickets,
POST /:id/status. Status workflow per DESIGN.
features/tickets/ UI: camera/upload + on-image annotation + priority + repair-unit kartabl.
✅ Checkpoint: build + lint pass; a ticket flows submitted → in-repair → resolved.

Phase 10 — Polish & Handoff
App shell: sidebar nav, ThemeToggle, role-aware menu.
Seed demo data for all modules. Write README.md with run instructions.
Final pass: a11y (keyboard + focus rings), RTL audit, fa-IR digits everywhere.
✅ Final checkpoint:

npm run dev clean, npm run build passes, npm run lint zero errors
All Phase 1 acceptance criteria from AGENTS.md "Definition of done" hold
Rules of engagement
Small, reviewable commits; conventional messages (feat:, fix:, test:, docs:).
Zod DTO + RBAC guard + at least one unit test per endpoint.
Ask before adding heavy new dependencies.
Keep all user-facing text Persian and RTL-correct.
Stop and summarize after each numbered phase so I can review.