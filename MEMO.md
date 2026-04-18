# MEMO — Session State

## Last Session — 2026-04-17

### Branch
`main` (new repo; first bootstrapping session).

### Summary
Bootstrapped the Unwild.email monorepo from scratch. Delivered PLAN P0–P2 as
working skeletons (repo tooling, shared FP lib, server, Svelte 5 app) with
theming (Tailwind v4 + daisyUI `corporate` + Inter font + lucide icons).
Data model is deliberately **blocked** in P3 until `docs/DATA-MODEL.md` §7 is
signed off.

### Current state — what works
- `bun run check` → lint + typecheck + **14/14 tests** green.
- `bun run dev:server` → Bun HTTP on `:3030` with `/api/{method}`, `/app/*`, `/monitor`.
- `bun run dev:app` → Vite on `:5173` proxying `/api` to `:3030`.
- `bun run build:app` → `app/dist/` served by the server at `/app/`.
- Smoke: GET `/api/ping`, `/api/server.info`, `/api/echo?params=...` all OK.
- RPC handles wrong-verb (405), missing id (400), bad jsonrpc version (400),
  unknown method (404), handler throw (caught → 400 via `protectAsync`).

### Key decisions
1. **FP conventions are mandatory** — pure core / `*.effects.ts` shell / wiring
   split enforced; `Result<T>` everywhere; no throws in app code.
2. **IDs:** adopted **UUIDv7** (dropped ULID) — RFC 9562, DuckDB native.
3. **Wire protocol:** JSON-RPC 2.0 envelope kept (`jsonrpc`, `id`, `params`)
   but method moved into the URL: `GET /api/{method}?id=&params=` for reads,
   `POST /api/{method}` with envelope body for mutations. Verb enforced against
   method `kind: 'read' | 'write'`.
4. **Serialization:** JSON stub behind `encode/decode → Result` API at
   `lib/src/rpc/cbor.ts`. Swap to `cbor-x` is a one-file change.
5. **UI:** Tailwind v4 + daisyUI v5 (**corporate** theme default, **dark** on
   `prefers-color-scheme`); **Inter Variable** self-hosted via
   `@fontsource-variable/inter`; **lucide-svelte** icons mandatory (no inline
   SVG, no emoji, no icon fonts).
6. **Avatar:** deterministic identicon (hash → HSL gradient + initials) in
   `app/src/lib/avatar.ts`; ported from Reflowd but daisyUI-themed.
7. **Biome ignores `**/*.svelte`** — v1.9 mangles rune `let` → `const`.
   Svelte linting to be done via `svelte-check` later.

### Key files
**FP lib (`lib/src/fp/`)**
- `result.ts` — `Result`, `Ok`, `Err`, `mapResult`, `flatMapResult`, `protect`, `protectAsync`
- `pipe.ts`, `match.ts`, `store.ts`, `assert.ts`, `env.ts`, `logger.ts`, `tracer.ts`
- `*.test.ts` for each (14 tests)

**RPC (`lib/src/rpc/`)**
- `schema.ts` — `RpcRequest`, `RpcResponse`, `JSONRPC_VERSION`, `MethodKind`
- `cbor.ts` — JSON stub returning `Result`
- `errors.ts` — `ErrorCode` table

**Server (`server/src/`)**
- `main.ts` (wiring), `config.ts`, `monitor.ts` (pure HTML)
- `rpc/registry.ts` (pure map with `read|write` kind)
- `rpc/methods.ts` — `ping`, `echo`, `server.info` (all `read`)
- `rpc/dispatcher.effects.ts` (HTTP↔RPC), `static.effects.ts` (SPA files)

**App (`app/src/`)**
- `main.ts`, `App.svelte` (daisyUI `drawer` shell)
- `components/Header.svelte` — user-authored; avatar+menu swapped to identicon + daisyUI dropdown with Profile/Logout
- `components/Sidebar.svelte` — lucide icons (Mail, Users, FileText, Settings, Shield, Gauge), logo at top
- `lib/rpc-client.effects.ts` — `rpcGet` / `rpcPost`
- `lib/router.ts` (pure) + `lib/router.svelte.ts` (rune state + hashchange)
- `lib/avatar.ts` — pure identicon SVG generator
- `pages/*.svelte` — placeholders + Home ping test + Monitor
- `public/unwild-logo.svg` — hand-rebuilt approximation of the brand mark
- `styles/app.css` — Tailwind + daisyUI (corporate) + Inter Variable

**Docs**
- `README.md` — architecture + FP Conventions + UI Conventions
- `PLAN.md` — P0–P9 with FP cross-cutting; P3+ blocked
- `docs/DATA-MODEL.md` — open-design work doc; §7 gates P3
- `docs/FP-CONVENTIONS.md`, `docs/FP-CONVENTIONS-LLM.md`, `docs/FP-lib-api.md`

### Known issues / deferrals
- **P3+ blocked** by `docs/DATA-MODEL.md` §7 checklist (Entity storage strategy,
  Person/Org↔Entity, Document↔Attachment↔Entity, Catalog fate, LLM prompt
  location, ERD + sample queries).
- **CBOR not wired** — JSON stub in place; swap `cbor-x` in
  `lib/src/rpc/cbor.ts` when ready.
- **Biome cannot lint Svelte safely** (v1.9 turns rune `let` into `const`).
  Ignored in `biome.json`; add `svelte-check` to CI later.
- **`unwild-logo.svg`** is hand-approximated, not vectorized from the PNG.
  Replace with the original vector when available.
- **No auth / no DB / no IMAP** — intentional; P4+ behind data-model gate.

### Next steps (pick one)
1. Work through `docs/DATA-MODEL.md` §7 (ERD + storage choice) to unblock P3.
2. Swap JSON → CBOR in `lib/src/rpc/cbor.ts`.
3. Add `svelte-check` to `bun run check` pipeline.
4. Polish app shell (real logo vector, theme switcher, mobile drawer touches).
