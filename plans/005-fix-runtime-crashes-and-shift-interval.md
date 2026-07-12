# Plan 005: Fix three runtime crashes / logic bugs (roster null-sort, layout null-body, swap shift-interval)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1a7f043..HEAD -- src/server/modules/roster/service.ts src/app/(app)/layout.tsx src/server/modules/swap/service.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `1a7f043`, 2026-07-11

## Why this matters

Three independent defects, each small, each with a concrete failure mode:

1. **Roster validation crashes on a null departure time.** `validateRoster`
   sorts a driver's trips by `departureTime.localeCompare(...)`, but trips are
   explicitly created with `departureTime: null`. One such trip throws
   `TypeError: Cannot read properties of null (reading 'localeCompare')`,
   aborting validation entirely — the operator gets no warnings at all.

2. **The app layout crashes on a null announcement body.** The notification
   banner renders `b.body.slice(0, 100)` as a fallback, but the notification
   body is nullable. A single announcement with a null body throws in the main
   authenticated layout, white-screening the whole app for every user.

3. **Swap rest-hour validation uses a non-normalized base time.** The swap
   engine's `getShiftInterval` computes shift windows from
   `new Date(date).getTime()` without zeroing the time-of-day, while the
   parallel meetings service correctly calls `setHours(0,0,0,0)` first. If a
   stored `Shift.date` carries a non-midnight time, every rest-gap and overlap
   calculation is offset — either blocking valid swaps or, worse, permitting
   ones that violate the minimum-rest safety rule.

## Current state

- `src/server/modules/roster/service.ts:705` — the unguarded sort:

```ts
tripsList.sort((a, b) => a.trip.departureTime.localeCompare(b.trip.departureTime))
```

  `departureTime` is nullable — set to `null` at lines 216 and 316
  (`departureTime: depTime || null`), and guarded elsewhere at line 535
  (`if (!trip.departureTime || !trip.arrivalTime)`), confirming null is a real
  runtime value.

- `src/app/(app)/layout.tsx:221` — the unguarded slice:

```tsx
<span className="font-medium text-foreground">{b.excerpt || b.body.slice(0, 100)}</span>
```

- `src/server/modules/swap/service.ts:25-27` — the non-normalized base:

```ts
function getShiftInterval(date: Date, code: ShiftCode): { start: Date; end: Date } | null {
  if (code === 'off') return null
  const baseTime = new Date(date).getTime()
```

  Compare the correct pattern in the meetings service
  (`src/server/modules/meetings/service.ts:42` region) which zeroes the day
  before computing offsets.

- Repo conventions: swap logic already has tests
  (`src/server/modules/swap/service.test.ts`) mocking `@/server/db`; roster has
  `src/server/modules/roster/service.test.ts` covering `validateRoster`. Match
  their structure for new cases.

## Commands you will need

| Purpose   | Command                                        | Expected on success |
|-----------|------------------------------------------------|---------------------|
| Install   | `npm install`                                  | exit 0              |
| Typecheck | `npm run typecheck`                            | exit 0, no errors   |
| Tests     | `npm run test`                                 | all pass            |
| Roster    | `npx vitest run src/server/modules/roster`     | all pass            |
| Swap      | `npx vitest run src/server/modules/swap`       | all pass            |
| Lint      | `npm run lint`                                 | exit 0              |

Note: `npm run build` fails on Windows shells (inline `NODE_OPTIONS`); do not use it as a gate.

## Scope

**In scope** (the only files you should modify):
- `src/server/modules/roster/service.ts` (null-safe sort only)
- `src/server/modules/roster/service.test.ts` (add a case)
- `src/app/(app)/layout.tsx` (null-safe fallback only)
- `src/server/modules/swap/service.ts` (`getShiftInterval` normalization only)
- `src/server/modules/swap/service.test.ts` (add a case)

**Out of scope** (do NOT touch, even though they look related):
- The consecutive-shift calendar-adjacency bug (a separate correctness finding)
  — do NOT change the `consecutive` loop in `validateUserRules`; that is a
  different fix with its own risk profile.
- The swap check-then-act transaction race — separate, larger plan.
- Any refactor of `validateRoster` beyond the one-line comparator guard.

## Git workflow

- Branch: `advisor/005-crash-fixes`
- Commit style: conventional commits, e.g. `fix: guard null departureTime, null announcement body, and normalize shift interval base`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Null-safe the roster trip sort

In `src/server/modules/roster/service.ts:705`, make the comparator null-safe
(nulls sort last, deterministically):

```ts
tripsList.sort((a, b) =>
  (a.trip.departureTime || '').localeCompare(b.trip.departureTime || ''))
```

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Add a roster test for the null departureTime case

In `src/server/modules/roster/service.test.ts`, add a `validateRoster` case
where a driver has two trips, one with `departureTime: null`, asserting the
call returns normally (does not throw) and still produces the expected
validation result shape.

**Verify**: `npx vitest run src/server/modules/roster` → all pass.

### Step 3: Null-safe the layout announcement fallback

In `src/app/(app)/layout.tsx:221`, change `b.body.slice(0, 100)` to a
null-safe chain:

```tsx
<span className="font-medium text-foreground">{b.excerpt || b.body?.slice(0, 100) || ''}</span>
```

**Verify**: `npm run typecheck` → exit 0. `grep -n "b.body.slice" src/app/(app)/layout.tsx` → no matches.

### Step 4: Normalize the swap shift-interval base time

In `src/server/modules/swap/service.ts` `getShiftInterval`, zero the
time-of-day before applying hour offsets, matching the meetings service:

```ts
function getShiftInterval(date: Date, code: ShiftCode): { start: Date; end: Date } | null {
  if (code === 'off') return null
  const base = new Date(date)
  base.setHours(0, 0, 0, 0)
  const baseTime = base.getTime()
  // ...rest unchanged
```

**Verify**: `npm run typecheck` → exit 0.

### Step 5: Add a swap test proving normalization

In `src/server/modules/swap/service.test.ts`, add a case that constructs
shifts whose `date` carries a non-midnight time (e.g.
`new Date('2026-06-01T09:30:00')`) and asserts that rest-gap/overlap
validation produces the same result as the midnight equivalent. Use the
existing mocked-prisma pattern in that file.

**Verify**: `npx vitest run src/server/modules/swap` → all pass.

### Step 6: Full verification

**Verify**: `npm run typecheck` → exit 0. `npm run test` → all pass. `npm run lint` → exit 0.

## Test plan

- Roster: one new `validateRoster` case — a trip with `departureTime: null`
  does not throw. Model after the existing `validateRoster` tests in the file.
- Swap: one new case — non-midnight `Shift.date` yields the same violations as
  the midnight-normalized equivalent. Model after existing `validateSwapRules`
  tests.

Verification: `npm run test` → all pass, ≥2 new tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "departureTime.localeCompare" src/server/modules/roster/service.ts` → no unguarded match (comparator uses `|| ''`)
- [ ] `grep -n "b.body.slice" src/app/(app)/layout.tsx` → no matches
- [ ] `getShiftInterval` in swap service calls `setHours(0, 0, 0, 0)`
- [ ] `npm run typecheck` exits 0; `npm run test` all pass (incl. ≥2 new); `npm run lint` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- The meetings service does NOT actually normalize with `setHours(0,0,0,0)`
  (i.e. the "correct" reference is wrong) — report; the desired behavior needs
  confirmation before changing the swap side.
- Normalizing `getShiftInterval` breaks an existing swap test (it may encode
  the buggy behavior) — report the failing assertion instead of editing the
  old test to match.
- A verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The root question behind Step 4: are `Shift.date` values stored at midnight
  UTC or with a time component? If storage is already normalized, this fix is
  a no-op safety net; if not, it corrects real miscalculations. Either way the
  code should not assume. A reviewer should confirm the storage convention and,
  ideally, enforce it at write time in a follow-up.
- These three fixes are defensive guards; they do not change intended behavior
  on well-formed data, so regression risk is low.
