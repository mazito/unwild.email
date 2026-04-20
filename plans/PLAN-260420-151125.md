# PLAN - Unwild.email

Phased plan to build local-first, self-hosted, entity-first email engine.
Stack: Bun + TypeScript + DuckDB + LMDB (server), Svelte 5 SPA (client), CBOR/JSON-RPC transport.

---

## Phase 0 - Repo Foundation

**Goal:** bootstrap workspace, tooling, conventions.

- [ ] Init Bun workspace (`bun init`) with `lib/`, `server/`, `app/`, `dist/` dirs.
- [ ] Root `package.json` with workspaces: `lib`, `server`, `app`.
- [ ] TS config (strict) per workspace, path aliases (`@lib/*`, `@server/*`, `@app/*`).
- [ ] Linter/formatter: Biome (fast, fits Bun).
- [ ] File naming lint rule: kebab-case `.ts`, PascalCase `.svelte`.
- [ ] `.gitignore`, `.editorconfig`, LICENSE.
- [ ] Dev scripts: `bun dev:server`, `bun dev:app`, `bun build`, `bun test`.

**Deliverable:** empty but runnable monorepo with `hello world` server on `:3030`.

> !!! OK

## Phase 1 - Shared Lib (`lib/`)

**Goal:** contracts shared by server + app.

> !!!
>
> These are well defined: `Account`, `Email`, `Person`, `Organization`, `Attachment`, `Thread` and normal for the Emails domain.
>
> New ones:
>
> - `EmailProvider` may belong to the Server only, but may be needed in the UI when configuring access to a email server ?
> -  `Entity` is a User defined object that can be build/extracted from email content (for example "Invoice") and can be "semantically" defined by the user (what is an Invoice ? how do we understand or know that this email references an Invoice or has an invoice attached ?). It may have some associated "prompt" for an LLM to detect it ? NOTE: Must keep an open design on this as we do not know enough yet. Need to define it as a generic obj.
> - `EntityProperty` probably need to be part of the Entity but may be we need to have different props for different entities, for example "Invoice" may have "due_date, amount, payed, recurrent, next_date. number, provider".  Open in how are we going to treat these as me may want to query them or sort them . For example "Unpaid invoices by provider sorted by due date and amount". LLM could help in preparing the query and formatting the response.
> - `Document` some attachment that may be considered a permanent doc and will not be discraded and we want to have it accesible- Also may need to detect if there is a new version of the smae document. Note that a Document may laso be an Entity.
> - `Catalog` a searchable list of entities (probably the result of a query). MAY be not necesary at all.
>
> Note the we may need to have some de-normalization to simplify queries, for example a Person is also an Entity and all if properties may be also saved as EntityProperties ?

**Domain types (pure shapes, no methods):**

> 📌 All domain-type analysis + redesign lives in **[`docs/DATA-MODEL.md`](docs/DATA-MODEL.md)**. This phase consumes that doc; it does not re-litigate it.

- [ ] Implement the finalized types from `DATA-MODEL.md` (core: `Account`, `EmailProvider`, `Email`, `Thread`, `Person`, `Organization`, `Attachment`, `Tag`; open-design: `Entity`, `EntityProperty`, `Document`, `Catalog?`).
- [ ] Tagged variants per `DATA-MODEL.md` §5 (`SyncStatus`, `AuthState`, `RpcResponse`, `EntityKind`, `DetectionHint`).
- [ ] Block this task until `DATA-MODEL.md` next-steps checklist (§7) is signed off.

**Other lib deliverables:**

- [ ] JSON-RPC schema (method names, request/response types). Responses wrap `Result<T>`.
- [ ] CBOR encode/decode helpers (wrap `cbor-x` or similar) — return `Result`.
- [ ] Error taxonomy — `ErrorInfo` codes table (no exception classes).
- [ ] Shared utils (pure): **UUIDv7** ids, dates, email-address parsing. _(UUIDv7 = time-ordered 128-bit ID, RFC 9562; native to DuckDB `UUID` + `uuidv7()`, trivial in Bun.)_

**Deliverable:** `lib` package consumed by `server` + `app` with zero runtime deps on either.

---

## Phase 2

### Server Skeleton (`server/`)

**Goal:** minimal running server with HTTP + RPC + static app.

- [ ] Bun HTTP server on `:3030`.
- [ ] Routes:
  - `/` and `/app/*` → serve SPA bundle.
  - `/api` → CBOR JSON-RPC endpoint.
  - `/monitor` → health/status HTML page.
- [ ] RPC dispatcher (method registry, validation, error mapping).
- [ ] Structured logger (pino-like, pretty in dev).
- [ ] Config loader (`data/`, `docs/` paths, ports, log level) - env + `config.json`.
- [ ] Graceful shutdown, PID file.

**Deliverable:** server boots, serves stub SPA, answers a `ping` RPC.

> !!! OK

###  Web App (`app/`) Skeleton

**Goal:** Svelte 5 SPA; entity-first UX.

> !!! We build a small skeleton here just to test the App and Server intrecations

Svelte 5 + Vite setup, runes mode.

Typed RPC client (CBOR) sharing types from `lib/`.Routing

Header:
- Always visible on top
- Unwild.email small log as drawer on/of button
- Company logo / Company name
- Search input / search bar with live **FTS** (_Full-Text Search_ — DuckDB's BM25 extension over indexed text columns; enables instant local search across subject/body/sender).
- Plus button (new email)
- Avatar with Menu: "Profile & prefs", "", "separator" Logout"

Sidebar (drawer)
- On mobile is hidden, and opens as a drawer with [icon + label]
- On desktop is a simple Sidebar with icons, labels go as hover hints: we want all possible space for content
- Items
   - Mails (Home)
   - Persons + Orgs
   - Documents
   - Advanced (user personal advanced configs ?)
   - separator
   - Admin (only admins) + Monitor

Pages:
- Home (Home alerts, Grouped email view)
- Compose
- Contacts
- Documents
- Profile
- Admin  (admins only) accounts, entity rules, backup, users, monitors

Compose
-  markdown + HTML (Tiptap or ProseMirror).

ROUTING: We will use Hash based routing

LATTER: IndexedDB cache for list views; localStorage for prefs.

**Deliverable:** basic protoype with main placeholder routes.

----

**IMPORTANT** We stop here until we do the Data modeling work.

## Phase 3 - Data Layer

> ⛔ **BLOCKED** - data modeling needs more forward thinking (see P1 notes on `Entity` / `EntityProperty` / `Document` / de-normalization). All downstream phases (P4-P9) inherit this block until resolved.

**Goal:** DuckDB + LMDB storage, migrations, repos.

**Pre-phase data-model pass (required before any schema work):**

- [ ] Pick storage strategy for `EntityProperty`: typed columns per kind, single EAV table, DuckDB `STRUCT`/`MAP`, or hybrid. Bench the "unpaid invoices by provider sorted by due date and amount" query.
- [ ] Decide `Person`/`Organization` ↔ `Entity` relationship (subtype / mirror / separate).
- [ ] Decide `Document` ↔ `Attachment` ↔ `Entity` relationships + versioning key.
- [ ] Decide whether `Catalog` is a stored artifact or a pure query.
- [ ] Decide where LLM detection prompts live (DB row / config file / both) and how re-classification is triggered.
- [ ] Produce ERD + sample queries doc before ticking any schema item below.

- [ ] DuckDB init in `data/unwild.duckdb` - schemas:
  - `accounts`, `emails`, `email_bodies`, `attachments_meta`,
    `persons`, `organizations`, `entities`, `entity_links` (m:n),
    `threads`, `labels`, `sync_state`.
- [ ] Enable FTS extension, index subject + body + sender.
- [ ] LMDB for hot/mutable state: sync cursors, UIDVALIDITY maps, queue state.
- [ ] Attachments stored as files under `docs/<yyyy>/<mm>/<hash>` + metadata row.
- [ ] Migration runner (versioned SQL files).
- [ ] Repository pattern per entity (pure TS, no RPC leakage).
- [ ] Seed / fixtures for dev.

**Deliverable:** can insert + query emails and entities via repo API in tests.

---

## Phase 4 - Email Ingestion

**Goal:** pull mail in reliably.

- [ ] IMAP client (generic SMTP/IMAP accounts) - use `imapflow` or equivalent.
- [ ] Gmail/Outlook adapters via OAuth2 (provider-specific modules).
- [ ] Account manager: add / remove / test credentials.
- [ ] Sync engine:
  - Initial full sync (bounded + resumable).
  - Incremental sync via IDLE / history IDs / UID.
  - Backpressure + rate limits per provider.
- [ ] MIME parser → normalized `Email` + attachments extracted to `docs/`.
- [ ] Dedup by Message-ID; thread assembly via References/In-Reply-To.
- [ ] SMTP send pipeline (outbox queue, retry, DSN handling).

**Deliverable:** connect a test account, see emails land in DuckDB, send one out.

---

## Phase 5 - Entity-First Engine

**Goal:** the differentiator - auto-group by Org/Person/Entity.

- [ ] Person extraction from addresses (normalize, merge aliases).
- [ ] Organization inference from domain + signature heuristics.
- [ ] Entity definition DSL (user-defined rules: regex, sender, subject, attachments).
- [ ] Background classifier worker - runs on ingest + on rule change.
- [ ] Link table maintenance; idempotent re-classification.
- [ ] Aggregations: per-entity counts, last activity, unread, priorities.
- [ ] "Invoice-like" semantic tags (rule-based v1; ML later).

**Deliverable:** query `entities.top('Invoice')` → ranked orgs.

---

## Phase 6 - RPC API Surface

**Goal:** stable methods for the Web App.

- [ ] `auth.*` - local user/session (multi-user households).
- [ ] `accounts.*` - CRUD, test, sync status.
- [ ] `entities.*` - list, query, create rule, rebuild.
- [ ] `emails.*` - list by entity/thread, get body, mark, move, delete.
- [ ] `compose.*` - draft save, send, attach.
- [ ] `search.*` - FTS across emails + entities.
- [ ] `monitor.*` - sync progress, queue depths, health.
- [ ] Pagination + streaming (chunked CBOR frames) for large lists.

**Deliverable:** API fully typed in `lib/`, testable via RPC client.

---

## Phase 7 - Web App (`app/`)

**Goal:** Svelte 5 SPA; entity-first UX.

- [ ] Svelte 5 + Vite setup, runes mode.
- [ ] Typed RPC client (CBOR) sharing types from `lib/`.
- [ ] Routing: Home / Entity / Thread / Email / Compose / Admin / Monitor.
- [ ] `AppShell.svelte`, `EntityList.svelte`, `EntityView.svelte`,
      `ThreadView.svelte`, `EmailView.svelte`, `Composer.svelte`.
- [ ] Composer: markdown + HTML (Tiptap or ProseMirror).
- [ ] Search bar with live FTS.
- [ ] IndexedDB cache for list views; localStorage for prefs.
- [ ] Admin UI: accounts, entity rules, backup, users.

**Deliverable:** usable daily-driver UI against a real account.

---

## Phase 8 - Packaging & Distribution

**Goal:** "Portable App" zip.

- [ ] Bun compile to `unwild` / `unwild.exe`.
- [ ] Folder layout: `unwild(.exe)`, `modules/`, `public/`, `data/`, `docs/`.
- [ ] First-run wizard (create admin, add first account).
- [ ] Self-update channel (download + swap folder) - optional v2.
- [ ] Backup/restore command (zip `data/` + `docs/`).
- [ ] Signed releases for win/mac/linux.

**Deliverable:** double-click zip → working appliance.

---

## Phase 9 - Hardening

- [ ] Encryption at rest for creds (libsodium box via LMDB).
- [ ] Rate limiting on `/api`; CSRF/Origin checks for browser clients.
- [ ] Telemetry OFF by default; local-only metrics page.
- [ ] Crash recovery: WAL checkpoints, queue replay.
- [ ] Docs: user guide, admin guide, architecture doc.
- [ ] E2E tests (Playwright) + integration tests (Bun test).

---

## Open Questions

1. OAuth redirect for Gmail/Outlook on a LAN appliance - loopback flow or device flow?
2. Multi-user model: per-account visibility rules? shared entities?
3. HTML sanitization strategy for rendering untrusted email bodies.
4. FTS tokenizer for mixed-language inboxes.
5. Attachment preview (PDF/image thumbnails) - built-in or lazy?

---

## Milestones (rough)

- **M1:** Phases 0-3 → server + storage ready.
- **M2:** Phases 4-5 → ingests + classifies real mail.
- **M3:** Phases 6-7 → shippable UI.
- **M4:** Phases 8-9 → v1.0 release zip.
