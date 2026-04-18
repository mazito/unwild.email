# DATA-MODEL.md — Unwild.email

Working doc for domain modeling. **This is the source of truth for types and their relationships.** PLAN.md references it.

Status: **DRAFT — open design.** Nothing here is final until marked ✅.

---

## 1. Scope

Define the domain objects used across `lib/`, `server/`, `app/`. Split into:

- **Core (stable):** well-understood email domain.
- **Open-design:** novel Unwild concepts (Entity, EntityProperty, Document, Catalog). Need forward thinking before P3 schema work.

---

## 2. Core types (stable)

> Shape TBD — listing the set only. Full field-level spec to be filled in.

- `Account` — a user's mailbox binding (creds/tokens + provider ref).
- `EmailProvider` — provider config (IMAP/SMTP, Gmail, Outlook…). Server-owned; redacted shape for UI setup.
- `Email` — a single message.
- `Thread` — conversation assembled via Message-ID / References / In-Reply-To.
- `Person` — a real human (resolved across address aliases).
- `Organization` — inferred from domain + signature heuristics.
- `Attachment` — any file arriving with an email.
- `Tag` — lightweight label applied to emails / threads / entities. Likely widely used; keep as first-class.

---

## 3. Open-design types

### 3.1 `Entity`

User-defined semantic object (e.g. "Invoice", "Contract", "Receipt").

**Intent:**
- Semantically defined by the user.
- Detectable via heuristics OR an LLM prompt.
- Generic/extensible — we do **not** know enough yet to lock the shape.

**Tentative fields:**
```
id, kind, name, schema (property defs), detectionHints
detectionHints ∈ { regex | keywords | llmPrompt | composite }
```

**Open questions:**
- Is `kind` a free string or a closed tagged variant?
- Do Entities have versions (user edits the prompt → re-classification)?
- How do we store `detectionHints`? DB row vs config file vs both?
- How is re-classification triggered (on rule change, on new email, batch)?

### 3.2 `EntityProperty`

Typed attribute attached to an Entity instance.

**Example (Invoice):** `due_date`, `amount`, `paid`, `recurrent`, `next_date`, `number`, `provider`.

**Must support:** query + sort — e.g. *"unpaid invoices by provider sorted by due date and amount"*.

**Storage strategy (unresolved):**
- Typed columns per entity kind (fast, rigid).
- Single EAV table (flexible, slower).
- DuckDB `STRUCT` / `MAP` columns (middle ground).
- Hybrid (typed for hot props, struct for the rest).

**Must benchmark** the example query across options before choosing.

**LLM role:** may help build queries from NL + format responses.

### 3.3 `Document`

A **promoted attachment** — persistent, non-discardable, user cares about it.

- Tracks versions of the same logical doc (hash + heuristics).
- **A Document MAY also be an Entity** — relationship stays explicit (not conflated).

**Open questions:**
- Versioning key: content hash? filename+sender? fuzzy?
- Retention policy vs regular attachments.
- Preview generation (PDF/image thumbnails) — see Open Q #5 in PLAN.

### 3.4 `Catalog` (tentative)

Saved search / query result over entities. **May be unnecessary** — revisit after P5. Could be a pure query rather than a stored artifact.

---

## 4. Cross-cutting questions

### 4.1 De-normalization: Person / Org as Entity?

A `Person` is conceptually also an `Entity`. Options:

- **Subtype:** `Person` IS-A `Entity`, shares `EntityProperty` table.
- **Mirror:** `Person` has its own table AND is projected into `entity_properties` for uniform query.
- **Separate:** kept fully distinct; queries branch.

Trade-off: uniform query vs write complexity / storage blow-up.

### 4.2 Tagging vs Entity membership

When does something become a `Tag` vs an `Entity`? Likely:

- `Tag` = flat label, no properties.
- `Entity` = typed object with properties + detection.

Confirm before schema.

### 4.3 LLM detection pipeline

Where do prompts live? How are they versioned? How do we trace a classification back to the prompt that produced it? (Ties into FP traceability — Convention 10.)

---

## 5. Tagged variants to define

- `SyncStatus` — `idle | syncing | success | error`
- `AuthState` — tbd
- `RpcResponse<T>` — tbd
- `EntityKind` — open (free string? curated set?)
- `DetectionHint` — `regex | keywords | llmPrompt | composite`

---

## 6. IDs

- **UUIDv7** everywhere (time-ordered, 128-bit, RFC 9562).
- DuckDB: `UUID` column type; `uuidv7()` generator (native in recent builds, else small helper).
- Bun: small generator util (or `crypto.randomUUID()` for v4 fallback only).

---

## 7. Next steps before P3 schema work

- [ ] Fill field-level specs for core types.
- [ ] Pick `EntityProperty` storage strategy (+ benchmark).
- [ ] Decide Person/Org ↔ Entity relationship.
- [ ] Decide Document ↔ Attachment ↔ Entity relationships + version key.
- [ ] Decide Catalog fate.
- [ ] Decide where LLM prompts live + re-classification trigger model.
- [ ] Produce ERD + sample-query sheet.
