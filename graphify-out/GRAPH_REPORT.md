# Graph Report - metro-line1-app  (2026-06-23)

## Corpus Check
- 147 files · ~46,401 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 798 nodes · 1564 edges · 66 communities (51 shown, 15 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c04ff8f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_API Routes & RBAC|API Routes & RBAC]]
- [[_COMMUNITY_Service Layer & Validation|Service Layer & Validation]]
- [[_COMMUNITY_Database Schema & ORM|Database Schema & ORM]]
- [[_COMMUNITY_UI Components & Layout|UI Components & Layout]]
- [[_COMMUNITY_Pages & Client State|Pages & Client State]]
- [[_COMMUNITY_Build Config & Documentation|Build Config & Documentation]]
- [[_COMMUNITY_Design System & Branding|Design System & Branding]]
- [[_COMMUNITY_Tooling Configuration|Tooling Configuration]]
- [[_COMMUNITY_Tech Stack Overview|Tech Stack Overview]]
- [[_COMMUNITY_Auth & Bulletin Routes|Auth & Bulletin Routes]]
- [[_COMMUNITY_Data Display Components|Data Display Components]]
- [[_COMMUNITY_Session & Auth Store|Session & Auth Store]]
- [[_COMMUNITY_Registration Flow|Registration Flow]]
- [[_COMMUNITY_Swap Request Actions|Swap Request Actions]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]

## God Nodes (most connected - your core abstractions)
1. `getSessionUser()` - 81 edges
2. `authErrorResponse()` - 78 edges
3. `cn()` - 53 edges
4. `requireRole()` - 43 edges
5. `prisma` - 35 edges
6. `useAuthStore` - 27 edges
7. `Button()` - 21 edges
8. `طرح جامع اپلیکیشن اطلاع‌رسانی و پرسنلی سیر و حرکت — خط یک مترو` - 17 edges
9. `Card()` - 16 edges
10. `CardContent()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Jalali Calendar Integration` --implements--> `dayjs-jalali TypeScript Declaration`  [INFERRED]
  prisma/PROMPT.md → src/types/dayjs-jalali.d.ts
- `Prisma AGENTS.md` --semantically_similar_to--> `DESIGN.md - Design System`  [EXTRACTED] [semantically similar]
  prisma/AGENTS.md → DESIGN.md
- `useAuthStore` --references--> `SessionUser`  [EXTRACTED]
  mobile/src/stores/auth.ts → src/stores/auth.ts
- `FileDrop()` --semantically_similar_to--> `TicketForm`  [INFERRED] [semantically similar]
  src/components/shared/file-drop.tsx → src/components/shared/ticket-form.tsx
- `parseRosterExcel()` --semantically_similar_to--> `importUsersFromExcel()`  [INFERRED] [semantically similar]
  src/server/modules/roster/service.ts → src/server/modules/directory/import.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Authentication flow (register → pending-approval → login → dashboard)** — register_page, pending_approval_page, login_page, dashboard_page, auth_store, jwt_auth, rbac_guard [EXTRACTED 0.95]
- **Core database schema (User为中心的FK关系网)** — db_user, db_role, db_shift, db_swap_request, db_safety_bulletin, db_read_receipt, db_ticket, db_ticket_log, db_audit_log, db_import_job, db_roster_file, db_custom_field_def [EXTRACTED 1.00]
- **Safety bulletin system (creation → distribution → read-receipt tracking)** — bulletins_page, db_safety_bulletin, db_read_receipt, bulletin_guard, mandatory_read_receipt, app_layout [INFERRED 0.90]
- **hyper_auth_jwt_flow** —  [INFERRED 0.90]
- **hyper_bulletin_lifecycle** —  [INFERRED 0.95]
- **hyper_rbac_admin_routes** —  [INFERRED 0.95]
- **auth-dependent components** — metro_line1_bulletin_guard, metro_line1_shift_calendar, metro_line1_sidebar, metro_line1_ticket_form [EXTRACTED 1.00]
- **jalali-locale** — metro_line1_shift_calendar, metro_line1_fa [EXTRACTED 1.00]
- **overlay-pattern** — metro_line1_bulletin_guard, metro_line1_error_boundary [INFERRED 0.80]
- **authorization_middleware** —  [INFERRED]
- **dto_validation_layer** —  [INFERRED]
- **audit_trail_pattern** —  [INFERRED]
- **Core Technology Stack** — nextjs_16_app_router, prisma_sqlite, zustand_state, zod_validation, shadcn_new_york, css_first_tailwind [EXTRACTED 0.90]
- **Persian RTL Localization Layer** — rtl_persian_support, vazirmatn_font, jalali_calendar, dayjs_jalali_type_declaration [EXTRACTED 0.90]
- **Authentication & Security Layer** — jwt_auth_flow, rbac_role_hierarchy, zod_validation, audit_logging [EXTRACTED 0.90]

## Communities (66 total, 15 thin omitted)

### Community 0 - "API Routes & RBAC"
Cohesion: 0.15
Nodes (16): deletePost(), POST(), AuthError, AuthUser, requirePermission(), requireRole(), GET(), getBulletinReceipts() (+8 more)

### Community 1 - "Service Layer & Validation"
Cohesion: 0.28
Nodes (9): exportUsersToExcel(), generateErrorReport(), ImportError, ImportResult, importUsersFromExcel(), userImportRowSchema, prisma, GET() (+1 more)

### Community 3 - "UI Components & Layout"
Cohesion: 0.12
Nodes (21): AppLayout(), metadata, RootLayout(), Badge, BulletinGuard, Button, Card, Dialog (+13 more)

### Community 4 - "Pages & Client State"
Cohesion: 0.16
Nodes (14): DirectoryPage(), ImportResult, STATUS_CLASSES, STATUS_LABELS, UserRow, faTime(), persianDigits, toFa() (+6 more)

### Community 5 - "Build Config & Documentation"
Cohesion: 0.09
Nodes (23): AGENTS.md - Agent Instructions, CLAUDE.md - Claude Code Instructions, Tailwind CSS v4 CSS-First Config, Dark Mode as Default, dayjs-jalali TypeScript Declaration, DESIGN.md - Design System, Excel Import/Export with Error Reports, Image-Based Fault Ticketing (+15 more)

### Community 6 - "Design System & Branding"
Cohesion: 0.05
Nodes (41): الف) ساختار پروژه موبایل (React Native / TypeScript):, اهداف کوتاه‌مدت, ب) ساختار پروژه موبایل (Flutter / Dart):, ج) راهبرد Geofencing و SOS:, طرح جامع اپلیکیشن اطلاع‌رسانی و پرسنلی سیر و حرکت — خط یک مترو, فاز ۱: راه‌اندازی هسته سیستم و پایگاه داده (MVP Core), فاز ۲: سیستم ارتباطات بلادرنگ و مدیریت لوحه شیفت, فاز ۳: توسعه کلاینت موبایل (Cross-Platform Mobile App) (+33 more)

### Community 7 - "Tooling Configuration"
Cohesion: 0.08
Nodes (25): MetroTheme, Tab, ChatMessage, ChatRoom, ChatState, useChatStore, AIAssistantScreen(), Message (+17 more)

### Community 8 - "Tech Stack Overview"
Cohesion: 0.50
Nodes (4): Next.js 16 App Router, Prisma 7 + SQLite (libsql), README.md - Project Documentation, Zustand State Management

### Community 9 - "Auth & Bulletin Routes"
Cohesion: 0.11
Nodes (25): assertMember(), createGroupRoom(), getOrCreateDirectRoom(), listMessages(), listRoomsForUser(), markRead(), MessageView, pinMessage() (+17 more)

### Community 10 - "Data Display Components"
Cohesion: 0.67
Nodes (3): DataTable, EmptyState, Table

### Community 11 - "Session & Auth Store"
Cohesion: 0.50
Nodes (3): AuthState, useAuthStore, SessionUser

### Community 12 - "Registration Flow"
Cohesion: 0.18
Nodes (14): DashboardStats, PendingApprovalPage(), Bulletin, ErrorBoundaryProps, ErrorState, RuleViolation, SHIFT_LABELS, ShiftOption (+6 more)

### Community 13 - "Swap Request Actions"
Cohesion: 0.06
Nodes (30): dependencies, dayjs, expo, expo-status-bar, lucide-react-native, react, react-dom, react-native (+22 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (15): POST(), RosterUploadInput, rosterUploadSchema, SwapActionInput, swapActionSchema, SwapRequestInput, swapRequestSchema, POST() (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.24
Nodes (10): POST(), GET(), POST(), CreateBulletinInput, createBulletinSchema, GET(), acknowledgeBulletin(), createBulletin() (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (28): AccessTokenPayload, getAccessSecret(), getRefreshSecret(), issueAccessToken(), issueRefreshToken(), RefreshTokenPayload, verifyAccessToken(), verifyRefreshToken() (+20 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (19): AdminBulletinsPage(), Bulletin, AdminPost, EMPTY_FORM, FormState, Annotation, TicketFormProps, TYPE_LABELS (+11 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (21): GET(), POST(), addComment(), createPost(), emptyToNull(), listComments(), listPosts(), listPostsAdmin() (+13 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (26): dependencies, @base-ui/react, bcryptjs, class-variance-authority, clsx, dayjs, dayjs-jalali, dotenv (+18 more)

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 22 - "Community 22"
Cohesion: 0.09
Nodes (21): backgroundColor, foregroundImage, adaptiveIcon, package, expo, android, icon, ios (+13 more)

### Community 23 - "Community 23"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (16): devDependencies, eslint, eslint-config-next, prettier, prettier-plugin-tailwindcss, prisma, tailwindcss, @tailwindcss/postcss (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (15): Auth & RBAC, Demo Accounts, Directory (دفتر تلفن), Environment Variables, Fault Ticketing (تیکتینگ خرابی), Features, License, Project Structure (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (8): jalaliDate(), jalaliDaysInMonth(), Shift, SHIFT_COLORS, SHIFT_LABELS, ShiftCalendar(), ShiftCalendarProps, AdminShiftsPage()

### Community 27 - "Community 27"
Cohesion: 0.28
Nodes (5): ChatView(), useAuthStore, ChatThread(), ChatThreadProps, MessageComposer()

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (18): GET(), POST(), createCustomFieldDef(), deleteCustomFieldDef(), getCustomFieldDef(), listCustomFieldDefs(), updateCustomFieldDef(), listUsers() (+10 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (8): shadcn/ui رسمی — قواعد ترکیب کامپوننت، تشخیص RSC و نسخهٔ Tailwind، رنگ‌های سمنتیک, Tailwind v4 + shadcn یکپارچه (دقیقاً منطبق با پشتهٔ پروژه), بانک سبک‌ها: +۵۰ استایل، ۱۶۱ ترکیب رنگ، ۵۷ جفت فونت، ۹۹ اصل UX, راهنمای کامل Framer Motion (variants، stagger، ترنزیشن صفحه، ژست‌ها), سیستم طراحی Tailwind v4 «CSS-first» (@theme، CVA، dark mode، انیمیشن نیتیو), طراحی حرفه‌ای با ضدالگوها (تایپوگرافی، رنگ، چیدمان، حرکت), قواعد انیمیشن UI: فقط transform/opacity، تایمینگ ۲۰۰–۳۰۰ms، prefers-reduced-motion, مهندسی UI + معماری کامپوننت + دسترس‌پذیری WCAG 2.1 AA (مهم برای فاز ۱۰)

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (7): ChatMessage, ChatRoom, ChatState, useChatStore, addMessage(), handleIncoming(), SetState

### Community 31 - "Community 31"
Cohesion: 0.32
Nodes (5): SHIFT_LABELS, STATUS_LABELS, SwapRequest, Badge(), badgeVariants

### Community 32 - "Community 32"
Cohesion: 0.50
Nodes (6): getRolePermissions(), hasMinRole(), hasPermission(), Permission, PERMISSION_MATRIX, ROLE_HIERARCHY

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (6): TicketForm(), PRIORITY_CLASSES, PRIORITY_LABELS, STATUS_CLASSES, STATUS_LABELS, Ticket

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (6): compilerOptions, baseUrl, paths, strict, extends, @/*

### Community 35 - "Community 35"
Cohesion: 0.43
Nodes (4): StorageDriver, StoredFile, localStorageDriver, UPLOAD_ROOT

### Community 36 - "Community 36"
Cohesion: 0.33
Nodes (5): name, prisma, seed, private, version

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 38 - "Community 38"
Cohesion: 0.50
Nodes (3): Column, DataTable(), DataTableProps

### Community 53 - "Community 53"
Cohesion: 0.25
Nodes (11): CreateTicketInput, createTicketSchema, UpdateTicketStatusInput, updateTicketStatusSchema, POST(), GET(), POST(), createTicket() (+3 more)

### Community 59 - "Community 59"
Cohesion: 0.16
Nodes (18): aiQuerySchema, POST(), RULEBOOK_DATABASE, calculateDistance(), checkInSchema, METRO_LINE1_STATIONS, POST(), getPostBySlug() (+10 more)

### Community 61 - "Community 61"
Cohesion: 0.17
Nodes (11): PostCard, TYPE_FILTERS, jalali(), Attachment, MessageComposerProps, CommentItem, PostDetail, PostDetailPage() (+3 more)

### Community 62 - "Community 62"
Cohesion: 0.13
Nodes (22): cn(), Skeleton(), SkeletonProps, CardAction(), CardFooter(), SelectContent(), SelectGroup(), SelectItem() (+14 more)

### Community 66 - "Community 66"
Cohesion: 0.39
Nodes (6): GET(), getAllShifts(), getShiftsByMonth(), getUserShifts(), ShiftWithUser, GET()

### Community 76 - "Community 76"
Cohesion: 0.29
Nodes (9): applyRosterToShifts(), CODE_MAP, jalaliToGregorian(), normalizeCode(), ParsedRoster, parseRosterExcel(), RosterImportResult, RosterRow (+1 more)

## Knowledge Gaps
- **338 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+333 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuthStore` connect `Community 27` to `Community 33`, `UI Components & Layout`, `Pages & Client State`, `Tooling Configuration`, `Community 39`, `Session & Auth Store`, `Registration Flow`, `Community 18`, `Community 26`, `Community 61`, `Community 31`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `prisma` connect `Service Layer & Validation` to `Community 66`, `Auth & Bulletin Routes`, `Community 76`, `Community 14`, `Community 15`, `Community 17`, `Community 19`, `Community 53`, `Community 59`, `Community 28`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `SessionUser` connect `Session & Auth Store` to `API Routes & RBAC`, `Community 27`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `getSessionUser()` (e.g. with `requirePermission()` and `requireRole()`) actually correct?**
  _`getSessionUser()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `authErrorResponse()` (e.g. with `POST()` and `POST()`) actually correct?**
  _`authErrorResponse()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `requireRole()` (e.g. with `getSessionUser()` and `POST()`) actually correct?**
  _`requireRole()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _338 weakly-connected nodes found - possible documentation gaps or missing edges._