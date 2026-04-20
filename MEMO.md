# MEMO — Session State

## Last Session — 2026-04-19

### Branch
`main`

### Summary
Docs-only follow-up session focused on resolving the user's review notes in
`docs/EMAILS-BASE-MODEL.md`.

1. Folded the review comments into the doc and removed the inline `!!!`
   blocks.
2. Clarified the storage-key split:
   - `data/documents/` stays content-addressed by `content_sha256`.
   - raw Parquet rows are joined by `email_uid`, with `raw_sha256` kept as
     the integrity / dedup fingerprint.
3. Added `_to` / `_to_uid` to the schema conventions and restricted `_ref`
   to external references only.
4. Clarified that `users` are app/server principals, not mailbox
   identities; replaced `users.email` with `login_name` + optional
   `contact_email`, and deferred auth details to a future
   `docs/AUTH-MODEL.md`.
5. Cleaned a few stale references from the previous draft
   (`sync_checkpoints` in mutable tables, old raw-storage wording, next-step
   note about `!!!` annotations).

### Current state — what works
Docs only; no code changes.
- `docs/EMAILS-BASE-MODEL.md` no longer contains unresolved `!!!` review
  markers.
- The raw-email model now consistently treats `email_uid` as the direct join
  key into Parquet.

### What is done
1. Resolved the five review threads captured in the previous memo.
2. Kept `data/documents/` on `content_sha256` and documented why that is a
   blob-store key, not a relational key.
3. Updated the raw-bytes section, sample query, and open questions so they
   align with `email_uid`-based joins.
4. Updated the conventions and `users` section to match the user's review.

### Pending / next steps
1. Continue the review in case the user adds more comments.
2. Fold the approved email tables into `docs/DATA-MODEL.md` §2.
3. Draft `docs/SYNC-MODEL.md` for the LMDB-backed sync subsystem.
4. Decide Parquet shard/rollover policy.
5. Implement migration runner under `server/` and land `001_init.sql`.
6. Swap JSON → CBOR in `lib/src/rpc/cbor.ts`.
7. Add `svelte-check` to `bun run check`.

### Blockers / open questions
1. No blocker for the docs pass.
2. Still open at model level: Parquet shard policy, `content_sha256` text vs
   blob representation, threading scope, keyword scope, attachment GC.

### Important decisions made and why
1. Keep `content_sha256` as the on-disk key in `data/documents/` because it
   gives content-addressed dedup and a path that is a pure function of the
   bytes.
2. Treat `email_uid` as the logical raw-row key because it makes joins from
   DuckDB straightforward, while `raw_sha256` still covers integrity and
   duplicate-payload analysis.
3. Keep authentication modeling out of the email schema doc to avoid mixing
   mailbox persistence concerns with app-auth design.

### Key files changed this session
- `docs/EMAILS-BASE-MODEL.md` — review comments resolved and prose cleaned.
- `MEMO.md`, `TODO.md`, `CHANGES.md` — session bookkeeping.

---

## Previous Session — 2026-04-18 (session 3)

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
   self-proving integrity). The email↔file relation is still carried by the
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

### New doc
`docs/AUTH-MODEL.md` — stub covering:
- Core principle: login identity ≠ email address.
- Proposed `users` fields (mirrors §2.1).
- Flows: username+password (argon2id) → optional TOTP 2FA → recovery
  via optional `login_email`.
- Out-of-scope for v1 (OAuth, WebAuthn, org/role model).
- Open questions (session storage, bootstrap, rate-limit, admin role).

### Commits this session
- `c49279a` app: fix Mails route, move router next to App, add Home page
