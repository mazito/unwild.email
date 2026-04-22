# MEMO — Session State

## Last Session — 2026-04-22

### Branch
`main`

### Summary
Variant UI experiment: replaced the old monolithic app with a clean Action-First UI scaffold. The old codebase was archived as `app-classic`. The new `app/` holds a minimal Svelte 5 project with hash-router navigation across four pages (Todo, Waiting, Protected, Account). Only Todo has content: a white card with "New (todo)" and "Done" sections, grouping messages by sender with thread lines and timestamps.

### What was done
1. Renamed existing `app/` → `app-classic/` (full archive of prior SPA).
2. Scaffoled a clean `app/` workspace with `package.json`, `vite.config.ts`, `svelte.config.js`, `tsconfig.json`, `index.html`, `src/main.ts`, `src/app.css`, `src/vite-env.d.ts`.
3. Replaced Tailwind palette with bespoke Unwild tokens (`--color-uw-bg`, `--color-uw-card`, `--color-uw-text`, `--color-uw-muted`, `--color-uw-line`, `--color-uw-orange`, `--color-uw-red`, `--color-uw-teal`).
4. Wrote `router.svelte.ts`: `#/` → Todo, `#/waiting` → Waiting, `#/protected` → Protected, `#/account` → Account, plus `notfound` catch-all.
5. Wrote `App.svelte` with fixed header + routed main area.
6. Wrote `AppHeader.svelte`:
   - Logo with `Sprout` icon + "nwild / your email" lockup,
   - Three nav links with underline active state,
   - Gradient avatar ring linking to Account (added `aria-label` to silence a11y warning).
7. Wrote `SenderBlock.svelte`: colored initial avatar, sender name, thread lines (`In :>` / `Re <:`), timestamps.
8. Wrote `SectionHeader.svelte`: bold uppercase title + hairline + "Grouped by" / "Ordered by" action button with `LayoutGrid` icon.
9. Wrote page components:
   - `TodoPage.svelte` with two sections and mock sender data.
   - `WaitingPage.svelte`, `ProtectedPage.svelte`, `AccountPage.svelte` as empty placeholders.
10. Verified build (`bun run build`) — clean, no errors.

### Current state — what works
- `bun run build` succeeds in the new `app/` workspace.
- Navigation between tabs works via hash routes.
- Design from the wireframe is roughly reproduced (white card, section headers, sender blocks).

### Pending / next steps
1. Wire `SenderBlock` and `SectionHeader` to real API data once endpoints exist.
2. Implement content for Waiting, Protected, and Account pages.
3. Add search / filter.
4. Add compose / reply flows.
5. Restore the `svelte-check` step in the root `check` script and update `tsconfig.json` include path.

### Blockers / open questions
- None from this session.

### Important decisions made and why
- Archive-don't-delete: renaming `app` → `app-classic` lets us switch back or cherry-pick components easily.
- Hash router in `router.svelte.ts` stays single-file, zero-deps, just like the classic app.
- Inline `style="background-color: {color}"` used for sender avatars because Tailwind v4 arbitrary values (`bg-[#…]`) were balked at by the build step during rapid iteration.

### Key files changed this session
- `app/` (entire workspace recreated)
- `app-classic/` (renamed from previous `app/`)

---

## Previous Session — 2026-04-20

### Branch
`main`

### Summary
Short housekeeping session. Resolved 6 pending git merge conflicts in
`docs/EMAILS-BASE-MODEL.md` and pushed to origin.

### What was done
1. Read session files (AGENTS.md, MEMO.md, LEARNINGS.md, TODO.md).
2. Detected 6 merge conflict markers in `docs/EMAILS-BASE-MODEL.md`:
   - §0.6 trailing blank lines after enum section.
   - §2.1 `users` table column names (`login_name` / `contact_email` vs
     `username` / `login_email` + auth columns). Kept HEAD version
     (`login_name` + `contact_email`, auth out-of-scope note).
   - §2.1 notes block (HEAD prose vs incoming `> Decision:` block). Kept HEAD.
   - §4.2 Parquet table `email_uid` description wording. Kept HEAD.
   - §4.2 sample SQL query (`AND e.raw_sha256 = r.raw_sha256` line). Kept HEAD.
   - §4.2 closing note wording. Kept HEAD.
3. Committed merge (`f4f972a`), pulled (already up to date), pushed.

### Current state — what works
- `main` is clean, no conflict markers anywhere.
- `docs/EMAILS-BASE-MODEL.md` is the authoritative version with HEAD choices.

### Pending / next steps
1. Review `docs/EMAIL-DATA.md` with the user — validate priority buckets
   (🟢🟡🔵), answer §19 open questions, decide which derived fields (§16)
   are v0.
2. Fold EMAIL-DATA findings back into `docs/DATA-MODEL.md` §2 and §7 checklist.
3. Continue reviewing `docs/EMAILS-BASE-MODEL.md` if user adds more comments;
   then fold approved tables into `docs/DATA-MODEL.md`.
4. Work through `docs/DATA-MODEL.md` §7 checklist to unblock P3.
5. Swap JSON → CBOR in `lib/src/rpc/cbor.ts`.
6. Add `svelte-check` to `bun run check` pipeline.
7. Polish app shell (real logo vector, theme switcher, mobile drawer).

### Blockers / open questions
1. Parquet shard/rollover policy.
2. `content_sha256` text vs blob representation.
3. Threading scope (per-account vs global).
4. Keyword scope (per-account vs per-user).
5. Attachment GC strategy.

### Important decisions made and why
- Kept HEAD version of all conflicts (more complete prose, auth-out-of-scope
  note, `login_name` naming convention already reviewed and accepted).

### Key files changed this session
- `docs/EMAILS-BASE-MODEL.md` — merge conflicts resolved.
- `MEMO.md`, `CHANGES.md` — session bookkeeping.

---

## Previous Session — 2026-04-19

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

### Key files changed this session
- `docs/EMAILS-BASE-MODEL.md` — review comments resolved and prose cleaned.
- `MEMO.md`, `TODO.md`, `CHANGES.md` — session bookkeeping.
