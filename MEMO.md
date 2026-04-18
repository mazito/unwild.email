# MEMO — Session State

## Last Session — 2026-04-18 (cont.)

### Branch
`main`

### Summary
Resumed the deferred task from the previous session and completed it.

1. Wrote `docs/EMAIL-DATA.md` — exhaustive catalog of every extractable
   email field, with IETF/W3C references.
2. Scope: IMAP4rev1/2 assumed; POP3 explicitly out of scope; JMAP noted as
   future-compatible so the data model stays provider-agnostic.
3. Structure covers: transport metadata (IMAP), SMTP envelope residue,
   RFC 5322 headers, MIME + multipart semantics, body extraction (HTML /
   plain-text), attachments, authentication (SPF/DKIM/DMARC/ARC/BIMI),
   mailing lists, delivery reports (DSN/MDN/ARF), S/MIME & PGP, i18n
   (EAI, SMTPUTF8, IDN), calendar (iMIP), priority/importance,
   vendor/X-* headers, derived/computed fields, a v0 persistence
   recommendation, and a consolidated deprecated/ignore list.
4. Legend used: 🟢 Core / 🟡 Useful / 🔵 Niche / ⚫ Deprecated / 🧮 Derived.
5. `DRAFT.md` instruction is now satisfied — safe to clear/reuse.

### Current state — what works
(No code changes this session — docs only.)
- `bun run check` → lint + typecheck + 14/14 tests green.
- `bun run dev:server` → Bun HTTP on `:3030`.
- `bun run dev:app` → Vite on `:5173`.

### Key decisions
1. POP3 is **out of scope** for the sync pipeline (no folders, no per-message
   flags). Document explicitly says so.
2. Always persist the **raw RFC 5322 blob + SHA-256** alongside the parsed
   tree — required for DKIM re-verification and forensic features. Retention
   policy is an open question (§19).
3. Provider-native IDs (`X-GM-MSGID`, Graph id) to be captured as
   **additional metadata** next to `Message-ID`, not as primary key.
4. `Authentication-Results` is the preferred source for auth verdicts over
   raw per-method headers — but only entries matching our configured
   boundary MTA's `authserv-id` should be trusted.

### Next steps
1. **Review `docs/EMAIL-DATA.md` with user** — confirm priority buckets,
   resolve §19 open questions, pick which derived fields (§16) are v0.
2. **Fold findings back into `docs/DATA-MODEL.md`** — §2 `Email` core field
   list, §7 checklist items (header storage strategy, attachment storage,
   Document↔Attachment version key now has more context from §7 of EMAIL-DATA).
3. Swap JSON → CBOR in `lib/src/rpc/cbor.ts`.
4. Add `svelte-check` to `bun run check` pipeline.
5. Polish app shell.

### Key files changed this session
- `docs/EMAIL-DATA.md` — **created** (~380 lines, 25.7 KB).
- `TODO.md`, `MEMO.md`, `CHANGES.md` — bookkeeping updates.
