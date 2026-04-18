# EMAILS-BASE-MODEL.md — Raw email relational model

Persistence layer for **raw, ingested email data**. This is the "mailbox as
it came off the wire" layer — before any semantic promotion (Entities,
Documents, Person/Organization resolution, which live in
`docs/DATA-MODEL.md`).

Source of field-level truth: `docs/EMAIL-DATA.md`.

Status: **DRAFT — open design.** Nothing final until marked ✅.

DB: **DuckDB** (≥ 1.3 for native `uuidv7()`). SQL dialect below is DuckDB.

---

## 0. Naming & schema conventions

These conventions apply to **every table** in this model (and should be
extended to the rest of the schema where sensible).

### 0.1 Casing & plurality
- **Table names:** plural, `snake_case` → `emails`, `mime_parts`,
  `email_addresses`.
- **Column names:** `snake_case`. No camelCase, no PascalCase.
- Avoid SQL reserved words (`user` → `users`, `order` → `orders`).

### 0.2 Identifiers
- **`uid`** — the primary key of **every** table, including M:N join
  tables. Type `UUID`, UUIDv7 (time-ordered,
  [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562)),
  `DEFAULT uuidv7()`.
- **`id`** — reserved for `INTEGER` / `BIGINT` auto-increment columns only.
  Not used as primary key in this model. Use when a short numeric handle is
  genuinely needed (e.g. display ticket numbers).
- **Foreign keys:** always suffixed `_uid`, e.g. `account_uid`, `mailbox_uid`,
  `sender_uid`. Because every row has a `uid`, FK naming is consistent across
  the whole schema.
- **Self-referencing FKs:** `parent_uid`, `reply_to_uid`, etc.

### 0.3 Timestamps
- **All times in UTC, ISO-8601.** Stored as `TIMESTAMP` (DuckDB interprets as
  UTC-naïve; our convention is "everything is UTC"). `TIMESTAMPTZ` only if we
  ever need to *display* original TZ.
- Suffix **`_utc`** mandatory for any point-in-time column: `created_utc`,
  `sent_utc`, `internal_date_utc`.
- Standard row-lifecycle columns on every table:
  - `created_utc TIMESTAMP NOT NULL DEFAULT current_timestamp`
  - `updated_utc TIMESTAMP` (NULL until first update)
  - `deleted_utc TIMESTAMP` (NULL = alive; non-null = soft-deleted)
- For an original wire-timestamp coming from the message itself, use the
  descriptive prefix: `internal_date_utc`, `date_header_utc`, `received_utc`.

### 0.4 Actors ("who")
Pattern for tracking who did something (app users, not email senders):

- **`<actor>_uid`** — FK to `users` (or equivalent). Canonical link.
- **`<actor>_by`** — denormalized display string captured at the event
  (e.g. `"Alice Doe <alice@acme.com>"`). Immutable snapshot; survives
  renames/deletions of the user row.

Examples: `created_by_uid` + `created_by`, `assigned_to_uid` + `assigned_to`,
`updated_by_uid` + `updated_by`.

> **Rationale for `_by` as a snapshot:** avoids broken audit trails when the
> referenced user changes. The `_uid` remains the relational truth; the `_by`
> is what you show in a historical log without a join.
> Using `creator_fullname` would be more explicit but `_by` is idiomatic and
> short enough for frequent queries.

### 0.5 Type-suffix conventions

| Suffix | Meaning | Example |
|---|---|---|
| `_uid` | UUIDv7 FK | `mailbox_uid` |
| `_utc` | UTC timestamp | `created_utc` |
| `_by` | Actor display snapshot | `created_by` |
| `_by_uid` | Actor FK | `created_by_uid` |
| `_kind` | Closed-set string enum (CHECK-constrained) | `role_kind` |
| `_bytes` | Size in octets | `size_bytes` |
| `_count` | Cardinal count | `email_count` |
| `_sha256` | Lowercase hex SHA-256 digest | `content_sha256` |
| `_json` | Opaque JSON blob | `params_json` |
| `_blob` | Inline binary (`BLOB`) | `bytes_blob` |
| `_ref` | External storage reference (path/URI) | `body_blob_ref` |
| `_raw` | Unparsed original text | `value_raw`, `subject_raw` |
| `_normalized` | Canonicalized form | `subject_normalized` |
| `is_*` / `has_*` prefix | Boolean | `is_draft`, `has_attachments` |
| `position` | 0-based order within a parent | `position` |

### 0.6 Enums — CHECK over ENUM
Closed-set fields use `TEXT` + `CHECK` (not DuckDB `ENUM`):

- Extending an `ENUM` in DuckDB is awkward (requires recreating the type).
- `CHECK` constraints are easy to loosen/tighten via migration.
- Suffix the column with `_kind`.

Example: `role_kind TEXT NOT NULL CHECK (role_kind IN ('from','sender', …))`.

### 0.7 JSON & STRUCT
- Use native `JSON` type for open-ended / rarely-queried blobs
  (`params_json`, `properties_json`, `raw_headers_json`).
- Use DuckDB `STRUCT(...)` when the shape is fixed and we want columnar
  access. Suffix `_struct` is **not** needed — pick `_json` only when it's
  opaque JSON text.

### 0.8 Column order (within `CREATE TABLE`)
1. `uid` (PK).
2. Foreign keys (`*_uid`).
3. Natural / business columns.
4. Denormalized snapshots (`_by`, `from_domain`, …).
5. Large blobs / JSON.
6. Row-lifecycle timestamps (`created_utc`, `updated_utc`, `deleted_utc`).

### 0.9 Indexes
DuckDB maintains zone-maps automatically; ART indexes exist for equality.
We only declare:
- `PRIMARY KEY (uid)`.
- `UNIQUE (…)` for natural keys.
- `CREATE INDEX` for hot equality filters (e.g. `message_id`, `content_sha256`).

### 0.10 Referential integrity
DuckDB enforces `PRIMARY KEY` and `UNIQUE`, and (since v1.0+) `FOREIGN KEY`
at insert/update time. Cascading deletes are **not** supported — handled
app-side. We still declare FKs for intent + tooling.

### 0.11 Immutability & updates
Rows in the raw-ingest tables (`emails`, `email_headers`, `mime_parts`,
`received_hops`, `auth_results`, `dkim_signatures`, `attachments`,
`thread_references`, `calendar_invites`) are **append-only** once written.
Re-ingesting a message creates a new `uid` (old one soft-deleted). This
keeps DKIM verification and forensics sound.

Mutable tables (state, not wire data): `accounts`, `mailboxes`,
`sync_checkpoints`, `threads`, `email_flags` if we expose one, `keywords`,
`email_keywords`.

---

## 1. Overview

Diagram (textual):

```
users ──< accounts ──< mailboxes ──< emails ──┬──< email_headers
                                              ├──< email_addresses >── addresses
                                              ├──< mime_parts (self-ref tree)
                                              │       └──< attachments
                                              │       └──< calendar_invites
                                              ├──< received_hops
                                              ├──< auth_results
                                              ├──< dkim_signatures
                                              ├──< list_metadata  (0..1)
                                              ├──< thread_references
                                              ├──< email_keywords >── keywords
                                              └──1 raw_messages
threads ──< emails (via thread_uid)
mailboxes ──1 sync_checkpoints
```

A few design decisions worth flagging:

1. **Message-ID is not a reliable PK.** The RFC 5322 `Message-ID` *should*
   be globally unique but in practice may be missing, duplicated across
   senders, or re-used by buggy clients. We therefore generate our own
   `uid` (UUIDv7) on ingest. The `message_id` column is indexed but not
   unique.
2. **IMAP UID is per-mailbox.** The only stable wire identifier is the
   triple `(account_uid, mailbox_uid, imap_uid, imap_uid_validity)`. We
   enforce uniqueness on that tuple.
3. **Addresses are interned** into a single `addresses` table, and linked
   to emails via a role-tagged M:N (`email_addresses`). This enables "all
   mail from x@y" queries without scanning the header blob.
4. **MIME tree is stored as a self-referencing adjacency list** with a
   dotted `part_path` ("1.2.3") for quick lookup without recursion.
5. **Raw RFC 5322 bytes** live in `raw_messages` — either inline `BLOB` or
   external reference (`body_blob_ref`). Retention policy TBD (see DATA-MODEL
   §19 open questions).

---

## 2. Auxiliary tables (users + accounts)

Included for FK completeness. Detail belongs in another doc; keep minimal
here.

### 2.1 `users`

```sql
CREATE TABLE users (
    uid              UUID        PRIMARY KEY DEFAULT uuidv7(),
    email            TEXT        NOT NULL UNIQUE,
    display_name     TEXT,
    created_utc      TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    updated_utc      TIMESTAMP,
    deleted_utc      TIMESTAMP
);
```

### 2.2 `accounts`

A user's binding to one mailbox provider (IMAP/JMAP/Gmail API/Graph).

```sql
CREATE TABLE accounts (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    user_uid             UUID        NOT NULL REFERENCES users(uid),
    provider_kind        TEXT        NOT NULL
                         CHECK (provider_kind IN ('imap','jmap','gmail_api','ms_graph')),
    display_name         TEXT,
    email_address        TEXT        NOT NULL,
    imap_host            TEXT,
    imap_port            INTEGER,
    imap_username        TEXT,
    imap_use_tls         BOOLEAN     NOT NULL DEFAULT TRUE,
    smtp_host            TEXT,
    smtp_port            INTEGER,
    smtp_username        TEXT,
    smtp_use_tls         BOOLEAN     NOT NULL DEFAULT TRUE,
    credentials_ref      TEXT,       -- external secret store key; never store creds here
    last_sync_utc        TIMESTAMP,
    created_utc          TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    updated_utc          TIMESTAMP,
    deleted_utc          TIMESTAMP,
    UNIQUE (user_uid, email_address, provider_kind)
);
```

---

## 3. Mailbox (folder) structure

### 3.1 `mailboxes`

One row per IMAP folder (or JMAP mailbox). Path is the server-side full
name (e.g. `INBOX/Work`).

```sql
CREATE TABLE mailboxes (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    account_uid          UUID        NOT NULL REFERENCES accounts(uid),
    name                 TEXT        NOT NULL,               -- full server path
    delimiter            TEXT,                               -- IMAP hierarchy delimiter
    uid_validity         BIGINT,                             -- IMAP UIDVALIDITY
    highest_modseq       BIGINT,                             -- CONDSTORE HIGHESTMODSEQ
    special_use_kind     TEXT        CHECK (special_use_kind IN
                                     ('inbox','sent','drafts','junk','trash',
                                      'archive','all','flagged','important')),
    total_count          BIGINT      NOT NULL DEFAULT 0,
    unseen_count         BIGINT      NOT NULL DEFAULT 0,
    subscribed           BOOLEAN     NOT NULL DEFAULT TRUE,
    created_utc          TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    updated_utc          TIMESTAMP,
    deleted_utc          TIMESTAMP,
    UNIQUE (account_uid, name)
);
```

### 3.2 `sync_checkpoints`

Per-mailbox sync progress. Separate from `mailboxes` to keep the folder
record "clean" and to allow keeping a short history if we later want to
audit sync drift.

```sql
CREATE TABLE sync_checkpoints (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    mailbox_uid          UUID        NOT NULL REFERENCES mailboxes(uid),
    last_uid_seen        BIGINT,
    last_modseq_seen     BIGINT,
    last_sync_utc        TIMESTAMP,
    status_kind          TEXT        NOT NULL DEFAULT 'idle'
                                     CHECK (status_kind IN
                                     ('idle','syncing','success','error')),
    error_message        TEXT,
    created_utc          TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    updated_utc          TIMESTAMP,
    deleted_utc          TIMESTAMP,
    UNIQUE (mailbox_uid)
);
```

---

## 4. Core message table

### 4.1 `emails`

One row per ingested message *instance* (same message in two mailboxes =
two rows; dedup happens via `message_id` + `raw_sha256` at a higher layer).

```sql
CREATE TABLE emails (
    uid                         UUID        PRIMARY KEY DEFAULT uuidv7(),
    mailbox_uid                 UUID        NOT NULL REFERENCES mailboxes(uid),
    thread_uid                  UUID        REFERENCES threads(uid),

    -- IMAP coordinates (stable tuple)
    imap_uid                    BIGINT      NOT NULL,
    imap_uid_validity           BIGINT      NOT NULL,
    imap_modseq                 BIGINT,
    internal_date_utc           TIMESTAMP   NOT NULL,

    -- RFC 5322 identity
    message_id                  TEXT,                       -- may be NULL or duplicated
    in_reply_to                 TEXT,
    references_raw              TEXT,                       -- raw References header

    -- Informational headers (parsed)
    subject_raw                 TEXT,
    subject_normalized          TEXT,                       -- prefix-stripped, lower-cased
    date_header_utc             TIMESTAMP,                  -- parsed Date: header

    -- Originator denormalized (fast filter; full list lives in email_addresses)
    from_display                TEXT,
    from_addr                   TEXT,
    from_domain                 TEXT,
    from_registrable_domain     TEXT,
    sender_addr                 TEXT,                       -- RFC 5322 Sender: if present
    reply_to_addr               TEXT,
    return_path                 TEXT,

    -- Size & hashes
    size_bytes                  BIGINT      NOT NULL,
    raw_sha256                  TEXT        NOT NULL,       -- SHA-256 of raw RFC 5322 bytes
    body_sha256                 TEXT,                       -- concat of decoded text parts

    -- Classification flags (cheap booleans)
    is_seen                     BOOLEAN     NOT NULL DEFAULT FALSE,
    is_answered                 BOOLEAN     NOT NULL DEFAULT FALSE,
    is_flagged                  BOOLEAN     NOT NULL DEFAULT FALSE,
    is_draft                    BOOLEAN     NOT NULL DEFAULT FALSE,
    is_deleted_on_server        BOOLEAN     NOT NULL DEFAULT FALSE,  -- \Deleted IMAP flag
    is_automated                BOOLEAN     NOT NULL DEFAULT FALSE,  -- Auto-Submitted / Precedence
    is_bulk                     BOOLEAN     NOT NULL DEFAULT FALSE,  -- List-Id / ESP fingerprint
    has_attachments             BOOLEAN     NOT NULL DEFAULT FALSE,
    has_inline_images           BOOLEAN     NOT NULL DEFAULT FALSE,
    has_calendar_invite         BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Language / content signals
    language                    TEXT,                       -- BCP 47

    -- Provider-native IDs (non-authoritative; useful for cross-reference)
    provider_message_id         TEXT,                       -- e.g. X-GM-MSGID
    provider_thread_id          TEXT,                       -- e.g. X-GM-THRID

    -- Row lifecycle
    created_utc                 TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    updated_utc                 TIMESTAMP,
    deleted_utc                 TIMESTAMP,

    UNIQUE (mailbox_uid, imap_uid, imap_uid_validity)
);

CREATE INDEX emails_message_id_idx        ON emails (message_id);
CREATE INDEX emails_raw_sha256_idx        ON emails (raw_sha256);
CREATE INDEX emails_internal_date_idx     ON emails (internal_date_utc);
CREATE INDEX emails_from_domain_idx       ON emails (from_registrable_domain);
CREATE INDEX emails_thread_idx            ON emails (thread_uid);
```

> **Note on denormalized `from_*`:** duplicated from `email_addresses` for
> fast filtering and list rendering. Kept in sync by the ingest pipeline;
> source of truth is `email_addresses`.

### 4.2 `raw_messages`

Raw RFC 5322 bytes. Kept in a separate table to avoid bloating `emails`
scans; can be moved to external storage without touching the core model.

```sql
CREATE TABLE raw_messages (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    email_uid            UUID        NOT NULL REFERENCES emails(uid),
    size_bytes           BIGINT      NOT NULL,
    sha256               TEXT        NOT NULL,
    bytes_blob           BLOB,                               -- inline; NULL if externalized
    storage_ref          TEXT,                               -- external object-store URI
    created_utc          TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    UNIQUE (email_uid),
    CHECK ((bytes_blob IS NOT NULL) OR (storage_ref IS NOT NULL))
);
```

---

## 5. Headers

### 5.1 `email_headers`

Full header list, order preserved, both raw and decoded. This is the
"keep everything" safety net: anything not promoted to a typed column
can still be queried.

```sql
CREATE TABLE email_headers (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    email_uid            UUID        NOT NULL REFERENCES emails(uid),
    position             INTEGER     NOT NULL,           -- 0-based order in message
    name                 TEXT        NOT NULL,           -- lower-cased for query
    name_raw             TEXT        NOT NULL,           -- original casing
    value_raw            TEXT        NOT NULL,
    value_decoded        TEXT,                           -- RFC 2047 decoded
    UNIQUE (email_uid, position)
);

CREATE INDEX email_headers_name_idx ON email_headers (email_uid, name);
```

---

## 6. Addresses & participation

### 6.1 `addresses` (interned)

One row per unique `addr_spec`. Created on first sight.

```sql
CREATE TABLE addresses (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    addr_spec            TEXT        NOT NULL UNIQUE,    -- 'local@domain' lower-cased
    local_part           TEXT        NOT NULL,
    domain               TEXT        NOT NULL,
    registrable_domain   TEXT        NOT NULL,           -- via Public Suffix List
    first_seen_utc       TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    created_utc          TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    updated_utc          TIMESTAMP,
    deleted_utc          TIMESTAMP
);

CREATE INDEX addresses_domain_idx            ON addresses (domain);
CREATE INDEX addresses_registrable_idx       ON addresses (registrable_domain);
```

### 6.2 `email_addresses` (role-tagged M:N)

One row per address-in-role-in-email. Preserves display name and position
because the same `addr_spec` may appear with different display names across
messages.

```sql
CREATE TABLE email_addresses (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    email_uid            UUID        NOT NULL REFERENCES emails(uid),
    address_uid          UUID        NOT NULL REFERENCES addresses(uid),
    role_kind            TEXT        NOT NULL CHECK (role_kind IN
                                     ('from','sender','reply_to',
                                      'to','cc','bcc',
                                      'resent_from','resent_sender',
                                      'resent_to','resent_cc','resent_bcc',
                                      'return_path','delivered_to')),
    position             INTEGER     NOT NULL,           -- order within the role field
    display_name         TEXT,                           -- as seen in THIS message
    group_name           TEXT,                           -- if inside a 5322 group construct
    created_utc          TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    UNIQUE (email_uid, role_kind, position)
);

CREATE INDEX email_addresses_addr_idx ON email_addresses (address_uid, role_kind);
```

---

## 7. MIME tree & attachments

### 7.1 `mime_parts`

Self-referencing adjacency list. Every leaf AND every `multipart/*` node
gets a row. `part_path` ("1", "1.2", "1.2.3") makes path-based queries
direct without recursion.

```sql
CREATE TABLE mime_parts (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    email_uid            UUID        NOT NULL REFERENCES emails(uid),
    parent_uid           UUID        REFERENCES mime_parts(uid),    -- NULL at root
    position             INTEGER     NOT NULL,                      -- sibling order
    part_path            TEXT        NOT NULL,                      -- '1.2.3'
    content_type         TEXT        NOT NULL,                      -- 'text'
    content_subtype      TEXT        NOT NULL,                      -- 'plain'
    charset              TEXT,
    transfer_encoding    TEXT        CHECK (transfer_encoding IN
                                     ('7bit','8bit','binary',
                                      'quoted-printable','base64')),
    disposition_kind     TEXT        CHECK (disposition_kind IN ('inline','attachment')),
    filename             TEXT,                                       -- RFC 2231 decoded
    content_id           TEXT,
    content_description  TEXT,
    content_language     TEXT,
    size_bytes           BIGINT      NOT NULL,                       -- decoded size
    content_sha256       TEXT,                                       -- over decoded bytes
    body_text            TEXT,                                       -- decoded text (NULL for binary)
    body_blob            BLOB,                                       -- inline bytes (small parts)
    body_blob_ref        TEXT,                                       -- external storage URI
    params_json          JSON,                                       -- remaining Content-Type / Disposition params
    is_leaf              BOOLEAN     NOT NULL,
    is_attachment        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_utc          TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    UNIQUE (email_uid, part_path)
);

CREATE INDEX mime_parts_email_idx        ON mime_parts (email_uid);
CREATE INDEX mime_parts_content_type_idx ON mime_parts (email_uid, content_type, content_subtype);
CREATE INDEX mime_parts_sha256_idx       ON mime_parts (content_sha256);
```

### 7.2 `attachments`

Projected view over `mime_parts` leaves that the user would consider
attachments (either `Content-Disposition: attachment`, or inline non-image,
or any part we surface in the UI as a file). One row per attachment instance;
dedup by `content_sha256` happens at the Document layer
(`docs/DATA-MODEL.md` §3.3).

```sql
CREATE TABLE attachments (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    email_uid            UUID        NOT NULL REFERENCES emails(uid),
    mime_part_uid        UUID        NOT NULL REFERENCES mime_parts(uid),
    filename             TEXT,
    content_type         TEXT        NOT NULL,
    size_bytes           BIGINT      NOT NULL,
    content_sha256       TEXT        NOT NULL,
    is_inline            BOOLEAN     NOT NULL DEFAULT FALSE,
    content_id           TEXT,                                       -- for cid: references
    storage_ref          TEXT,                                       -- external store URI
    created_utc          TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    deleted_utc          TIMESTAMP,
    UNIQUE (mime_part_uid)
);

CREATE INDEX attachments_sha256_idx  ON attachments (content_sha256);
CREATE INDEX attachments_email_idx   ON attachments (email_uid);
```

### 7.3 `calendar_invites`

Parsed iCalendar parts. One row per `VEVENT` component found in a
`text/calendar` or `application/ics` part.

```sql
CREATE TABLE calendar_invites (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    email_uid            UUID        NOT NULL REFERENCES emails(uid),
    mime_part_uid        UUID        NOT NULL REFERENCES mime_parts(uid),
    ical_uid             TEXT        NOT NULL,                       -- iCal UID property
    sequence             INTEGER,
    method_kind          TEXT        CHECK (method_kind IN
                                     ('REQUEST','REPLY','CANCEL',
                                      'PUBLISH','COUNTER',
                                      'DECLINECOUNTER','REFRESH','ADD')),
    summary              TEXT,
    location             TEXT,
    description          TEXT,
    dtstart_utc          TIMESTAMP,
    dtend_utc            TIMESTAMP,
    organizer_addr       TEXT,
    rrule                TEXT,                                       -- raw RRULE
    raw_ics              TEXT,                                       -- full iCal fragment
    created_utc          TIMESTAMP   NOT NULL DEFAULT current_timestamp
);

CREATE INDEX calendar_invites_uid_idx ON calendar_invites (ical_uid);
```

---

## 8. Trace & authentication

### 8.1 `received_hops`

One row per `Received:` header. Order preserved.

```sql
CREATE TABLE received_hops (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    email_uid            UUID        NOT NULL REFERENCES emails(uid),
    position             INTEGER     NOT NULL,               -- 0 = topmost (most recent)
    from_host            TEXT,
    from_ip              TEXT,                               -- v4 or v6 string
    by_host              TEXT,
    with_protocol        TEXT,                               -- ESMTP, ESMTPS, LMTP, …
    tls_cipher           TEXT,
    helo_name            TEXT,
    received_utc         TIMESTAMP,
    raw_value            TEXT        NOT NULL,
    UNIQUE (email_uid, position)
);

CREATE INDEX received_hops_ip_idx ON received_hops (from_ip);
```

### 8.2 `auth_results`

One row per method entry in each `Authentication-Results` header.

```sql
CREATE TABLE auth_results (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    email_uid            UUID        NOT NULL REFERENCES emails(uid),
    position             INTEGER     NOT NULL,
    authserv_id          TEXT,                               -- the MTA id that produced the verdict
    method_kind          TEXT        NOT NULL CHECK (method_kind IN
                                     ('spf','dkim','dmarc','arc',
                                      'bimi','dkim-atps','iprev',
                                      'auth','smime','other')),
    result_kind          TEXT        NOT NULL CHECK (result_kind IN
                                     ('pass','fail','neutral','none',
                                      'temperror','permerror','softfail',
                                      'policy','hardfail')),
    reason               TEXT,
    properties_json      JSON,                               -- d=, s=, header.from, smtp.mailfrom, …
    UNIQUE (email_uid, position)
);

CREATE INDEX auth_results_method_idx ON auth_results (email_uid, method_kind);
```

### 8.3 `dkim_signatures`

Parsed `DKIM-Signature` headers. Multiple per message allowed.

```sql
CREATE TABLE dkim_signatures (
    uid                  UUID        PRIMARY KEY DEFAULT uuidv7(),
    email_uid            UUID        NOT NULL REFERENCES emails(uid),
    position             INTEGER     NOT NULL,
    signing_domain       TEXT        NOT NULL,               -- d=
    selector             TEXT        NOT NULL,               -- s=
    identity             TEXT,                               -- i=
    algorithm            TEXT,                               -- a= (rsa-sha256, ed25519-sha256)
    canonicalization     TEXT,                               -- c= (e.g. relaxed/relaxed)
    signed_headers       TEXT,                               -- h=
    body_hash_b64        TEXT,                               -- bh=
    signature_b64        TEXT,                               -- b=
    timestamp_utc        TIMESTAMP,                          -- t=
    expiration_utc       TIMESTAMP,                          -- x=
    is_verified          BOOLEAN,
    verified_utc         TIMESTAMP,
    UNIQUE (email_uid, position)
);

CREATE INDEX dkim_signatures_domain_idx ON dkim_signatures (signing_domain);
```

---

## 9. Mailing-list metadata

### 9.1 `list_metadata`

Zero or one row per email. Only populated when any `List-*` /
`Auto-Submitted` / `Precedence` header is present.

```sql
CREATE TABLE list_metadata (
    uid                       UUID        PRIMARY KEY DEFAULT uuidv7(),
    email_uid                 UUID        NOT NULL REFERENCES emails(uid),
    list_id                   TEXT,                           -- RFC 2919
    list_post                 TEXT,
    list_help                 TEXT,
    list_archive              TEXT,
    list_subscribe            TEXT,
    list_owner                TEXT,
    unsubscribe_mailto        TEXT,                           -- from List-Unsubscribe
    unsubscribe_http          TEXT,
    one_click_unsubscribe     BOOLEAN     NOT NULL DEFAULT FALSE,   -- RFC 8058
    precedence                TEXT,                           -- 'bulk' | 'list' | 'junk' | …
    auto_submitted            TEXT,                           -- RFC 3834
    feedback_id               TEXT,                           -- Gmail feedback id
    created_utc               TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    UNIQUE (email_uid)
);

CREATE INDEX list_metadata_list_id_idx ON list_metadata (list_id);
```

---

## 10. Threading

### 10.1 `threads`

Our own threading index. Populated by the threading job based on
`References`, `In-Reply-To`, normalized subject, and participant overlap.
Gmail's `X-GM-THRID` is captured too when available.

```sql
CREATE TABLE threads (
    uid                       UUID        PRIMARY KEY DEFAULT uuidv7(),
    account_uid               UUID        NOT NULL REFERENCES accounts(uid),
    subject_normalized        TEXT,
    first_email_uid           UUID        REFERENCES emails(uid),
    last_email_uid            UUID        REFERENCES emails(uid),
    email_count               BIGINT      NOT NULL DEFAULT 0,
    participant_count         BIGINT      NOT NULL DEFAULT 0,
    provider_thread_id        TEXT,                           -- X-GM-THRID or equivalent
    last_activity_utc         TIMESTAMP,
    created_utc               TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    updated_utc               TIMESTAMP,
    deleted_utc               TIMESTAMP
);

CREATE INDEX threads_provider_idx   ON threads (provider_thread_id);
CREATE INDEX threads_last_activity  ON threads (account_uid, last_activity_utc DESC);
```

### 10.2 `thread_references`

The expanded `References:` chain per email, so we can resolve threading
without re-parsing the header.

```sql
CREATE TABLE thread_references (
    uid                       UUID        PRIMARY KEY DEFAULT uuidv7(),
    email_uid                 UUID        NOT NULL REFERENCES emails(uid),
    position                  INTEGER     NOT NULL,           -- 0 = earliest ancestor
    referenced_message_id     TEXT        NOT NULL,
    UNIQUE (email_uid, position)
);

CREATE INDEX thread_refs_msgid_idx ON thread_references (referenced_message_id);
```

---

## 11. Keywords (user flags)

System flags (`\Seen \Answered \Flagged \Draft \Deleted`) live as
booleans on `emails`. User-defined IMAP keywords live here.

### 11.1 `keywords`

```sql
CREATE TABLE keywords (
    uid                       UUID        PRIMARY KEY DEFAULT uuidv7(),
    account_uid               UUID        NOT NULL REFERENCES accounts(uid),
    name                      TEXT        NOT NULL,           -- raw IMAP keyword atom
    display_name              TEXT,                           -- user-friendly
    color                     TEXT,
    created_utc               TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    updated_utc               TIMESTAMP,
    deleted_utc               TIMESTAMP,
    UNIQUE (account_uid, name)
);
```

### 11.2 `email_keywords` (M:N)

Per convention, has its own `uid`.

```sql
CREATE TABLE email_keywords (
    uid                       UUID        PRIMARY KEY DEFAULT uuidv7(),
    email_uid                 UUID        NOT NULL REFERENCES emails(uid),
    keyword_uid               UUID        NOT NULL REFERENCES keywords(uid),
    created_utc               TIMESTAMP   NOT NULL DEFAULT current_timestamp,
    UNIQUE (email_uid, keyword_uid)
);

CREATE INDEX email_keywords_kw_idx ON email_keywords (keyword_uid);
```

---

## 12. Putting it together — sample queries

_(For sanity-checking the shape; do not treat as final.)_

**Unread emails in INBOX, newest first:**
```sql
SELECT e.uid, e.subject_raw, e.from_addr, e.internal_date_utc
FROM emails e
JOIN mailboxes m ON m.uid = e.mailbox_uid
WHERE m.special_use_kind = 'inbox'
  AND e.is_seen = FALSE
  AND e.deleted_utc IS NULL
ORDER BY e.internal_date_utc DESC
LIMIT 50;
```

**All newsletters (list traffic) grouped by List-Id:**
```sql
SELECT lm.list_id, COUNT(*) AS n
FROM list_metadata lm
JOIN emails e ON e.uid = lm.email_uid
WHERE lm.list_id IS NOT NULL
GROUP BY lm.list_id
ORDER BY n DESC;
```

**Find all emails where DKIM passed AND the signing domain aligned with From:**
```sql
SELECT e.uid
FROM emails e
JOIN auth_results a  ON a.email_uid = e.uid AND a.method_kind = 'dkim' AND a.result_kind = 'pass'
JOIN dkim_signatures d ON d.email_uid = e.uid
WHERE d.signing_domain = e.from_registrable_domain;
```

**Deduped attachments across the mailbox (candidate Documents):**
```sql
SELECT content_sha256, MIN(filename) AS sample_filename, COUNT(*) AS copies
FROM attachments
GROUP BY content_sha256
HAVING COUNT(*) > 1;
```

---

## 13. Open questions / TBD

1. **Raw blob retention.** Keep forever vs tiered (DuckDB → object store →
   cold storage)? DKIM re-verification requires raw bytes.
2. **`content_sha256` representation** — lower-case hex `TEXT` (portable,
   easy to log) vs `BLOB` (half the size). Leaning text for now.
3. **Threading scope** — per-account (current) vs global across all of a
   user's accounts? Message-ID is supposed to be global, so global might
   make sense; per-account is simpler and sidesteps cross-account leaks.
4. **Addresses normalization** — preserve canonical `local@domain`
   lower-cased; do Gmail dot-folding / plus-tag stripping only at
   *match time*, not at store time. Confirm.
5. **Keywords scope** — per-account (current) vs per-user? If a user has
   two Gmail accounts with a "Work" label in both, should they merge?
6. **`email_flags` as a table?** Current design keeps IMAP system flags as
   booleans on `emails` (small, closed set). Is there value in a
   normalized `email_flags` table for history (who marked it read, when)?
7. **Soft-delete vs hard-delete** on `emails` re-ingest. Proposal:
   soft-delete old row + insert new; keep `raw_messages` linked to the
   live row only.
8. **Indexing strategy beyond PK/UNIQUE.** DuckDB's zone maps cover a lot;
   benchmark before adding more `CREATE INDEX`es.
9. **Partitioning.** Do we partition `emails` by `account_uid` or by month
   of `internal_date_utc` for scanning perf?
10. **Cross-account dedup.** Same message forwarded to two accounts —
    two `emails` rows, same `raw_sha256`. Acceptable for v0.

---

## 14. Next steps

- [ ] Review this doc (`!!!` annotations).
- [ ] Fold the table list into `docs/DATA-MODEL.md` §2 (replacing the
      placeholder for `Email`, `Thread`, `Attachment`, `Account`).
- [ ] Decide storage backend for raw blobs (`raw_messages.bytes_blob` vs
      external).
- [ ] Implement a migration runner under `server/` and land `001_init.sql`
      with these tables.
- [ ] Define the parser's output shape (TS types) mirroring these tables 1:1
      so ingest is a straight mapping.
