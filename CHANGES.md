# CHANGES.md

# CHANGES.md - Session: Variant UI experiment (Action-First scaffold)

## Date: 2026-04-22
## Branch: main

### Files Modified
1. **app/** — entire workspace replaced (see Files Created below). Old codebase archived as `app-classic/`.
2. **tsconfig.json** — include paths still point to `app/src/**` (valid for new workspace). No structural change.
3. **MEMO.md** — session state updated.
4. **CHANGES.md** — this entry appended.

### Files Created
1. **app/package.json** — new workspace deps: `svelte ^5.1.9`, `lucide-svelte`, `@unwild/lib`, Tailwind v4 + daisyUI v5, Vite.
2. **app/vite.config.ts** — `tailwindcss()` + `svelte()` plugins.
3. **app/svelte.config.js** — `vitePreprocess`.
4. **app/tsconfig.json** — extends root, includes `src`.
5. **app/index.html** — minimal SPA shell, `src/main.ts` entry.
6. **app/src/main.ts** — `mount(App)`.
7. **app/src/app.css** — `@import "tailwindcss"`, `@plugin "daisyui"`, bespoke Unwild theme tokens (`uw-bg`, `uw-card`, `uw-text`, `uw-muted`, `uw-line`, `uw-orange`, `uw-red`, `uw-teal`).
8. **app/src/vite-env.d.ts** — Svelte + Vite types.
9. **app/src/router.svelte.ts** — hash router for four routes: `#/` → Todo, `#/waiting` → Waiting, `#/protected` → Protected, `#/account` → Account.
10. **app/src/App.svelte** — shell: `AppHeader` + routed `<main>`.
11. **app/src/components/AppHeader.svelte** — logo (`Sprout` + "nwild / your email"), three nav tabs with underline active state, gradient avatar → Account.
12. **app/src/components/SenderBlock.svelte** — colored initial-circle avatar, sender name, thread lines (`In :>` / `Re <:`), timestamps.
13. **app/src/components/SectionHeader.svelte** — uppercase title + hairline + sort/group button (`LayoutGrid` icon).
14. **app/src/pages/TodoPage.svelte** — white card with "New (todo)" and "Done" sections, mock sender data.
15. **app/src/pages/WaitingPage.svelte** — placeholder.
16. **app/src/pages/ProtectedPage.svelte** — placeholder.
17. **app/src/pages/AccountPage.svelte** — placeholder.

### Files Renamed / Moved
1. **app/** → **app-classic/** (full archive of previous Svelte 5 SPA).

### Commits
- (pending)

---

# CHANGES.md (FloatingSearch + Compose) — 2026-04-20 (session 4)
## Branch: main

### Files Created
1. **app/src/components/FloatingSearch.svelte** — bottom-center floating
   pill that expands on focus into results area + auto-grow textarea.
   Search vs Ask mode (`/ask` prefix), Search/Send/Clear buttons in a
   non-overlapping right-side lane. `onFocusChange` prop exposes
   expanded state.
2. **app/src/components/BottomDock.svelte** — floating dock
   orchestrator. Owns `mode: 'search' | 'compose'`; hides compose btn
   while search is expanded.
3. **app/src/components/ComposeButton.svelte** — MailPlus button
   matching Header styling; `hidden` prop applies `invisible
   pointer-events-none` to preserve layout.
4. **app/src/components/ComposePanel.svelte** — top toolbar (formatter
   slot + Expand/Close), full-width grow textarea, bottom action row
   (Attach/Link icons left; To/Cc + black Send dropdown right,
   `dropdown-top dropdown-end`). Maximized widens to
   `calc(100vw - 8rem)` / `calc(100vh - 8rem)`.
5. **app/public/circuit-bg.svg** — tiling background pattern.
6. **docs/ui-ideas.md** — UI scratchpad.
7. **plans/PLAN-260420-151125.md**, **plans/PLAN-260420-170455.md** —
   archived previous plans.

### Files Modified
1. **app/src/pages/Mails.svelte** — outer container set `relative`,
   mounted `<BottomDock />` (replaces `<FloatingSearch />`).
2. **app/src/components/Sidebar.svelte** — smaller logo, lighter
   separators, hover tweaks.
3. **app/src/components/Header.svelte** — dropped unused commented
   compose-dropdown block.
4. **app/src/styles/app.css** — cream background + tiling SVG.
5. **PLAN.md** / **DRAFT.md** — plans + notes for this session.

### Commits
- `00915ea` app: add FloatingSearch component on Mails page; sidebar + bg polish
- `e35d4b3` app: add BottomDock with ComposePanel + ComposeButton
- `d1dd0ca` session 4 close: MEMO + CHANGES + LEARNINGS + TODO

### Known issues
- Maximized ComposePanel cannot anchor to viewport top (`2rem` gap)
  because it lives inside a `-translate-x-1/2` dock +
  `overflow-hidden` page container; `position: fixed` failed
  (transformed ancestor forms its own containing block). Deferred —
  see LEARNINGS L9/L10.

---

## Session: Resolve merge conflicts — 2026-04-20
## Branch: main

### Files Modified
1. **docs/EMAILS-BASE-MODEL.md** — resolved 6 merge conflict markers (HEAD chosen in all cases).

### Commits
- `f4f972a` fix: resolve merge conflicts in EMAILS-BASE-MODEL.md

---

# Session: Router cleanup + resolve EMAILS-BASE-MODEL review

## Date: 2026-04-18 (session 3)
## Branch: main

### Files Modified

1. **app/src/router.svelte.ts** (new)
   - Single consolidated hash router next to `App.svelte` with inline
     header comment explaining the flow and how to add a page.
   - `Route` union adds `home`; `parseHash` maps `#/` and `#/home` to
     Home, `#/mails` to Mails; `hrefFor` treats `home` as root.

2. **app/src/lib/router.ts**, **app/src/lib/router.svelte.ts** (deleted)
   - Superseded by `app/src/router.svelte.ts`.

3. **app/src/pages/Home.svelte** (new landing page)
   - Replaces the previous Home page (which was repurposed as Mails).
   - Grid of links to Mails / Persons & Orgs / Documents / Admin.

4. **app/src/pages/Mails.svelte** (new, copy of previous Home)
   - Holds the RPC ping demo that used to live in Home.

5. **app/src/App.svelte**
   - Import Home + Mails; render `home` and `mails` tags distinctly.

6. **app/src/components/Sidebar.svelte**
   - Import from new router location; logo now links to `home`.

7. **app/src/components/Header.svelte**
   - Import from new router location.

8. **docs/EMAILS-BASE-MODEL.md**
   - Resolved all 5 `!!!` review threads with inline Decision notes.
   - §0.4: added `_to` / `_to_uid` as parallel to `_by` / `_by_uid`.
   - §0.5: added `_to`, `_to_uid` rows; restricted `_ref` to external
     resources only; added internal-files convention block.
   - §2.1 `users`: rewrote schema — `username UNIQUE`, `login_email`
     (recovery only), `password_hash`, `totp_secret`; removed
     `email UNIQUE`; deferred auth details to `AUTH-MODEL.md`.
   - §4.1 `emails`: added `account_uid` FK (denormalized from
     `mailboxes.account_uid`) + matching index.
   - §4.2 raw Parquet: join key is `email_uid`; `raw_sha256` demoted
     to verification/dedup; updated sample query and footer note.
   - §14 checklist: review item marked done.

9. **docs/AUTH-MODEL.md** (new stub)
   - Scope, core principle (login identity ≠ email), proposed user
     fields, flows (username+password / TOTP / recovery), out-of-scope
     list, open questions.

10. **DRAFT.md**
    - Replaced `DO` section with review Q&A for the EMAILS-BASE-MODEL
      `!!!` threads (used to drive this session's doc edits).

11. **MEMO.md**
    - Session 3 state.

### Commits
- `c49279a` app: fix Mails route, move router next to App, add Home page
- (pending) docs: resolve EMAILS-BASE-MODEL review threads + add AUTH-MODEL stub

---

# CHANGES.md - Session: Project bootstrap (P0–P2) + theming

## Date: 2026-04-19
## Branch: main

### Files Modified
- **docs/EMAILS-BASE-MODEL.md** — resolved the outstanding review pass:
  clarified `data/documents/` stays content-addressed by
  `content_sha256`; raw Parquet rows are joined by `email_uid` with
  `raw_sha256` kept as integrity/dedup fingerprint; added `_to` /
  `_to_uid`; restricted `_ref` to external references; clarified `users`
  as app/server principals with `login_name` + optional `contact_email`;
  removed stale review comments and stale wording from open questions /
  next steps.
- **MEMO.md** — refreshed session state after resolving the doc review.
- **TODO.md** — updated the pending review item to reflect the latest pass.
- **CHANGES.md** — appended this entry.

### Decisions
- Keep `content_sha256` as the blob-store key under `data/documents/`.
- Treat `email_uid` as the logical join key for raw Parquet rows.
- Defer auth modeling to a future `docs/AUTH-MODEL.md` instead of mixing
  it into the email persistence doc.

### Commits
None this session.

---

## Date: 2026-04-18 (session 2)
## Branch: main

### Files Created
- **docs/EMAILS-BASE-MODEL.md** — raw-email relational model in DuckDB SQL.
  18 tables, conventions block at top (uid PK, _utc, _uid, _by, _kind,
  is_/has_, _bytes/_count/_sha256/_json/_ref/_raw/_normalized, lifecycle
  columns, column order, CHECK over ENUM). Covers users, accounts,
  mailboxes, emails, email_headers, addresses, email_addresses,
  mime_parts, attachments, calendar_invites, received_hops, auth_results,
  dkim_signatures, list_metadata, threads, thread_references, keywords,
  email_keywords. Sample queries + open questions.

### Storage-layout design decisions (folded into EMAILS-BASE-MODEL.md)
- Server data split across `data/{duckdb,lmdb,raw,documents}`.
- **Sync state out of scope** — removed `sync_checkpoints` table; will
  live in LMDB, future `docs/SYNC-MODEL.md`.
- **Raw RFC 5322 bytes → Parquet** — removed `raw_messages` table; bytes
  stored in append-only shards under `data/raw/account=<uid>/yyyy-mm=<YYYY-MM>/`,
  queried via `read_parquet()` joined on `emails.raw_sha256`.
- **Attachments/binary MIME parts** → content-addressed at
  `data/documents/<sha256[0:2]>/<sha256>`. Removed `storage_ref`,
  `body_blob`, `body_blob_ref` columns.

### Under review (not resolved)
- User added `!!!` annotations to `docs/EMAILS-BASE-MODEL.md`; review
  ongoing. See MEMO.md for open threads (sha256-vs-uid as filename,
  Parquet PK, `_to` convention, `_ref` for internal files, `users`
  table concept).

### Files Created (earlier in the day)
- **docs/EMAIL-DATA.md** — exhaustive catalog of extractable email fields
  with IETF/W3C references. Sections: scope & assumptions, message anatomy,
  IMAP transport metadata, SMTP envelope residue, RFC 5322 headers, MIME
  headers + types + multipart semantics + encodings, body extraction
  (HTML/plain), attachments, auth (SPF/DKIM/DMARC/ARC/BIMI), mailing lists,
  delivery reports (DSN/MDN/ARF), S/MIME & PGP, i18n (EAI/SMTPUTF8/IDN),
  calendar (iMIP), importance/priority, vendor X-* headers, derived fields,
  v0 persistence recommendation, deprecated/ignore list, open questions.
  Legend: 🟢 Core / 🟡 Useful / 🔵 Niche / ⚫ Deprecated / 🧮 Derived.

### Files Modified
- **TODO.md** — marked EMAIL-DATA.md task done; added review + fold-back
  tasks.
- **MEMO.md** — updated session state for 2026-04-18 (cont.).

### Decisions
- POP3 explicitly out of scope (no folders / no flags model).
- Always persist raw RFC 5322 blob + SHA-256 for DKIM re-verification and
  forensics; retention policy TBD.
- Provider-native IDs (`X-GM-MSGID`, Graph id) = metadata, not primary key.
- Trust only `Authentication-Results` entries matching a configured
  `authserv-id`.

---

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

# CHANGES.md - Session: Agent config + email data deferred

## Date: 2026-04-18
## Branch: main

### Files Created
1. **~/.pi/agent/AGENTS.md** — mandatory instructions for AI agents: session lifecycle (MEMO.md, CHANGES.md, LEARNINGS.md, TODO.md), rules (no Co-authored-by, no destructive commands, conventional commits, etc.), stack conventions, language. User further edited on their own (added Plans, Drafts sections).
2. **DRAFT.md** — temp file with instructions for exhaustive email data analysis (deferred).

### Files Modified
- **MEMO.md** — updated with this session's context.
- **CHANGES.md** — appended this entry.
- **TODO.md** — added pending tasks.

### Files Not Yet Created (deferred)
- **docs/EMAIL-DATA.md** — exhaustive email field analysis with RFC references. Not started — user stopped the research as it was taking too long.

### Commits
None this session.
