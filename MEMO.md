# MEMO — Session State

## Last Session — 2026-04-18

### Branch
`main`

### Summary
Short session focused on project config and beginning data model work.

1. Created `~/.pi/agent/AGENTS.md` with mandatory instructions for AI agents (session lifecycle, rules, conventions, etc.).
2. User edited AGENTS.md further on their own (added Plans, Drafts sections; adjusted wording).
3. Read `DRAFT.md` — user wants to start exhaustive analysis of email raw data fields (all extractable metadata from an email message) and write it into `docs/DATA-MODEL.md` under a "Raw email data" section. Also wants W3C standard references where applicable.
4. User decided to move that analysis into its own file `docs/EMAIL-DATA.md` instead, but then **stopped the research** because it was taking too long.
5. The DRAFT.md instruction to analyze email data is **deferred** — not yet started.

### Current state — what works
(Same as previous session — no code changes this session.)
- `bun run check` → lint + typecheck + 14/14 tests green.
- `bun run dev:server` → Bun HTTP on `:3030`.
- `bun run dev:app` → Vite on `:5173`.

### Key decisions
1. Email raw data analysis will live in `docs/EMAIL-DATA.md` (separate from DATA-MODEL.md).
2. W3C/RFC references should be cited for each field that comes from a standard.

### Next steps
1. **Email data analysis** — create `docs/EMAIL-DATA.md` with exhaustive list of all extractable email fields, referencing RFCs (RFC 5322, RFC 2045, RFC 2369, etc.). This is the main pending task.
2. Continue through `docs/DATA-MODEL.md` §7 checklist to unblock P3.
3. Swap JSON → CBOR in `lib/src/rpc/cbor.ts`.
4. Add `svelte-check` to `bun run check` pipeline.
5. Polish app shell.

### Key files changed this session
- `~/.pi/agent/AGENTS.md` — created with agent instructions (symlinked from repo root).
- `DRAFT.md` — user wrote instructions for email data analysis (temporary).