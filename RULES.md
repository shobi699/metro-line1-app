RULES.md — Engineering Rules & Skills
This file defines non-negotiable rules and specialized "skills" the agent must apply.
It complements AGENTS.md (stack + structure) and DESIGN.md (visuals).

Golden rules
Read AGENTS.md + DESIGN.md before coding; never contradict them.
Safety and security rules are non-negotiable (see AGENTS.md "Backend rules").
No secrets in code or logs. Use environment variables only.
Validate every external input with Zod; reject unknown fields.
Enforce RBAC on every protected route — no exceptions.
Dark mode + RTL must be correct on first load.
Definition of Done (per task)
TypeScript strict; no any; build passes.
npm run lint zero errors; npm run build passes.
New endpoints: Zod DTO + RBAC guard + at least one unit test.
New UI: wrapped shadcn, CVA variants, logical (RTL) props, fa-IR digits.
Audit-log row written for create/update/delete.
Skills / specialized behaviors
excel-skill — On Excel import always produce a per-row error report
(row number + reason). Never silently commit a partially valid file.
Export uses the exact same column layout as import (round-trip safe).
roster-skill — Never auto-commit ambiguous shift mappings; route them to
the admin review queue. Store original file + extraction result.
swap-skill — Run the rule engine (rest hours, consecutive shifts, role parity)
before any manager approval; show the exact failing rule to the user.
safety-skill — Read-receipts are immutable legal records. Store time + device.
The acknowledge modal is non-dismissible until the user reaches the end.
realtime-skill — chat / SOS / live-status use a realtime channel. SOS messages
take priority and always include geolocation + sender identity.
rtl-skill — Use logical CSS only. Flip directional icons. Test every screen in RTL.
fa-skill — Display digits/dates in fa-IR + jalali; keep storage in ISO/UTC + latin.
Git workflow
Branch per module: feat/<module-name>.
Conventional commits: feat:, fix:, chore:, test:, docs:.
One PR per module; include what changed + how to test.
When unsure
If a requirement is ambiguous, stop and ask instead of guessing.
Prefer the simplest solution that satisfies DESIGN.md and AGENTS.md.