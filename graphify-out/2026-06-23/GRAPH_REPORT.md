# Graph Report - .  (2026-06-23)

## Corpus Check
- Corpus is ~25,738 words - fits in a single context window. You may not need a graph.

## Summary
- 250 nodes · 227 edges · 103 communities (12 shown, 91 thin omitted)
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.84)
- Token cost: 18,500 input · 3,200 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Routes & RBAC|API Routes & RBAC]]
- [[_COMMUNITY_Service Layer & Validation|Service Layer & Validation]]
- [[_COMMUNITY_Database Schema & ORM|Database Schema & ORM]]
- [[_COMMUNITY_UI Components & Layout|UI Components & Layout]]
- [[_COMMUNITY_Pages & Client State|Pages & Client State]]
- [[_COMMUNITY_Build Config & Documentation|Build Config & Documentation]]
- [[_COMMUNITY_Design System & Branding|Design System & Branding]]
- [[_COMMUNITY_Tech Stack Overview|Tech Stack Overview]]
- [[_COMMUNITY_Auth & Bulletin Routes|Auth & Bulletin Routes]]
- [[_COMMUNITY_Data Display Components|Data Display Components]]
- [[_COMMUNITY_Session & Auth Store|Session & Auth Store]]
- [[_COMMUNITY_Registration Flow|Registration Flow]]
- [[_COMMUNITY_Swap Request Actions|Swap Request Actions]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
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
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]

## God Nodes (most connected - your core abstractions)
1. `prisma` - 13 edges
2. `prisma/seed.ts` - 12 edges
3. `User table` - 12 edges
4. `getSessionUser` - 10 edges
5. `POST /api/admin/users/[id]/approve` - 10 edges
6. `DESIGN.md - Design System` - 10 edges
7. `DashboardPage` - 9 edges
8. `useAuthStore (Zustand)` - 9 edges
9. `GET /api/users` - 9 edges
10. `Prisma PROMPT.md - Build Prompt` - 9 edges

## Surprising Connections (you probably didn't know these)
- `FileDrop` --semantically_similar_to--> `TicketForm`  [INFERRED] [semantically similar]
  src/components/shared/file-drop.tsx → D:/zanjirenabodii/app/metro-line1-app/src/components/shared/ticket-form.tsx
- `BulletinGuard` --semantically_similar_to--> `ErrorBoundary`  [INFERRED] [semantically similar]
  D:/zanjirenabodii/app/metro-line1-app/src/components/shared/bulletin-guard.tsx → src/components/shared/error-boundary.tsx
- `Jalali Calendar Integration` --implements--> `dayjs-jalali TypeScript Declaration`  [INFERRED]
  prisma/PROMPT.md → src/types/dayjs-jalali.d.ts
- `AppLayout` --references--> `Mandatory safety bulletin read-receipt`  [INFERRED]
  src/app/(app)/layout.tsx → metro-line1-app/src/app/(app)/layout.tsx
- `ShiftsPage` --references--> `Persian RTL localization`  [INFERRED]
  src/app/(app)/shifts/page.tsx → metro-line1-app/package.json

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

## Communities (103 total, 91 thin omitted)

### Community 0 - "API Routes & RBAC"
Cohesion: 0.08
Nodes (34): POST /api/admin/users/[id]/approve, approveUserSchema (auth DTO), verifyAccessToken, GET /api/bulletins/[id]/receipts, GET/POST /api/bulletins, PATCH/DELETE /api/custom-fields/[id], GET/POST /api/custom-fields, createCustomFieldDef (+26 more)

### Community 1 - "Service Layer & Validation"
Cohesion: 0.11
Nodes (24): exportUsersToExcel, generateErrorReport, importUsersFromExcel, listUsers, userImportRowSchema, userSearchSchema, createBulletinSchema, createTicketSchema (+16 more)

### Community 2 - "Database Schema & ORM"
Cohesion: 0.16
Nodes (19): Audit logging on every mutation, PrismaLibSql adapter, AuditLog table, CustomFieldDef table, ImportJob table, ReadReceipt table, roles table, RosterFile table (+11 more)

### Community 3 - "UI Components & Layout"
Cohesion: 0.14
Nodes (19): AppLayout, RootLayout, BulletinGuard component, Badge, BulletinGuard, Button, Card, Dialog (+11 more)

### Community 4 - "Pages & Client State"
Cohesion: 0.23
Nodes (18): useAuthStore (Zustand), AdminBulletinsPage, DashboardPage, DataTable component, DirectoryPage, FileDrop component, SwapInboxPage, JWT auth with access + refresh tokens (+10 more)

### Community 5 - "Build Config & Documentation"
Cohesion: 0.17
Nodes (13): AGENTS.md - Agent Instructions, CLAUDE.md - Claude Code Instructions, dayjs-jalali TypeScript Declaration, Excel Import/Export with Error Reports, Image-Based Fault Ticketing, Jalali Calendar Integration, JWT Authentication Flow, Prisma PROMPT.md - Build Prompt (+5 more)

### Community 6 - "Design System & Branding"
Cohesion: 0.22
Nodes (11): Tailwind CSS v4 CSS-First Config, Dark Mode as Default, DESIGN.md - Design System, OKLCH Color System, Prisma AGENTS.md, Prisma DESIGN.md, RTL Persian Language Support, Safety-Critical Tool Design (+3 more)

### Community 8 - "Tech Stack Overview"
Cohesion: 0.50
Nodes (4): Next.js 16 App Router, Prisma 7 + SQLite (libsql), README.md - Project Documentation, Zustand State Management

### Community 9 - "Auth & Bulletin Routes"
Cohesion: 0.67
Nodes (3): POST /api/auth/login, POST /api/bulletins/[id]/acknowledge, GET /api/bulletins/pending

### Community 10 - "Data Display Components"
Cohesion: 0.67
Nodes (3): DataTable, EmptyState, Table

### Community 11 - "Session & Auth Store"
Cohesion: 0.67
Nodes (3): AuthUser, SessionUser, useAuthStore

## Knowledge Gaps
- **147 isolated node(s):** `PendingApprovalPage`, `POST`, `POST`, `POST`, `POST` (+142 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **91 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `POST /api/admin/users/[id]/approve` connect `API Routes & RBAC` to `Database Schema & ORM`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `RBAC system (super_admin / admin / operator)` connect `Database Schema & ORM` to `API Routes & RBAC`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `User table` (e.g. with `prisma.config.ts` and `Prisma client singleton`) actually correct?**
  _`User table` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `getSessionUser` (e.g. with `requirePermission` and `requireRole`) actually correct?**
  _`getSessionUser` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `POST /api/admin/users/[id]/approve` (e.g. with `Audit logging on every mutation` and `RBAC system (super_admin / admin / operator)`) actually correct?**
  _`POST /api/admin/users/[id]/approve` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PendingApprovalPage`, `POST`, `POST` to the rest of the system?**
  _148 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Routes & RBAC` be split into smaller, more focused modules?**
  _Cohesion score 0.08199643493761141 - nodes in this community are weakly interconnected._