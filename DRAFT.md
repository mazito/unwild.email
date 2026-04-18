# DRAFT

This is a temp file for writing long instructions or descriptions instead of very long prompts.

## CONTEXT

We will be working with the ./docs/DATA-MODEL.md defining the model structure, tables, etc

## DO

Review of the 5 `!!!` threads in `docs/EMAILS-BASE-MODEL.md`. Answer inline
with `>>>` under each item (or edit freely). I'll then apply to the doc.

---

### 1. L78 — documents filename: `content_sha256` vs `uid` (UUIDv7)

**My take: keep `content_sha256`.** Reasons:
- **Dedup is free**: two emails with the same PDF attachment → one file on
  disk. With `uid`, same bytes stored N times.
- **Integrity is self-proving**: filename *is* the checksum; detecting
  bit-rot = trivial.
- **Key efficiency is not a concern for filenames** (the FS doesn't index
  them like a DB). Inside DuckDB, `content_sha256 TEXT` vs `UUID` cost
  delta is negligible vs the rest of the row.
- Consistency with other `_uid` fields: fine to break here because the
  filename is a *physical* store key, not a logical row PK.
  `attachments.uid` is still a UUIDv7.

**Compromise if you want uid-locatability**: keep sha256 as filename, add
a thin index table `documents(uid UUID PK, content_sha256 TEXT UNIQUE, …)`
— best of both. I'd defer until there's a real use case.

>>> 
Agreed with this. Good catch about dedup.

BUT We need a table to relate emails to files hash (maybe it exists 
in the rest of the doc i didnt read yet), because if same attach appears in 
more then one email, we need to keep that relation. 

---

### 2. L98 — raw Parquet primary key: use `email_uid`

**Agree** — make `email_uid` the natural join key for raw Parquet rows;
keep `raw_sha256` as a secondary column for dedup/integrity but not the
join key. This makes `emails ⟕ raw` trivial and consistent with `_uid`
convention.

Action: in §4 (raw storage), change the canonical lookup from "pick row by
`raw_sha256`" → "pick row by `email_uid`; `raw_sha256` is a
verification/dedup column".

>>> 
OK

---

### 3. L158 — `_to` suffix convention (sibling of `_by`)

**Agree.** Add to §0.4 and §0.5:

- `_to` — target actor display snapshot (e.g. `assigned_to`)
- `_to_uid` — target actor FK (e.g. `assigned_to_uid`)

Semantic: `_by` = *who did it* (subject), `_to` = *who received it / is
targeted* (object). Same snapshot rationale.

>>> 
OK

---

### 4. L182 — `_ref` suffix, internal files

**Agree.** Restrict `_ref` to **external** storage only (S3 URL, remote
path, etc.). For internal files use a convention, not a column:

- Internal file location = **pure function of a key** → no stored path.
- Documents folder: `data/documents/<content_sha256>` (or `<uid>.<ext>` if
  we switch to #1).
- Raw shards: partitioned Parquet, resolved by
  `(account_uid, yyyy-mm, email_uid)`.

Add a one-liner to §0.5 table row for `_ref` and a note in the conventions
prose.

>>> 
OK

---

### 5. L304 — what is a `user`?

Good question, and the current `users.email UNIQUE` conflates "app login"
with "email account" — those must be separate.

**Proposal:**

- A `user` = **app/server user** (logs into the UI). Distinct from email
  `accounts` they own (0..N).
- Remove `email UNIQUE` from `users`. Replace with:
  - `username TEXT NOT NULL UNIQUE` (login handle)
  - `display_name TEXT`
  - `login_email TEXT` (optional, for recovery only — not unique, not auth)
  - `password_hash TEXT` (argon2id)
  - `totp_secret TEXT` (optional, for 2FA)

**Auth flow (minimal, self-hosted-friendly):**
1. Primary: username + password (argon2id).
2. Optional 2FA: TOTP (Authenticator app) — solves the "can't get OTP via
   email if you can't read email yet" chicken-and-egg.
3. Email OTP only for *recovery*, not primary auth, and only if user has
   set a non-account recovery address.

This is out of scope for EMAILS-BASE-MODEL though — suggest a stub section
"users is an app-user; auth deferred to `docs/AUTH-MODEL.md`" and move
details there.

>>> 
!!! But an observation here, the Users (1..N) Accounts relation, and the 
Accounts (1..N) Emails relation brings us that we need at least the account_uid 
in the Emails table (maybe this already is in the model, not read all yet)

!!! These considers the Account belongs to only one user, as is described in the table. 

---

### Next steps (pick)

1. Apply edits 2, 3, 4 directly to `EMAILS-BASE-MODEL.md` (clear agreements)?

Yes

2. For 1 and 5, replace `!!!` threads with short "Decision:" notes?

Yes

3. Stub `docs/AUTH-MODEL.md` with the auth proposal?

Do it

>>> 

