# MEMO — Session State

## Last Session — 2026-04-18 (session 3)

### Branch
`main`

### Summary
Mixed session: small UI fix in `app/` + resolved all `!!!` review threads
in `docs/EMAILS-BASE-MODEL.md` and spun out `docs/AUTH-MODEL.md`.

### UI (app/)
- `#/mails` route was broken (sidebar link → NotFound). Router lived in
  `app/src/lib/router*.ts` which user found unclear.
- Consolidated both router files into a single
  `app/src/router.svelte.ts` next to `App.svelte`, with an inline header
  comment explaining how the hash router works and how to add a page.
- Deleted `app/src/lib/router.ts` and `app/src/lib/router.svelte.ts`.
- Added a real `Home` page (`app/src/pages/Home.svelte`).
  - `#/` and `#/home` → Home (landing page with links).
  - `#/mails` → Mails page (the one that does RPC ping).
- Updated imports in `App.svelte`, `Sidebar.svelte`, `Header.svelte`.
- Sidebar logo now links to `home`.
- Committed `c49279a` and pushed.

### Docs
Resolved the 5 `!!!` threads in `docs/EMAILS-BASE-MODEL.md`:

1. **Documents filename** → keep `content_sha256` (free dedup,
   self-proving integrity). The email↔file relation is carried by the
   existing `attachments` table (§7.2). Decision note inline.
2. **Raw Parquet join key** → `email_uid` (not `raw_sha256`).
   `raw_sha256` stays as verification/dedup column. Updated §4.2 table,
   sample query, and footer note.
3. **`_to` suffix** → added as sibling of `_by` in §0.4 and §0.5.
   Semantic: `_by` = subject, `_to` = object. Snapshot rationale same.
4. **`_ref` suffix** → restricted to **external** resources only
   (S3 URL, remote http). Internal files located by pure function of a
   key (`data/documents/<content_sha256>`, raw Parquet by `email_uid`).
   Added convention block to §0.5.
5. **`users` concept** → rewrote §2.1. App-user, not email address.
   Fields: `username UNIQUE`, `display_name`, `login_email` (recovery
   only, not auth, not unique), `password_hash`, `totp_secret`. No
   `email UNIQUE`. Auth details deferred to new `docs/AUTH-MODEL.md`.

Also added `account_uid` FK to `emails` table (denormalized from
`mailboxes.account_uid`) so partitioning and raw-Parquet joins are
trivial without a 3-way join. Added matching index.

Removed all `!!!` annotations; §14 checklist item marked done.

### New doc
`docs/AUTH-MODEL.md` — stub covering:
- Core principle: login identity ≠ email address.
- Proposed `users` fields (mirrors §2.1).
- Flows: username+password (argon2id) → optional TOTP 2FA → recovery
  via optional `login_email`.
- Out-of-scope for v1 (OAuth, WebAuthn, org/role model).
- Open questions (session storage, bootstrap, rate-limit, admin role).

### Current state
- `app/` compiles; my changes clean under `svelte-check` (remaining
  errors are pre-existing env/lucide issues).
- Docs-only for the `docs/` changes.

### Next session — candidate threads
1. Flesh out `docs/AUTH-MODEL.md`: pick session storage, first-run
   bootstrap flow, argon2id params, admin role shape.
2. Start `docs/SYNC-MODEL.md` (LMDB-backed; still empty).
3. Start actually implementing the DuckDB schema from
   `EMAILS-BASE-MODEL.md` (migration file / bootstrap code).
4. Parquet shard rollover policy (open question §13.1).
5. Pre-existing `app/` svelte-check env noise — worth cleaning.

### Commits this session
- `c49279a` app: fix Mails route, move router next to App, add Home page
- (pending) docs: resolve EMAILS-BASE-MODEL review threads + add AUTH-MODEL stub
