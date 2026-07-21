# Plan 002: Stop leaking the OTP in the API response, use a CSPRNG, and rate-limit auth endpoints

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1a7f043..HEAD -- src/app/api/auth src/server/auth`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `1a7f043`, 2026-07-11

## Why this matters

The password-reset OTP endpoint returns the OTP code itself in the JSON
response (`debugOtp` field). Anyone who knows a user's personnel code and
phone number can request an OTP, read it from the response, verify it, and
reset that user's password — full account takeover of any user, including
admins. The OTP is also generated with `Math.random()` (predictable), and no
auth endpoint has any rate limiting, so even without the leak a 6-digit OTP is
brute-forceable. This plan removes the leak, switches to a CSPRNG, and adds
rate limiting with OTP attempt counting.

## Current state

- `src/app/api/auth/otp/send/route.ts` — generates and leaks the OTP:

```ts
// src/app/api/auth/otp/send/route.ts:41-55
    // Generate a 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes TTL

    // Store via adapter (KV on Cloudflare, in-memory locally)
    await otpStore.setOtp(personnelCode, {
      code: otpCode,
      expiresAt,
      phone,
    })

    return NextResponse.json({
      message: 'کد تایید یکبار مصرف پیامکی با موفقیت ارسال شد.',
      debugOtp: otpCode, // For testing purposes
    })
```

- `src/app/api/auth/otp/verify/route.ts` — verifies with no attempt limit
  (lines 36-41 just compare `otpData.code !== code` and return 400 on
  mismatch; the OTP stays in the store, so attempts are unlimited within the
  5-minute TTL).

- `src/app/api/auth/login/route.ts` — no rate limiting or lockout; failed
  password check at lines 52-58 returns 401 immediately.

- `src/server/auth/otp-store.ts` — storage adapter with two backends
  (Cloudflare KV and in-memory Map). `OtpEntry` interface at lines 1-5:

```ts
interface OtpEntry {
  code: string
  expiresAt: number
  phone: string
}
```

- There is **no SMS sending anywhere** — the `debugOtp` field is currently
  the only delivery mechanism. That is why this plan gates it by environment
  rather than deleting it outright (see Step 2). A real SMS gateway is
  explicitly deferred (see Maintenance notes).

- Repo conventions: Zod schemas for auth bodies live in `src/lib/zod/auth.ts`;
  errors are Persian, shaped `{ error: string }`; success `{ message | data }`.
  Existing auth tests: `src/server/auth/jwt.test.ts`, `password.test.ts`
  (plain Vitest, no server needed).

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Install   | `npm install`       | exit 0              |
| Typecheck | `npm run typecheck` | exit 0, no errors   |
| Tests     | `npm run test`      | all pass            |
| Lint      | `npm run lint`      | exit 0              |

Note: `npm run build` sets `NODE_OPTIONS` inline and fails on Windows shells; do not use it as a gate.

## Scope

**In scope** (the only files you should modify):
- `src/app/api/auth/otp/send/route.ts`
- `src/app/api/auth/otp/verify/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/server/auth/otp-store.ts` (extend `OtpEntry` with `attempts`)
- `src/server/auth/rate-limit.ts` (create)
- `src/server/auth/rate-limit.test.ts` (create)

**Out of scope** (do NOT touch, even though they look related):
- `src/app/api/auth/register/route.ts` and `refresh/route.ts` — registration
  is admin-approved and refresh requires a valid token; different threat model.
- `src/middleware.ts` — plan 001 owns it.
- Client pages under `src/app/(auth)/` — if the login/reset UI reads
  `debugOtp`, note it in your report; do not edit client code.
- Any SMS-gateway integration — explicitly deferred.

## Git workflow

- Branch: `advisor/002-otp-and-rate-limiting`
- Commit style: conventional commits, e.g. `fix: remove OTP response leak, add CSPRNG and auth rate limiting`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the rate limiter

Create `src/server/auth/rate-limit.ts` — a fixed-window in-memory limiter
(same in-memory pattern as `MemoryAdapter` in `otp-store.ts`; this codebase
already accepts in-memory state for auth flows, KV-backed can come later):

```ts
interface WindowEntry {
  count: number
  resetAt: number
}

const windows = new Map<string, WindowEntry>()

/**
 * Fixed-window rate limiter. Returns true if the call is allowed.
 * Prunes expired entries opportunistically to bound memory.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  if (windows.size > 10_000) {
    for (const [k, v] of windows) {
      if (v.resetAt < now) windows.delete(k)
    }
  }
  const entry = windows.get(key)
  if (!entry || entry.resetAt < now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  entry.count++
  return entry.count <= maxAttempts
}

/** Test helper — clears all windows. */
export function resetRateLimits() {
  windows.clear()
}
```

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Fix the send route — CSPRNG, gated debug field, rate limit

In `src/app/api/auth/otp/send/route.ts`:

1. Replace the `Math.random()` generation with a CSPRNG (Web Crypto is
   available in Node 18+ and the Edge runtime):

```ts
const otpCode = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000)
```

2. Change the success response so the OTP is only returned outside production
   (it is currently the only delivery path — an SMS gateway does not exist yet):

```ts
    return NextResponse.json({
      message: 'کد تایید یکبار مصرف پیامکی با موفقیت ارسال شد.',
      ...(process.env.NODE_ENV !== 'production' ? { debugOtp: otpCode } : {}),
    })
```

3. At the top of the handler (after Zod parse succeeds), add a rate limit of
   3 OTP requests per personnel code per 10 minutes:

```ts
import { checkRateLimit } from '@/server/auth/rate-limit'
// ...
    if (!checkRateLimit(`otp-send:${parsed.data.personnelCode}`, 3, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'درخواست‌های بیش از حد. لطفاً بعداً دوباره تلاش کنید' },
        { status: 429 },
      )
    }
```

4. Initialize `attempts: 0` in the `otpStore.setOtp` payload (after Step 4
   extends the interface).

**Verify**: `npm run typecheck` → exit 0. `grep -n "Math.random" src/app/api/auth/otp/send/route.ts` → no matches.

### Step 3: Fix the verify route — attempt counting

In `src/app/api/auth/otp/verify/route.ts`, after fetching `otpData` and before
the code comparison, enforce a maximum of 5 wrong attempts per OTP:

```ts
    if ((otpData.attempts ?? 0) >= 5) {
      await otpStore.deleteOtp(personnelCode)
      return NextResponse.json(
        { error: 'تعداد تلاش‌های مجاز به پایان رسید. کد جدید درخواست کنید' },
        { status: 429 },
      )
    }

    if (otpData.code !== code) {
      await otpStore.setOtp(personnelCode, { ...otpData, attempts: (otpData.attempts ?? 0) + 1 })
      return NextResponse.json(
        { error: 'کد تایید وارد شده اشتباه است' },
        { status: 400 },
      )
    }
```

**Verify**: `npm run typecheck` → exit 0.

### Step 4: Extend OtpEntry

In `src/server/auth/otp-store.ts`, add `attempts?: number` to the `OtpEntry`
interface (lines 1-5). No adapter changes needed — both adapters serialize the
whole entry.

**Verify**: `npm run typecheck` → exit 0.

### Step 5: Rate-limit login

In `src/app/api/auth/login/route.ts`, after the Zod parse succeeds and before
the DB lookup, add: 10 attempts per personnel code per 15 minutes:

```ts
import { checkRateLimit } from '@/server/auth/rate-limit'
// ...
    if (!checkRateLimit(`login:${parsed.data.personnelCode}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'تلاش‌های ورود بیش از حد. لطفاً ۱۵ دقیقه بعد دوباره تلاش کنید' },
        { status: 429 },
      )
    }
```

Key on personnel code (not IP) because the app may sit behind a proxy where
all requests share an IP; per-account lockout is the primary brute-force
defense here.

**Verify**: `npm run typecheck` → exit 0.

### Step 6: Tests

Write `src/server/auth/rate-limit.test.ts` (see Test plan), then run the suite.

**Verify**: `npm run test` → all pass including new tests. `npm run lint` → exit 0.

## Test plan

New file `src/server/auth/rate-limit.test.ts`, modeled structurally on
`src/server/auth/password.test.ts` (plain Vitest describe/it). Use
`vi.useFakeTimers()` for window expiry. Cases:

1. allows up to `maxAttempts` calls within the window, rejects the next one
2. resets after `windowMs` elapses (advance fake timers)
3. independent keys do not interfere
4. `resetRateLimits()` clears state

Verification: `npm run test` → all pass, 4 new tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "debugOtp" src/app/api/auth/otp/send/route.ts` → only inside a `NODE_ENV !== 'production'` conditional
- [ ] `grep -rn "Math.random" src/app/api/auth/` → no matches
- [ ] `grep -n "checkRateLimit" src/app/api/auth/login/route.ts src/app/api/auth/otp/send/route.ts` → 1 match each
- [ ] `src/app/api/auth/otp/verify/route.ts` contains attempt-count enforcement (429 path)
- [ ] `npm run typecheck` exits 0; `npm run test` all pass (incl. 4 new); `npm run lint` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- You discover an actual SMS-sending integration already exists (search for
  `sms`, `kavenegar`, `melipayamak` first) — then `debugOtp` should be deleted
  entirely, not gated; report and await direction.
- The login client UI hard-depends on reading `debugOtp` in production flows.
- A verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The in-memory limiter resets on server restart and is per-instance. When the
  app scales beyond one instance (or deploys on Cloudflare Workers), move the
  windows into the existing `otpStore` KV adapter pattern.
- **Deferred**: real SMS delivery for OTPs (until then, production password
  reset is effectively disabled by this change — flag this in the PR
  description); IP-based limiting as a second dimension.
- Reviewer should scrutinize: the modulo bias in the CSPRNG line is ≤0.01% for
  a 6-digit code (4294967296 % 900000 ≠ 0) — acceptable; if the reviewer
  disagrees, use rejection sampling.
