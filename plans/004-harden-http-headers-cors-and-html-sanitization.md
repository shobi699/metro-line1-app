# Plan 004: Restrict CORS, add security headers, and sanitize database-sourced HTML

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1a7f043..HEAD -- next.config.js src/app/signage/page.tsx src/components/shared/mermaid-graph.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (CSP can break inline scripts/styles if too strict — Step 2 uses a report-friendly baseline)
- **Depends on**: 001 (both edit `next.config.js`; land 001 first to avoid a merge conflict)
- **Category**: security
- **Planned at**: commit `1a7f043`, 2026-07-11

## Why this matters

Three defense gaps compound each other. (1) `next.config.js` sets
`Access-Control-Allow-Origin: *` together with
`Access-Control-Allow-Credentials: true` on every `/api/*` route — an
intent to allow credentialed cross-origin calls from anywhere; behind a proxy
that reflects `Origin`, this becomes CSRF-via-CORS. (2) No response-hardening
headers exist anywhere (no CSP, `X-Frame-Options`, `X-Content-Type-Options`,
HSTS, `Referrer-Policy`), so there is no defense-in-depth. (3) Three components
render database-sourced HTML through `dangerouslySetInnerHTML` with no
sanitization — admin-authored signage HTML, learning-lesson content, and
Mermaid output rendered with `securityLevel: 'loose'`. Any actor who can write
that content can run script in every viewer's browser. Sanitization plus a CSP
closes the highest-impact XSS path in the app.

## Current state

- `next.config.js:34-46` — CORS-only headers:

```js
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "..." },
        ]
      }
    ]
  }
```

- `src/app/signage/page.tsx:426-431` — unsanitized admin HTML:

```tsx
{currentItem.type === 'custom_html' && (
  <div className="w-full h-full text-right"
    dangerouslySetInnerHTML={{ __html: currentItem.customHtml || '' }} />
)}
```

- `src/app/(app)/learning/courses/[id]/lessons/[lessonId]/page.tsx:124` —
  unsanitized lesson content:

```tsx
<div className="prose ..." dangerouslySetInnerHTML={{ __html: contentObj?.content || 'محتوای متنی یافت نشد.' }} />
```

- `src/components/shared/mermaid-graph.tsx:30` — `securityLevel: 'loose'`
  (allows script in rendered SVG); line 64 injects the SVG via
  `dangerouslySetInnerHTML`.

- No sanitizer dependency is installed (`grep` for `dompurify`/`sanitize` in
  `package.json` → none). This plan adds `isomorphic-dompurify` (works in both
  the RSC/server and client contexts this app mixes).

- Repo conventions: client components start with `'use client'`; shared UI
  lives under `src/components/shared/`; utility helpers under `src/lib/`.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Install   | `npm install`                    | exit 0              |
| Add dep   | `npm install isomorphic-dompurify` | exit 0, package.json updated |
| Typecheck | `npm run typecheck`              | exit 0, no errors   |
| Tests     | `npm run test`                   | all pass            |
| Lint      | `npm run lint`                   | exit 0              |

Note: adding a dependency mutates `package.json`/`package-lock.json` — that is
expected and in-scope for this plan (unlike the advisor, the executor may
install). `npm run build` fails on Windows shells (inline `NODE_OPTIONS`); do
not use it as a gate.

## Scope

**In scope** (the only files you should modify):
- `next.config.js` (headers)
- `src/lib/sanitize.ts` (create — shared sanitize helper)
- `src/app/signage/page.tsx` (sanitize the one `dangerouslySetInnerHTML`)
- `src/app/(app)/learning/courses/[id]/lessons/[lessonId]/page.tsx` (sanitize)
- `src/components/shared/mermaid-graph.tsx` (`securityLevel: 'strict'` + sanitize SVG)
- `package.json` / `package-lock.json` (new dep)

**Out of scope** (do NOT touch, even though they look related):
- The CORS *methods*/*headers* lines — keep them; only the origin/credentials
  posture changes.
- Any other `dangerouslySetInnerHTML` beyond the three named files — if `grep`
  finds more, list them in NOTES; do not fix opportunistically (scope creep).
- The `/api/dev` routes and middleware — plan 001 owns them.

## Git workflow

- Branch: `advisor/004-headers-cors-sanitize` (branch off after 001 merges)
- Commit style: conventional commits, e.g. `security: restrict CORS, add security headers, sanitize rendered HTML`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Restrict CORS

In `next.config.js` `headers()`, replace the wildcard origin with an
allowlist driven by an env var, defaulting to same-origin (no cross-origin)
when unset. Because bearer tokens (not cookies) carry auth in this app,
credentialed CORS is unnecessary — drop `Access-Control-Allow-Credentials`:

```js
const appOrigin = process.env.APP_ORIGIN || ''
// ...
        headers: [
          ...(appOrigin ? [{ key: "Access-Control-Allow-Origin", value: appOrigin }] : []),
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cache-Control" },
        ]
```

If the mobile app calls the API from a distinct origin, `APP_ORIGIN` should be
set to that origin in deployment; document it in `.env.example` as part of
this change.

**Verify**: `node -e "require('./next.config.js')"` → no error. `grep -n "Allow-Origin.*\*" next.config.js` → no matches.

### Step 2: Add response-hardening headers for all routes

Add a second entry to the array returned by `headers()`, `source: "/:path*"`,
with a conservative baseline:

```js
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ]
      }
```

Do NOT add a strict `Content-Security-Policy` in this step — Next.js needs
inline styles/scripts and a nonce pipeline to avoid breakage. Instead add a
**report-only** CSP so violations are visible without breaking the app:

```js
          { key: "Content-Security-Policy-Report-Only", value: "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'" },
```

**Verify**: `node -e "require('./next.config.js').headers().then(h => console.log(JSON.stringify(h.map(x=>x.source))))"` → includes `"/:path*"`. `npm run typecheck` → exit 0.

### Step 3: Create the shared sanitize helper

Create `src/lib/sanitize.ts`:

```ts
import DOMPurify from 'isomorphic-dompurify'

/** Sanitize untrusted HTML (DB-sourced) before dangerouslySetInnerHTML. */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } })
}

/** Sanitize SVG markup (e.g. Mermaid output) — allows SVG, forbids scripts. */
export function sanitizeSvg(dirty: string): string {
  return DOMPurify.sanitize(dirty, { USE_PROFILES: { svg: true, svgFilters: true } })
}
```

**Verify**: `npm run typecheck` → exit 0.

### Step 4: Apply sanitization at the three sinks

- `src/app/signage/page.tsx`: import `sanitizeHtml`, wrap:
  `dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentItem.customHtml || '') }}`.
- lessons page: `dangerouslySetInnerHTML={{ __html: sanitizeHtml(contentObj?.content || 'محتوای متنی یافت نشد.') }}`.
- `mermaid-graph.tsx`: change `securityLevel: 'loose'` → `'strict'`, and wrap
  the SVG injection: `dangerouslySetInnerHTML={{ __html: sanitizeSvg(svgCode) }}`.

**Verify**: `grep -rn "dangerouslySetInnerHTML" src/app/signage/page.tsx src/app/(app)/learning/courses src/components/shared/mermaid-graph.tsx` → every match is wrapped in `sanitizeHtml(` or `sanitizeSvg(`. `grep -n "securityLevel" src/components/shared/mermaid-graph.tsx` → shows `'strict'`.

### Step 5: Full verification

**Verify**: `npm run typecheck` → exit 0. `npm run test` → all pass. `npm run lint` → exit 0.

## Test plan

Add `src/lib/sanitize.test.ts` (model after `src/lib/csv.test.ts`, plain
Vitest). Cases:
- `sanitizeHtml('<b>ok</b><script>alert(1)</script>')` strips the `<script>`,
  keeps `<b>`.
- `sanitizeHtml('<img src=x onerror=alert(1)>')` strips the `onerror`
  attribute.
- `sanitizeSvg('<svg><script>alert(1)</script></svg>')` strips the script.

Verification: `npx vitest run src/lib/sanitize` → all pass (3 new tests).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "Allow-Origin" next.config.js` → no `"*"` value
- [ ] `next.config.js` `headers()` returns an entry with `X-Frame-Options` and `X-Content-Type-Options`
- [ ] `src/lib/sanitize.ts` exists and exports `sanitizeHtml` + `sanitizeSvg`
- [ ] All three named sinks wrap their `__html` in a sanitize call
- [ ] `grep -n "securityLevel: 'loose'" src/components/shared/mermaid-graph.tsx` → no matches
- [ ] `isomorphic-dompurify` present in `package.json` dependencies
- [ ] `npm run typecheck` exits 0; `npm run test` all pass (incl. sanitize tests); `npm run lint` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- `next.config.js` still contains the debug block from lines 1-29 (plan 001
  was supposed to remove it) — STOP; land 001 first.
- `isomorphic-dompurify` fails to build/typecheck in this Next 16 / React 19
  setup — report the error; do not swap to a different sanitizer without
  direction.
- `grep` finds additional `dangerouslySetInnerHTML` sinks — list them, don't
  fix them here.
- A verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The CSP is **report-only** deliberately. Follow-up: collect violation
  reports, tighten to an enforcing `Content-Security-Policy` with a nonce once
  the inline-script inventory is known. Do not flip to enforcing blind.
- Every future `dangerouslySetInnerHTML` on DB-sourced content must go through
  `src/lib/sanitize.ts`. Consider an ESLint `react/no-danger` rule to force review.
- Reviewer should scrutinize: that `APP_ORIGIN` is documented and set in
  deployment (otherwise cross-origin API calls from the mobile app break), and
  that sanitization did not strip legitimate rich-text formatting from lessons.
