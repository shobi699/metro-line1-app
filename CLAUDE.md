@AGENTS.md
@UI_DESIGN.md

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## UI / UX (non-negotiable)

This product must look and feel modern, clean, and professional, and be genuinely user-friendly. Before building or changing any screen, READ `UI_DESIGN.md` and follow it strictly. Do not invent ad-hoc styles, colors, or spacing.

Core rules:
- RTL-first, Persian (Farsi) primary. Use `dir="rtl"` globally; only isolate LTR for codes/IDs/latin where needed.
- Font: Vazirmatn (variable). Show Persian (fa-IR) digits in the UI; store ASCII/ISO in the database.
- Jalali calendar in the UI; ISO/UTC in storage.
- Use ONLY the design tokens defined in `UI_DESIGN.md` (colors, spacing, radius, typography, shadows, motion). Implement them as Tailwind v4 theme tokens + shadcn/ui components.
- Light + dark mode are both required from day one.
- Accessibility is mandatory: WCAG 2.1 AA contrast, visible focus rings, min 44px touch targets, full keyboard nav, respect `prefers-reduced-motion`.
- Three surfaces are designed SEPARATELY (see `UI_DESIGN.md`): Web (desktop admin + portal), Mobile/PWA (responsive web on phones), and Native App (Expo iOS/Android). Never copy a desktop layout onto mobile 1:1.
- Every screen must define loading (skeleton), empty, and error states — not just the happy path.
- Reuse shared components from `packages/ui`; do not duplicate primitives.
