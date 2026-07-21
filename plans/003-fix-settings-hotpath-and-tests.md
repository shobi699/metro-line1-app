# Plan 003: Fix the settings service hot path (per-read re-seed), dedupe default keys, and add characterization tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1a7f043..HEAD -- src/server/modules/settings`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (but the tests in Step 4 are the safety net for the Step 2 change — do them in order)
- **Category**: perf / bug / tests
- **Planned at**: commit `1a7f043`, 2026-07-11

## Why this matters

`getSettingValue(key, fallback)` is the most-called service function in the
codebase (invoked ~42 times across 14 modules, some inside per-shift loops).
Every single call first runs `ensureDefaultSettingsExist()`, which iterates
~87 default settings issuing a `findUnique` plus a conditional `update` for
each. So one swap-inbox render — which validates each pending request, each
validation calling `getSettingValue` several times inside a per-shift loop —
cascades into thousands of redundant queries against SQLite, which serializes
writes. This is the single largest performance sink in the system.

Two correctness bugs ride along in the same file: the `DEFAULT_SETTINGS`
array has 12 duplicate keys with divergent values (last-write-wins produces
silently wrong defaults on reset), and both `ensureDefaultSettingsExist` and
`getSettingValue` swallow every error with an empty `catch`, so a DB outage or
schema drift silently returns fallback values — dangerous when the fallback
governs a safety rule like `shifts.minRestHours`. The settings module has zero
tests today, so this plan adds them first as the safety net.

## Current state

- `src/server/modules/settings/service.ts:861-920` — the hot path:

```ts
export async function ensureDefaultSettingsExist() {
  try {
    for (const d of DEFAULT_SETTINGS) {
      const existing = await prisma.setting.findUnique({ where: { key: d.key } })
      if (!existing) {
        await prisma.setting.create({ data: { /* ... */ } })
      } else {
        const codeDefault = JSON.stringify(d.defaultValue)
        if (existing.defaultValue !== codeDefault) {
          await prisma.setting.update({ where: { key: d.key }, data: { defaultValue: codeDefault } })
        }
      }
    }
  } catch {
    // settings init failed silently
  }
}

export async function getSettingValue<T = string | number | boolean>(key: string, fallback: T): Promise<T> {
  try {
    await ensureDefaultSettingsExist()          // ← runs on EVERY read
    const setting = await prisma.setting.findUnique({ where: { key } })
    if (!setting || !setting.isEnabled) return fallback
    return JSON.parse(setting.value) as T
  } catch {
    return fallback
  }
}
```

- Duplicate keys in `DEFAULT_SETTINGS` (verified via
  `grep -n "key: '" ... | uniq -d`): `general.allowRegistration` (lines 46 &
  390 — different labels/descriptions), `download.title`, `general.appVersion`,
  `general.webVersion`, `general.developerText`, `general.socialLinks`,
  `download.description`, `download.web.url`, `download.android.type`,
  `download.android.value`, `download.ios.type`, `download.ios.value`. 12 keys
  total. Example of the divergence at lines 45-53 vs 389-396:

```ts
// line 46
{ key: 'general.allowRegistration', label: 'امکان ثبت‌نام عمومی', ... value: true, defaultValue: true }
// line 390 — SAME key, different label
{ key: 'general.allowRegistration', label: 'امکان ثبت‌نام مستقیم پرسنل', ... value: true, defaultValue: true }
```

- Caller inside a loop: `src/server/modules/swap/service.ts:92` calls
  `getSettingValue('shifts.minRestHours', 12)` inside the per-shift `for` loop
  at lines 69-100.

- Repo conventions: service tests live beside the service as
  `service.test.ts`, mock `@/server/db` with `vi.mock`. Exemplar:
  `src/server/modules/swap/service.test.ts:6-31` mocks the prisma client and
  `@/server/modules/settings`.

## Commands you will need

| Purpose   | Command                                          | Expected on success |
|-----------|--------------------------------------------------|---------------------|
| Install   | `npm install`                                    | exit 0              |
| Typecheck | `npm run typecheck`                              | exit 0, no errors   |
| Tests     | `npm run test`                                   | all pass            |
| One file  | `npx vitest run src/server/modules/settings`     | all pass            |
| Lint      | `npm run lint`                                   | exit 0              |

Note: `npm run build` sets `NODE_OPTIONS` inline and fails on Windows shells; do not use it as a gate.

## Scope

**In scope** (the only files you should modify):
- `src/server/modules/settings/service.ts`
- `src/server/modules/settings/service.test.ts` (create)

**Out of scope** (do NOT touch, even though they look related):
- Any caller of `getSettingValue` — the function signature and return
  semantics must stay identical so callers are unaffected.
- `prisma/schema.prisma` — no schema change; the fix is behavioral.
- Extracting `DEFAULT_SETTINGS` to its own file — that is a separate tech-debt
  cleanup (TECH-05), not this plan. Keep it inline; only remove duplicates.

## Git workflow

- Branch: `advisor/003-settings-hotpath`
- Commit style: conventional commits, e.g. `perf: cache settings init and dedupe defaults; add settings tests`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the characterization tests FIRST (before behavior changes)

Create `src/server/modules/settings/service.test.ts`, modeled on
`src/server/modules/swap/service.test.ts`. Mock `@/server/db`'s
`prisma.setting` with `findUnique`, `findMany`, `create`, `update` as
`vi.fn()`. Cover the current behavior so the Step 2 refactor is safe:

- `getSettingValue` returns the parsed `value` when the setting exists and is enabled.
- `getSettingValue` returns the fallback when the setting is missing.
- `getSettingValue` returns the fallback when `isEnabled` is false.
- `getSettingValue` returns the fallback when `prisma.setting.findUnique` throws.

**Verify**: `npx vitest run src/server/modules/settings` → all pass.

### Step 2: Make ensureDefaultSettingsExist run at most once per process

Add a module-scoped guard so the ~87-row reconcile loop runs a single time,
not on every read. Replace the top of `ensureDefaultSettingsExist`:

```ts
let defaultsEnsured: Promise<void> | null = null

export async function ensureDefaultSettingsExist(): Promise<void> {
  if (defaultsEnsured) return defaultsEnsured
  defaultsEnsured = (async () => {
    // ...existing for-loop body, but see Step 3 for the catch change
  })()
  return defaultsEnsured
}
```

Caching the *promise* (not a boolean) also collapses concurrent first-calls
into one run. Keep `getSettingValue` calling `await ensureDefaultSettingsExist()` —
after the first call it resolves instantly.

Add a test-only reset export so tests can force re-initialization:

```ts
/** Test helper — forces the next ensureDefaultSettingsExist call to re-run. */
export function __resetSettingsInitForTests() {
  defaultsEnsured = null
}
```

Add a test asserting that calling `getSettingValue` twice triggers the
reconcile loop's `findMany`/`findUnique`-per-default only on the first call
(assert `prisma.setting.create`/`update` mocks are not re-invoked the second
time when everything already exists).

**Verify**: `npx vitest run src/server/modules/settings` → all pass. `npm run typecheck` → exit 0.

### Step 3: Stop swallowing infrastructure errors silently

In `ensureDefaultSettingsExist`, change the bare `catch {}` to log and — since
initialization failure means the guarded promise should not be cached as
"succeeded" — reset the guard so a later call retries:

```ts
  } catch (err) {
    defaultsEnsured = null
    console.error('[settings] ensureDefaultSettingsExist failed', err)
  }
```

In `getSettingValue`, keep returning the fallback (callers depend on that
resilience) but log first:

```ts
  } catch (err) {
    console.error(`[settings] getSettingValue("${key}") failed; using fallback`, err)
    return fallback
  }
```

(These `console.error` calls are acceptable in server modules; AGENTS.md's
"no console.log" targets `console.log`, and error logging on a silent-failure
path is the lesser evil. If the repo later adds a structured logger, swap
these — noted in TECH-13.)

**Verify**: `npm run lint` → exit 0 (if `no-console` is configured as an error
for `console.error`, STOP and report — do not suppress).

### Step 4: Remove the 12 duplicate keys from DEFAULT_SETTINGS

For each duplicated key, keep exactly one entry and delete the other(s).
Decision rule: **keep the entry whose `label`/`description` reads as the
newer, more specific wording and whose `value` is non-empty**. For
`general.allowRegistration`, the two entries have identical `value`/
`defaultValue` (`true`/`true`) and differ only in label — keep the line 390
version (`'امکان ثبت‌نام مستقیم پرسنل'`, more specific) and delete line 46.
For any pair where `value` or `options` differ, keep the populated one and
report the discarded values in your NOTES so a human can confirm.

After editing, verify zero duplicates remain:

**Verify**: `grep -n "key: '" src/server/modules/settings/service.ts | sed "s/.*key: '//;s/'.*//" | sort | uniq -d` → prints nothing.

### Step 5: Full verification

**Verify**: `npm run typecheck` → exit 0. `npm run test` → all pass. `npm run lint` → exit 0.

## Test plan

New file `src/server/modules/settings/service.test.ts` (model after
`src/server/modules/swap/service.test.ts`):
- `getSettingValue`: exists+enabled → parsed value; missing → fallback;
  disabled → fallback; throws → fallback.
- `ensureDefaultSettingsExist`: idempotent — second `getSettingValue` call in
  the same process does not re-run creates/updates for already-existing keys.
- `__resetSettingsInitForTests` restores the re-run behavior.

Verification: `npx vitest run src/server/modules/settings` → all pass (≥6 new tests).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `src/server/modules/settings/service.test.ts` exists and passes
- [ ] `getSettingValue` still has the same signature `(key, fallback) => Promise<T>`
- [ ] `grep` for duplicate keys (Step 4 command) prints nothing
- [ ] `ensureDefaultSettingsExist` caches a module-scoped promise (guard present)
- [ ] Neither `catch` in the two functions is empty (`grep -n "catch {" src/server/modules/settings/service.ts` around lines 894/917 → no bare catch)
- [ ] `npm run typecheck` exits 0; `npm run test` all pass; `npm run lint` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- A duplicate-key pair has genuinely conflicting `value`/`options` where you
  cannot tell which is intended — report the pair and await direction rather
  than guessing.
- `no-console` lint is configured to error on `console.error` in server code.
- The once-per-process cache breaks an existing test that relied on
  `ensureDefaultSettingsExist` running every call.
- A verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The once-per-process guard means a runtime change to a setting's
  `defaultValue` in code will not re-sync until the process restarts. That is
  correct for `defaultValue` (code-owned); actual `value` reads still hit the
  DB every call, so admin edits via `updateSettings` remain live.
- If settings ever need per-request freshness of `defaultValue`, replace the
  boolean-promise guard with a short TTL cache rather than reverting to
  per-call reconcile.
- Follow-up deferred: extracting `DEFAULT_SETTINGS` (~850 lines) into
  `defaults.ts` (TECH-05); a structured logger to replace `console.error`
  (TECH-13).
- Reviewer should scrutinize: that no caller's behavior changed, and that the
  kept duplicate entries are the intended ones.
