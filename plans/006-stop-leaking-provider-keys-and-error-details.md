# Plan 006: Stop exposing AI provider API keys and raw error messages to clients

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1a7f043..HEAD -- src/app/api/admin/ai-providers`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `1a7f043`, 2026-07-11

## Why this matters

The admin AI-providers API returns full provider rows — including the
third-party `apiKey` (OpenAI / Gemini) — to any admin client, and the update
route writes the full before/after records (again including the key) into the
`auditLog` table in plaintext. So provider secrets are both shipped to the
browser and persisted where a wider audience or an export could read them.
Separately, both routes return `error.message` straight to the client on
failure, leaking internal implementation detail. This plan masks the key in
responses, redacts it in the audit trail, and returns generic error messages
while logging the real ones server-side.

**Handling note:** treat any real key values you encounter as secrets — do not
copy them into commits, test fixtures, or your report. Reference the field by
name only.

## Current state

- `src/app/api/admin/ai-providers/route.ts:28-35` — GET returns unfiltered rows:

```ts
    const providers = await prisma.aiProvider.findMany({
      orderBy: { priority: 'asc' }
    })
    return NextResponse.json({ data: providers })   // includes apiKey
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت پروایدرها' }, { status: 500 })
  }
```

- `src/app/api/admin/ai-providers/[id]/route.ts:44-67` — update writes the key
  into the audit log and leaks `error.message`:

```ts
    const provider = await prisma.aiProvider.update({ where: { id }, data: { ...parsed.data, ... } })
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id, entity: 'AiProvider', entityId: id, action: 'update',
        before,                 // full record incl. apiKey
        after: parsed.data      // incl. apiKey
      }
    }).catch(() => {})
    return NextResponse.json({ data: provider })     // includes apiKey
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در ویرایش پروایدر' }, { status: 500 })
  }
```

- The schema field is `apiKey` (see `aiProviderSchema` at the top of
  `route.ts`, line 10: `apiKey: z.string().optional().nullable()`).

- Repo conventions: routes guard with `getSessionUser` + `requireRole`; error
  responses are `{ error: '<Persian message>' }`. Server-side logging via
  `console.error` is acceptable on error paths.

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Install   | `npm install`       | exit 0              |
| Typecheck | `npm run typecheck` | exit 0, no errors   |
| Tests     | `npm run test`      | all pass            |
| Lint      | `npm run lint`      | exit 0              |

Note: `npm run build` fails on Windows shells (inline `NODE_OPTIONS`); do not use it as a gate.

## Scope

**In scope** (the only files you should modify):
- `src/app/api/admin/ai-providers/route.ts`
- `src/app/api/admin/ai-providers/[id]/route.ts`

**Out of scope** (do NOT touch, even though they look related):
- The `aiProvider` Prisma model / schema — no schema change; masking happens
  at the API boundary. (The key still needs storing so the gateway can use it.)
- The AI gateway/adapters that read `apiKey` server-side — they must keep
  reading the real value; only the HTTP responses and audit log change.
- The ~40 other routes that return `error.message` (a broader hardening pass)
  — this plan fixes only the two provider routes. Note the pattern in NOTES.

## Git workflow

- Branch: `advisor/006-mask-provider-keys`
- Commit style: conventional commits, e.g. `security: mask AI provider keys in responses and audit log, sanitize errors`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Mask apiKey in the GET response

In `src/app/api/admin/ai-providers/route.ts`, after fetching `providers`, map
each row to replace `apiKey` with a masked indicator (never the raw value):

```ts
    const masked = providers.map(({ apiKey, ...rest }) => ({
      ...rest,
      apiKeySet: Boolean(apiKey),
    }))
    return NextResponse.json({ data: masked })
```

The client only needs to know whether a key is configured, not its value.
If the admin UI displays a masked key, `apiKeySet` (boolean) is enough; adjust
only if a STOP condition arises (see below).

**Verify**: `npm run typecheck` → exit 0. `grep -n "data: providers" src/app/api/admin/ai-providers/route.ts` → no matches (replaced by `masked`).

### Step 2: Redact apiKey from the audit log and mask it in the update response

In `src/app/api/admin/ai-providers/[id]/route.ts`:

- Build redacted copies for the audit log so the key never lands in the table:

```ts
    const redact = <T extends Record<string, unknown>>(o: T) =>
      ({ ...o, apiKey: o.apiKey ? '***REDACTED***' : o.apiKey })
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id, entity: 'AiProvider', entityId: id, action: 'update',
        before: redact(before as Record<string, unknown>),
        after: redact(parsed.data as Record<string, unknown>),
      }
    }).catch(() => {})
```

- Mask the returned provider the same way as Step 1:

```ts
    const { apiKey: _omit, ...safeProvider } = provider
    return NextResponse.json({ data: { ...safeProvider, apiKeySet: Boolean(provider.apiKey) } })
```

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Return generic errors, log details server-side

In both files, replace the `catch (error: any) { ... error.message ... }`
blocks with a generic client message plus a server-side log:

```ts
  } catch (error) {
    console.error('[ai-providers] request failed', error)
    return NextResponse.json({ error: 'خطا در پردازش درخواست' }, { status: 500 })
  }
```

(Keep each route's existing Persian wording if you prefer — the requirement is
that `error.message` is no longer sent to the client.)

**Verify**: `grep -n "error.message" src/app/api/admin/ai-providers/route.ts src/app/api/admin/ai-providers/[id]/route.ts` → no matches.

### Step 4: Full verification

**Verify**: `npm run typecheck` → exit 0. `npm run test` → all pass. `npm run lint` → exit 0.

## Test plan

These are thin route handlers over Prisma; the codebase has no route-level
test harness (all tests are service-level). Rather than stand one up here,
verification is by grep-level done criteria plus typecheck. If the executor's
environment already has a route test pattern, add one asserting the GET
response contains `apiKeySet` and not `apiKey`; otherwise skip and note it.

Verification: `npm run typecheck` + `npm run test` (existing suite unaffected).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "apiKey" src/app/api/admin/ai-providers/route.ts` → key only appears in the destructure that omits it, never in a returned object
- [ ] GET response uses `apiKeySet` boolean, not the raw `apiKey`
- [ ] Audit-log `before`/`after` in `[id]/route.ts` pass through a redact helper
- [ ] `grep -n "error.message" src/app/api/admin/ai-providers/route.ts src/app/api/admin/ai-providers/[id]/route.ts` → no matches
- [ ] `npm run typecheck` exits 0; `npm run test` all pass; `npm run lint` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- The admin UI genuinely needs to display or edit the existing key value (check
  `src/app/(app)/admin/ai-providers/page.tsx`) — if so, report how the UI uses
  the field before masking, so the masking approach can be adjusted (e.g. show
  last 4 chars) rather than breaking the edit flow.
- Any provider `apiKey` value is exposed in a place this plan doesn't cover —
  report the location (by field/path, never the value).
- A verification fails twice after a reasonable fix attempt.

## Maintenance notes

- **Rotation**: because these keys were previously returned to clients and
  written to the audit log in plaintext, treat them as potentially exposed and
  rotate the affected OpenAI/Gemini keys after this lands. Masking prevents
  future exposure but does not un-expose what already leaked.
- The `error.message`-to-client pattern exists in ~40 other routes; this plan
  fixes only the two most sensitive. A follow-up should introduce a shared
  error responder (`respondError(err, userMessage)`) and apply it repo-wide.
- Reviewer should scrutinize: that the AI gateway still reads the real
  `apiKey` server-side (masking must not touch the storage/use path), and that
  no test fixture or log now contains a real key.
