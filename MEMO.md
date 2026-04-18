# MEMO — Session State

## Last Session — 2026-04-18 (session 2, cont.)

### Branch
`main`

### Summary
Docs-only session. Built the raw-email relational model and iterated on
storage decisions with the user. User is still reviewing and leaving
`!!!` comments inline in `docs/EMAILS-BASE-MODEL.md`.

1. Wrote `docs/EMAIL-DATA.md` (earlier in the day).
2. Wrote `docs/EMAILS-BASE-MODEL.md` — DuckDB relational model, 18
   tables, conventions block at top, sample queries, open questions.
3. Folded three design decisions into the model:
   - Server on-disk layout `data/{duckdb,lmdb,raw,documents}`.
   - Sync state is **out of scope** for the emails model — moved to a
     future `docs/SYNC-MODEL.md` (LMDB-backed). Removed
     `sync_checkpoints` table.
   - Raw RFC 5322 bytes → append-only Parquet shards (partitioned by
     `account_uid` + `yyyy-mm`). Removed `raw_messages` table. Also
     removed `body_blob`/`body_blob_ref` from `mime_parts` and
     `storage_ref` from `attachments` — `content_sha256` is the sole
     pointer into `data/documents/`.
4. User started reviewing with `!!!` annotations — **session closed
   before the review finished**.

### Current state — what works
Docs only; no code changes.
- `bun run check` → lint + typecheck + 14/14 tests green.
- `bun run dev:server` → Bun HTTP on `:3030`.
- `bun run dev:app` → Vite on `:5173`.

### Open `!!!` review threads (unresolved)

These are inline in `docs/EMAILS-BASE-MODEL.md`. Resolve next session.

1. **Filename key in `data/documents/`** — user asks whether to use
   `content_sha256` (current) vs `uid` (UUIDv7) as the filename. Same
   question for raw Parquet rows. Concerns: consistency with table
   primary keys, and key efficiency (sha256 string vs UUIDv7 bigint).
   *Action:* write a short comparison. Short answer: sha256 enables
   cheap content-addressed dedup; uid is better if we want a single
   canonical row per email regardless of content. Possibly both (uid
   is the filename, sha256 is a dedup index). Propose & let user decide.

2. **Raw Parquet primary key** — user proposes using `email_uid` as the
   key of the Parquet row for easier joins. Currently we have both
   (`email_uid` AND `raw_sha256`). *Action:* confirm `email_uid` is
   the natural join key; keep `raw_sha256` as secondary for dedup /
   integrity. Likely already covered but make it explicit in §4.2.

3. **`_to` suffix convention** (§0.4 / §0.5) — user wants `_to` added
   as a sibling convention to `_by` (e.g. `assigned_to`,
   `assigned_to_uid`). *Action:* add to the conventions table and to
   §0.4 prose.

4. **`_ref` for internal files** (§0.5) — user prefers internal refs
   point via `uid` (or sha256) into a known folder, not arbitrary
   paths/URIs. *Action:* restrict `_ref` to external resources only
   (S3 URL etc.); internal storage uses the convention
   `<folder>/<uid-or-sha256>.<ext>`. Document this.

5. **`users` table concept** (§2.1) — user wants clarity on what a
   "user" is: the App/server user, separate from email accounts. Also
   raises auth question: username+password? OTP via email (chicken &
   egg — can't receive OTP if not logged in)? TOTP / Authenticator?
   *Action:* remove `email` UNIQUE from `users`, rename to something
   like `login_email` or remove entirely. Propose a minimal auth
   model: username + password (argon2) + optional TOTP. Not in this
   doc's scope though — maybe just clarify and punt to a future
   `docs/AUTH-MODEL.md`.

### Key decisions made this session
1. DuckDB = relational model only. No raw/binary BLOBs.
2. LMDB = sync state + high-churn KV (separate subsystem, separate doc).
3. `data/raw/` = append-only Parquet, partitioned by `account_uid` +
   `yyyy-mm`, joined on `raw_sha256` via `read_parquet()`.
4. `data/documents/` = content-addressed by `content_sha256`.
   (**May change** per open thread #1.)

### Next steps (prioritized)
1. **Resolve the 5 open `!!!` threads** in `docs/EMAILS-BASE-MODEL.md`.
2. **Finish the review** (user may add more comments).
3. Fold approved table list into `docs/DATA-MODEL.md` §2.
4. Draft `docs/SYNC-MODEL.md` for the LMDB-backed sync subsystem.
5. Decide Parquet shard/rollover policy.
6. Implement migration runner under `server/` and land `001_init.sql`.
7. Swap JSON → CBOR in `lib/src/rpc/cbor.ts`.
8. Add `svelte-check` to `bun run check`.

### Key files changed this session
- `docs/EMAIL-DATA.md` — created earlier + minor heading tidy.
- `docs/EMAILS-BASE-MODEL.md` — **created**; then amended with storage
  layout + Parquet + LMDB decisions; user added `!!!` review notes.
- `DRAFT.md` — user rewrote with the raw-model task.
- `Sin título.md` — created (empty) then deleted.
- `TODO.md`, `MEMO.md`, `CHANGES.md` — bookkeeping.
