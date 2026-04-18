# CHANGES.md - Session: Project bootstrap (P0–P2) + theming

## Date: 2026-04-17
## Branch: main

### Files Created

**Tooling / root**
1. **package.json** — Bun workspace root (`lib`, `server`, `app`) + scripts (`dev:server`, `dev:app`, `build:app`, `test`, `typecheck`, `lint`, `format`, `check`).
2. **tsconfig.base.json** — strict TS, bundler resolution, `allowImportingTsExtensions`, Bun types.
3. **tsconfig.json** — root project with path aliases `@unwild/lib[/*]`.
4. **biome.json** — Tailwind/daisyUI-friendly formatter + linter; ignores `**/*.svelte` (v1.9 mangles rune `let`).
5. **.gitignore**, **.editorconfig**.

**Shared FP lib (`lib/`)**
6. **lib/package.json** — `@unwild/lib` workspace with deep-import `exports` map.
7. **lib/tsconfig.json**.
8. **lib/src/index.ts**, **lib/src/fp/index.ts**, **lib/src/rpc/index.ts** — barrels.
9. **lib/src/fp/result.ts** — `Result`, `Ok`, `Err`, `mapResult`, `flatMapResult`, `protect`, `protectAsync`.
10. **lib/src/fp/pipe.ts** — `pipe`, `log`.
11. **lib/src/fp/match.ts** — exhaustive tagged-variant dispatch.
12. **lib/src/fp/store.ts** — `createStore` with named transitions + subscribers.
13. **lib/src/fp/assert.ts** — `assert`, `assertAll`, `assertAny` (all return `Result`).
14. **lib/src/fp/env.ts** — `getEnv` immutable config.
15. **lib/src/fp/logger.ts** — `getLogger` with null-object pattern.
16. **lib/src/fp/tracer.ts** — `getTracer` with null-object pattern.
17. **lib/src/fp/*.test.ts** — 14 passing tests.
18. **lib/src/rpc/schema.ts** — JSON-RPC 2.0 envelope (`jsonrpc`, `id`, `params`) + `MethodKind`.
19. **lib/src/rpc/cbor.ts** — JSON stub behind `encode/decode → Result` API.
20. **lib/src/rpc/errors.ts** — `ErrorCode` table.
21. **lib/src/rpc/cbor.test.ts**.

**Server (`server/`)**
22. **server/package.json**, **server/tsconfig.json**.
23. **server/src/main.ts** — Bun `serve` wiring; routes `/api/{method}`, `/app/*`, `/monitor`; graceful shutdown.
24. **server/src/config.ts** — pure config loader (env + overrides) returning `Result`.
25. **server/src/monitor.ts** — pure HTML renderer for `/monitor` with verb badges.
26. **server/src/rpc/registry.ts** — method registry with `kind: 'read'|'write'`.
27. **server/src/rpc/methods.ts** — `ping`, `echo`, `server.info` (all `read`).
28. **server/src/rpc/dispatcher.effects.ts** — HTTP↔RPC adapter; parses GET/POST envelopes; enforces verb vs kind (405); wraps handler in `protectAsync`.
29. **server/src/static.effects.ts** — serves `app/dist` + SPA fallback.

**Web app (`app/`)**
30. **app/package.json**, **app/tsconfig.json**, **app/vite.config.ts**, **app/svelte.config.js**, **app/index.html**.
31. **app/src/main.ts** — Svelte 5 `mount(App)`.
32. **app/src/App.svelte** — daisyUI `drawer lg:drawer-open` shell + route switch.
33. **app/src/components/Header.svelte** — user-authored; navbar, logo, breadcrumbs, search, compose, help, avatar+menu.
34. **app/src/components/Sidebar.svelte** — lucide-icon menu (Mail, Users, FileText, Settings, Shield, Gauge); logo on top.
35. **app/src/lib/rpc-client.effects.ts** — `rpcGet<T>` (GET + query) and `rpcPost<T>` (POST + JSON body); returns `Result<T>`.
36. **app/src/lib/router.ts** — pure `parseHash` + `hrefFor` with tagged `Route` variant.
37. **app/src/lib/router.svelte.ts** — rune state + `hashchange` listener.
38. **app/src/lib/avatar.ts** — pure identicon SVG (hash → HSL gradient + initials).
39. **app/src/pages/*.svelte** — Home (RPC ping smoke test), Compose, Contacts, Documents, Profile, Admin, Monitor (`server.info` call), NotFound.
40. **app/src/styles/app.css** — Tailwind v4 + daisyUI (corporate + dark) + Inter Variable + `--font-sans` theme override.
41. **app/public/unwild-logo.svg** — hand-rebuilt approximation of the brand mark.

**Docs**
42. **README.md** — project overview, architecture, code conventions, FP conventions, UI conventions.
43. **PLAN.md** — P0–P9 with FP cross-cutting + ⛔ P3+ blocked banner.
44. **docs/DATA-MODEL.md** — open-design working doc for domain types.
45. **MEMO.md**, **CHANGES.md** (this file), **LEARNINGS.md**, **TODO.md** — session-lifecycle files.
46. **AGENTS.md** — symlink to `~/.pi/agent/AGENTS.md`.

### Files Modified
None (fresh repo; everything is a creation in this session).

### Key deps installed
- Root: `typescript@5.9`, `@biomejs/biome@1.9`, `@types/bun`.
- App: `svelte@5`, `vite@5`, `@sveltejs/vite-plugin-svelte@4`, `tailwindcss@4`, `@tailwindcss/vite@4`, `daisyui@5`, `lucide-svelte`, `@fontsource-variable/inter`.
- Server: `@unwild/lib` (workspace).

### Commits
- `e7fc4b6` - chore: initial bootstrap — P0-P2 skeletons, FP lib, RPC, Svelte 5 app

---
