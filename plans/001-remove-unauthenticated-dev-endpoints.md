# Plan 001: Remove unauthenticated dev endpoints and the config-file data dump

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1a7f043..HEAD -- src/app/api/dev src/middleware.ts next.config.js`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `1a7f043`, 2026-07-11

## Why this matters

The middleware whitelists `/api/dev` and `/api/seed` as public paths, so any
anonymous HTTP request can reach them. `GET /api/dev/generate` runs
`execSync('npx prisma generate')` — anonymous server-side command execution.
`GET /api/dev/seed` calls `deleteMany()` on UI Builder tables and reseeds them —
anonymous data destruction. Separately, `next.config.js` contains top-level
debug code that reads a roster Excel file and writes its contents to
`temp-data.json` in the project root on every server start, silently dumping
operational data to an unprotected file. This plan removes all three exposures.

## Current state

- `src/app/api/dev/generate/route.ts` — the RCE-shaped endpoint. Entire file (19 lines):

```ts
// src/app/api/dev/generate/route.ts:1-19
import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  try {
    const output = execSync('npx prisma generate', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      env: process.env
    })
    return NextResponse.json({ success: true, output })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stderr: error.stderr
    }, { status: 500 })
  }
}
```

- `src/app/api/dev/seed/route.ts` — anonymous DB truncate + reseed. Begins:

```ts
// src/app/api/dev/seed/route.ts:5-12
export async function GET() {
  try {
    // 1. Clear UI Builder tables
    await prisma.uiMenuItem.deleteMany().catch(() => {})
    await prisma.uiDashboardWidget.deleteMany().catch(() => {})
    ...
```

- `src/middleware.ts:4-12` — the public-path whitelist that exempts these routes from JWT verification:

```ts
const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/config',
  '/api/seed',
  '/api/dev',
  '/api/ui/bootstrap',
]
```

- `next.config.js:1-29` — imperative debug code at module top level (before the
  actual `nextConfig` object at line 31). It requires `fs`, `path`, `xlsx`,
  reads `lohe/loheadi (2).xlsx`, and writes `temp-data.json` /
  `temp-error.txt` to the project root. Lines 31-49 contain the real config
  (`serverExternalPackages`, `headers()`), which must be preserved.

- Repo conventions: API errors are returned as
  `NextResponse.json({ error: '<Persian message>' }, { status: N })` — see
  `src/app/api/auth/login/route.ts:27-31`. Auth guard pattern is
  `getSessionUser(request)` + `requireRole(sessionUser, 'admin')` from
  `@/server/rbac/guard` — see `src/app/api/admin/ai-providers/route.ts:21-26`
  as the exemplar.

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Install   | `npm install`       | exit 0              |
| Typecheck | `npm run typecheck` | exit 0, no errors   |
| Tests     | `npm run test`      | all pass            |
| Lint      | `npm run lint`      | exit 0              |

Note: `npm run build` sets `NODE_OPTIONS` inline, which fails in Windows
`cmd`/PowerShell. Do not use it as a gate; typecheck + test + lint suffice.

## Scope

**In scope** (the only files you should modify):
- `src/app/api/dev/generate/route.ts` (delete)
- `src/app/api/dev/seed/route.ts` (modify — add guards)
- `src/middleware.ts` (modify — shrink whitelist)
- `next.config.js` (modify — remove debug block)
- `temp-data.json`, `temp-error.txt` in repo root (delete if present)

**Out of scope** (do NOT touch, even though they look related):
- `src/app/api/config/route.ts` and `/api/ui/bootstrap` — intentionally public
  (app bootstrap before login).
- `prisma/seed.ts`, `src/server/db-seed.ts` — CLI-invoked seeds, not HTTP.
- Any other entry in `PUBLIC_API_PATHS` besides `/api/seed` and `/api/dev`.
- The CORS headers in `next.config.js` `headers()` — covered by plan 004.

## Git workflow

- Branch: `advisor/001-remove-dev-endpoints`
- Commit style: conventional commits, e.g. `fix: remove unauthenticated dev endpoints and config debug dump` (matches `git log` history like `fix: resolve failing tests and update schema models for previous features`)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Delete the generate endpoint

Delete the file `src/app/api/dev/generate/route.ts` (and the now-empty
`generate/` directory). Running `prisma generate` over HTTP has no legitimate
production use; developers run `npx prisma generate` locally.

**Verify**: `npm run typecheck` → exit 0. Then confirm no references:
`grep -rn "api/dev/generate" src/` → no matches.

### Step 2: Gate the seed endpoint behind super_admin + non-production

In `src/app/api/dev/seed/route.ts`, add at the top of the `GET` handler
(before any `deleteMany`):

```ts
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'در دسترس نیست' }, { status: 404 })
  }
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)
  const roleErr = await requireRole(sessionUser, 'super_admin')
  if (roleErr) return authErrorResponse(roleErr)
  // ...existing seed logic unchanged
```

Change the handler signature to accept `request: Request` if it does not already.

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Remove `/api/dev` and `/api/seed` from the middleware whitelist

In `src/middleware.ts`, delete the `'/api/seed',` and `'/api/dev',` lines from
`PUBLIC_API_PATHS`. (Note: with Step 2's guard reading the Authorization
header itself, middleware JWT verification is now also correctly applied.)
Check whether a route `src/app/api/seed/` exists separately from
`src/app/api/dev/seed/` — if it does, it now requires a JWT like every other
route, which is the intended behavior.

**Verify**: `npm run typecheck` → exit 0. `grep -n "api/dev\|api/seed" src/middleware.ts` → no matches.

### Step 4: Remove the debug block from next.config.js

Delete lines 1-29 of `next.config.js` (the `fs`/`path`/`XLSX` requires and the
try/catch that writes `temp-data.json` / `temp-error.txt`). The file should
begin with the `/** @type {import('next').NextConfig} */` comment. Preserve
everything from that comment to the end (`serverExternalPackages`, `headers()`,
`module.exports`). Also delete `temp-data.json` and `temp-error.txt` from the
repo root if they exist.

**Verify**: `node -e "const c = require('./next.config.js'); console.log(JSON.stringify(Object.keys(c)))"` → prints `["serverExternalPackages","headers"]` and does NOT create `temp-data.json`. Check: `ls temp-data.json` → file not found.

### Step 5: Full verification

**Verify**: `npm run typecheck` → exit 0. `npm run test` → all pass. `npm run lint` → exit 0.

## Test plan

No new unit tests required (deleted/gated routes). The verification gates are:
- `grep -rn "execSync" src/app/api/` → no matches.
- Existing suite passes unchanged (`npm run test`).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `src/app/api/dev/generate/route.ts` does not exist
- [ ] `grep -n "'/api/dev'\|'/api/seed'" src/middleware.ts` → no matches
- [ ] `src/app/api/dev/seed/route.ts` contains `NODE_ENV === 'production'` check and `requireRole(sessionUser, 'super_admin')`
- [ ] First line region of `next.config.js` has no `require('xlsx')` / `require('fs')`
- [ ] `npm run typecheck` exits 0; `npm run test` all pass; `npm run lint` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- You find code (client pages, mobile app, scripts) that calls
  `/api/dev/generate` at runtime — report the callers instead of deleting.
- `PUBLIC_API_PATHS` no longer contains `/api/dev` or `/api/seed` (someone
  already fixed it).
- A verification fails twice after a reasonable fix attempt.

## Maintenance notes

- Any future "dev convenience" endpoint must live behind the same
  NODE_ENV + super_admin double gate; better, use CLI scripts (`tsx scripts/...`).
- Reviewer should scrutinize: that the seed route's existing logic was not
  altered, only prefixed with guards; and that no other `PUBLIC_API_PATHS`
  entries were removed.
- Deferred: rate limiting and auth hardening on the remaining public auth
  endpoints (plan 002); CORS/header hardening in `next.config.js` (plan 004).
