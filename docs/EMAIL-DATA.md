# EMAIL-DATA.md — Exhaustive email data fields

Working catalog of **every piece of information** we can extract from an email,
with IETF/W3C references. Used as input for `docs/DATA-MODEL.md` (what we
actually persist) and later for the parser/ingest layer.

Status: **DRAFT — research notes.** Not a schema. Cross-check against RFCs
before implementation.

Legend:
- 🟢 **Core** — must capture from day one.
- 🟡 **Useful** — capture if cheap, often enables features later.
- 🔵 **Niche** — rare but well-defined; decide per use case.
- ⚫ **Deprecated / ignore** — listed for completeness, don't model.
- 🧮 **Derived** — computed from other fields, not a raw header.

---

## 0. Scope & assumptions

- **Transport:** IMAP4rev1 ([RFC 3501](https://www.rfc-editor.org/rfc/rfc3501))
  and IMAP4rev2 ([RFC 9051](https://www.rfc-editor.org/rfc/rfc9051)).
- **Message format:** Internet Message Format
  ([RFC 5322](https://www.rfc-editor.org/rfc/rfc5322), obsoletes RFC 2822 / 822).
- **MIME:** [RFC 2045](https://www.rfc-editor.org/rfc/rfc2045)–
  [RFC 2049](https://www.rfc-editor.org/rfc/rfc2049),
  plus [RFC 2047](https://www.rfc-editor.org/rfc/rfc2047) (encoded words),
  [RFC 2183](https://www.rfc-editor.org/rfc/rfc2183) (Content-Disposition),
  [RFC 2231](https://www.rfc-editor.org/rfc/rfc2231) (parameter continuations
  and i18n).
- **SMTP envelope:** [RFC 5321](https://www.rfc-editor.org/rfc/rfc5321) —
  *separate* from the message headers; we only see traces of it via
  `Return-Path` and `Received`.
- **POP3** ([RFC 1939](https://www.rfc-editor.org/rfc/rfc1939)): **out of
  scope** — no folder model, no per-message flags beyond
  new/deleted, UIDL is the only stable identifier. Still deployed but not
  suitable as a sync source for an app like Unwild. Revisit only if a user
  explicitly requests it.
- **JMAP** ([RFC 8620](https://www.rfc-editor.org/rfc/rfc8620) /
  [RFC 8621](https://www.rfc-editor.org/rfc/rfc8621)): modern alternative to
  IMAP. Field names differ but semantics map closely; keep the data model
  provider-agnostic so a JMAP backend is possible later.
- **HTTP APIs (Gmail API, Microsoft Graph):** not covered here; treat as
  sources that yield the *same* RFC 5322 blob plus proprietary metadata
  (labels, categories). Capture provider-native IDs alongside Message-ID.

---

## 1. Message anatomy cheat sheet

An email has three separable layers:

1. **SMTP envelope** — `MAIL FROM`, `RCPT TO` (RFC 5321). Ephemeral. We only
   see residue in `Return-Path` and `Received` headers.
2. **Header section** — RFC 5322 headers + MIME headers + extensions.
   Everything before the first empty line.
3. **Body** — one or more MIME parts (RFC 2045+). Can be nested trees
   (`multipart/*`).

Our parser must be able to hand back:
- The **raw bytes** (for hashing, DKIM verification, archival).
- The **parsed header map** (multi-valued, order-preserving, decoded).
- The **MIME tree** with per-part headers + decoded body.

---

## 2. Transport-level metadata (IMAP)

Extracted from the protocol, **not** from the message itself. Per
[RFC 9051](https://www.rfc-editor.org/rfc/rfc9051) unless noted.

| Field | Source | Notes |
|---|---|---|
| 🟢 `UID` | IMAP `FETCH UID` | 32-bit per-mailbox unique id. |
| 🟢 `UIDVALIDITY` | IMAP `SELECT` | Per-mailbox epoch. If it changes, every UID is invalidated — full resync required. Store at mailbox level. |
| 🟢 `INTERNALDATE` | IMAP `FETCH INTERNALDATE` | Server's delivery timestamp. More reliable than the `Date:` header for sort/dedup. |
| 🟢 `RFC822.SIZE` | IMAP | Raw message size in octets. |
| 🟢 Mailbox path | IMAP `LIST` | Hierarchical name + separator. |
| 🟢 SPECIAL-USE | [RFC 6154](https://www.rfc-editor.org/rfc/rfc6154) | `\Inbox \Sent \Drafts \Junk \Trash \Archive \All \Flagged \Important`. Detect user's canonical folders. |
| 🟢 System flags | RFC 9051 §2.3.2 | `\Seen \Answered \Flagged \Deleted \Draft`. |
| ⚫ `\Recent` | RFC 3501 | Removed in IMAP4rev2. Ignore. |
| 🟡 Keywords (user flags) | RFC 9051 | Arbitrary atoms. Well-known: `$Forwarded $Junk $NotJunk $MDNSent $Phishing $Important $Label1…5` ([IANA IMAP Keywords registry](https://www.iana.org/assignments/imap-keywords/imap-keywords.xhtml)). |
| 🟡 `MODSEQ` | CONDSTORE, [RFC 7162](https://www.rfc-editor.org/rfc/rfc7162) | Per-message change counter. Enables cheap incremental sync. |
| 🟡 `HIGHESTMODSEQ` | CONDSTORE | Per-mailbox. Pair with MODSEQ. |
| 🔵 METADATA | [RFC 5464](https://www.rfc-editor.org/rfc/rfc5464) | Per-mailbox / per-server annotations. Rarely supported in the wild. |
| 🔵 ACL | [RFC 4314](https://www.rfc-editor.org/rfc/rfc4314) | Shared-mailbox permissions. |
| 🔵 QUOTA | [RFC 9208](https://www.rfc-editor.org/rfc/rfc9208) | Mailbox quota usage. Show in UI. |
| 🟡 THREAD | [RFC 5256](https://www.rfc-editor.org/rfc/rfc5256) | Server-side threading (`REFERENCES` / `ORDEREDSUBJECT`). We'll likely do our own threading but this is useful as a sanity check. |

### 2.1 Provider-proprietary IMAP extensions

| Field | Source | Notes |
|---|---|---|
| 🟡 `X-GM-MSGID` | Gmail `X-GM-EXT-1` | 64-bit globally-unique message id (survives moves across folders). |
| 🟡 `X-GM-THRID` | Gmail | Gmail's thread id — authoritative for Gmail accounts. |
| 🟡 `X-GM-LABELS` | Gmail | Label list (Gmail's "folders are labels" model). |

---

## 3. SMTP envelope residue

Not part of RFC 5322 but added by the receiving MTA:

| Header | RFC | Notes |
|---|---|---|
| 🟢 `Return-Path` | [RFC 5321 §4.4](https://www.rfc-editor.org/rfc/rfc5321#section-4.4) | Final `MAIL FROM` after any forwarding. Used to route bounces; good signal for SPF alignment. |
| 🟢 `Received` (stack) | RFC 5321 §4.4 | One per MTA hop, prepended. First in file = last hop. Carries timestamp, `from`, `by`, `with` protocol, TLS info (`tls` extension), helo name, sender IP. Invaluable for abuse detection and latency analysis. |
| 🟡 `Delivered-To` | de-facto | Final-hop recipient after alias expansion. Very useful for shared aliases / forwarders. |
| 🔵 `X-Original-To` | Postfix convention | Original RCPT TO before local rewriting. |
| 🔵 `X-Envelope-From`, `X-Envelope-To` | de-facto | Some MTAs copy envelope here. |

---

## 4. RFC 5322 header fields

### 4.1 Originator fields

| Header | Card. | RFC | Notes |
|---|---|---|---|
| 🟢 `From` | 1 | 5322 §3.6.2 | Mailbox-list. Most messages have a single mailbox; lists are legal. |
| 🟡 `Sender` | 0..1 | 5322 §3.6.2 | Mandatory if `From` has >1 mailbox. Signals "submitted on behalf of". Relevant for mailing lists & delegated sending. |
| 🟡 `Reply-To` | 0..1 | 5322 §3.6.2 | Where *replies* should go. Often used by newsletters to route to a helpdesk. |

### 4.2 Destination fields

| Header | Card. | RFC | Notes |
|---|---|---|---|
| 🟢 `To` | 0..1 | 5322 §3.6.3 | Primary recipients. |
| 🟢 `Cc` | 0..1 | 5322 §3.6.3 | Carbon copy. |
| 🟡 `Bcc` | 0..1 | 5322 §3.6.3 | Almost never present in the received copy (MTA should strip). We might see it in `\Sent`. |

All address fields use **mailbox / group** syntax: `"Display Name" <addr@host>`
or `Group: m1@x, m2@y;`. Display names can be [RFC 2047](https://www.rfc-editor.org/rfc/rfc2047) encoded-words.

### 4.3 Identification

| Header | Card. | RFC | Notes |
|---|---|---|---|
| 🟢 `Message-ID` | 0..1 | 5322 §3.6.4 | `<local@domain>`. SHOULD be globally unique; in practice not always. Primary key for dedup/threading. |
| 🟢 `In-Reply-To` | 0..1 | 5322 §3.6.4 | Parent Message-ID(s). |
| 🟢 `References` | 0..1 | 5322 §3.6.4 | Full ancestor chain. Primary input for Jamie Zawinski's threading algorithm (basis of RFC 5256). |

### 4.4 Informational

| Header | Card. | RFC | Notes |
|---|---|---|---|
| 🟢 `Subject` | 0..1 | 5322 §3.6.5 | Free text. May be RFC 2047 encoded. Common prefixes: `Re:`, `Fwd:`, `Fw:`, localized variants (`AW:`, `RV:`). Strip for threading. |
| 🟢 `Date` | 0..1 | 5322 §3.6.1 | `date-time` format. Client-set → unreliable; prefer `INTERNALDATE` for sort. |
| 🔵 `Comments` | n | 5322 §3.6.5 | Free-form. Rare. |
| 🔵 `Keywords` | n | 5322 §3.6.5 | Comma-separated tags. Rarely used in practice (IMAP keywords replaced the concept). |

### 4.5 Resent-* (forwarded without wrapping)

Block of headers prepended when a message is re-injected verbatim:
`Resent-Date`, `Resent-From`, `Resent-Sender`, `Resent-To`, `Resent-Cc`,
`Resent-Bcc`, `Resent-Message-ID` (RFC 5322 §3.6.6). Grouped in order of
forwarding (most recent first). 🔵 Capture if present but low priority.

### 4.6 Trace fields

`Return-Path` + `Received` (see §3). RFC 5322 §3.6.7 defines the syntax;
RFC 5321 specifies content.

---

## 5. MIME headers

Per-part (body) or top-level:

| Header | RFC | Notes |
|---|---|---|
| 🟢 `MIME-Version` | 2045 | Always `1.0`. Presence indicates MIME-aware message. |
| 🟢 `Content-Type` | 2045, 2046 | `type/subtype; params`. Params include `charset`, `boundary`, `name` (deprecated — use `Content-Disposition` `filename`), `protocol` (signed/encrypted), `method` (calendar), `report-type` (DSN/MDN). |
| 🟢 `Content-Transfer-Encoding` | 2045 | `7bit | 8bit | binary | quoted-printable | base64`. Decode on read. |
| 🟡 `Content-Disposition` | [2183](https://www.rfc-editor.org/rfc/rfc2183) | `inline | attachment` + `filename`, `size`, `creation-date`, `modification-date`, `read-date`. Filename may be RFC 2231 encoded. |
| 🟡 `Content-ID` | 2045, [2111](https://www.rfc-editor.org/rfc/rfc2111) | Inline part identifier; referenced by `cid:` URLs in HTML parts. |
| 🔵 `Content-Description` | 2045 | Human-readable description of a part. |
| 🔵 `Content-Language` | [3282](https://www.rfc-editor.org/rfc/rfc3282) | BCP 47 language tag. Useful for localization/search. |
| 🔵 `Content-Location` | [2557](https://www.rfc-editor.org/rfc/rfc2557) | Base URL for part (MHTML). |
| 🔵 `Content-Base` | 2110 (obsoleted by 2557) | ⚫ Deprecated alias. |
| ⚫ `Content-MD5` | [1864](https://www.rfc-editor.org/rfc/rfc1864) | Per-part integrity hash. Rarely populated. |

### 5.1 MIME top-level types

| Type | Subtypes we care about |
|---|---|
| `text` | `plain`, `html` (🟢), `calendar` (RFC 5545), `rfc822-headers` (MDNs), `csv` |
| `multipart` | `mixed`, `alternative`, `related`, `signed` (RFC 1847/3156/8551), `encrypted`, `report` (RFC 6522) |
| `message` | `rfc822` (attached email), `delivery-status`, `disposition-notification`, `external-body` 🔵 |
| `application` | `pdf`, `octet-stream`, `pkcs7-mime`/`pkcs7-signature` (S/MIME), `pgp-encrypted`/`pgp-signature`/`pgp-keys`, `ics`, `json` (rare) |
| `image`, `audio`, `video`, `font`, `model` | binary attachments |

### 5.2 Multipart semantics

- `multipart/mixed` — independent parts (typical root for "text + attachments").
- `multipart/alternative` — same content in multiple formats; **render the
  last/best one the UA supports**. Typical: `text/plain` then `text/html`
  then `text/calendar`.
- `multipart/related` — grouped parts with cross-references (HTML + inline
  images via `cid:`). `start` param picks the root.
- `multipart/signed` / `multipart/encrypted` — cryptographic envelopes
  ([RFC 1847](https://www.rfc-editor.org/rfc/rfc1847)). Keep raw bytes of the
  signed subtree for verification.
- `multipart/report` — machine reports; `report-type` param = `delivery-status`
  (bounce), `disposition-notification` (read receipt), `feedback-report`
  (ARF / [RFC 5965](https://www.rfc-editor.org/rfc/rfc5965)).

### 5.3 Encodings & charsets

- **Body encodings:** `7bit`, `8bit`, `binary`, `quoted-printable`, `base64`.
- **Header encoding:** [RFC 2047](https://www.rfc-editor.org/rfc/rfc2047)
  encoded-words (`=?utf-8?B?…?=`) — must decode before display or search.
- **Parameter encoding:** [RFC 2231](https://www.rfc-editor.org/rfc/rfc2231)
  continuations (`filename*0*=utf-8''…; filename*1=…`).
- **Charset families:** UTF-8 dominant; still see `ISO-8859-1/15`, `Windows-1252`,
  `Shift_JIS`, `GB2312`, `Big5`, `KOI8-R`. Normalize to UTF-8 on ingest.

---

## 6. Body content (practical extraction)

For each leaf part we extract:

- `contentType`, `subtype`, params (normalized).
- `charset` (decoded).
- `transferEncoding`.
- `disposition` (`inline | attachment`), `filename`.
- `size` (decoded bytes).
- `contentId`.
- `hash` (SHA-256 over decoded bytes) — for dedup + Document detection.
- The raw + decoded bytes (raw kept for signature verification).

### 6.1 HTML parts — extra extraction 🧮

- Links (`<a href>`, `<area href>`, `<link>`).
- Images (`<img src>`) — note `cid:` vs `http(s):` vs `data:`.
- Tracking pixels (1x1 images, `?utm_*`, known vendors).
- Unsubscribe links (heuristic; cross-check with `List-Unsubscribe`).
- Inlined CSS, `<style>`, remote fonts.
- Embedded JSON-LD / schema.org blocks (order confirmations, flights).
- Forms (`<form action>`) — suspicious for phishing.

Sanitize before display (strip `<script>`, event handlers, remote resources
by default).

### 6.2 Plain-text parts — extra extraction 🧮

- Quoted reply boundary (`On … wrote:`, `> ` lines, `-- ` signature delimiter
  per [son-of-RFC-1036](https://www.chemie.fu-berlin.de/outerspace/netnews/son-of-1036.html)).
- URLs.
- Forwarded inline message boundaries.

---

## 7. Attachments & documents

Per part with `Content-Disposition: attachment` (or any non-`inline` leaf we
choose to expose):

- 🟢 `filename` (RFC 2231-decoded).
- 🟢 `mimeType` + `subtype`.
- 🟢 `size` (decoded).
- 🟢 `contentHash` (SHA-256).
- 🟡 `contentId` if inline.
- 🟡 `creationDate`, `modificationDate` (from `Content-Disposition` params).
- 🧮 Magic-byte sniff (file(1) / libmagic) — don't trust `Content-Type`.
- 🧮 For images: EXIF metadata (author, GPS, camera). Privacy-sensitive.
- 🧮 For PDFs: title, author, page count, text extraction.
- 🧮 For `message/rfc822`: recursive parse.
- 🔵 Embedded OLE / macros flag for Office docs (security).

---

## 8. Authentication & anti-abuse

| Header | RFC | Notes |
|---|---|---|
| 🟢 `Authentication-Results` | [8601](https://www.rfc-editor.org/rfc/rfc8601) | Consolidated result of SPF/DKIM/DMARC/ARC/BIMI checks as done by the receiving MTA. **Preferred** over raw per-method headers. Must trust only the one added by our known boundary MTA (`authserv-id`). |
| 🟢 `DKIM-Signature` | [6376](https://www.rfc-editor.org/rfc/rfc6376) | Cryptographic signature over selected headers + body hash. Fields of interest: `d=` (signing domain), `s=` (selector), `i=` (identity), `h=` (signed headers), `bh=` (body hash), `t=`/`x=` (timestamps). |
| 🟡 `Received-SPF` | [7208 §9.1](https://www.rfc-editor.org/rfc/rfc7208#section-9.1) | Per-hop SPF record. Largely superseded by `Authentication-Results`. |
| 🟡 `ARC-Seal`, `ARC-Message-Signature`, `ARC-Authentication-Results` | [8617](https://www.rfc-editor.org/rfc/rfc8617) | Chain of auth results across forwarders. Needed to trust forwarded mail. |
| 🟡 `BIMI-Selector`, `BIMI-Indicator` | [draft-brand-indicators-for-message-identification](https://datatracker.ietf.org/doc/draft-ietf-dmarc-bimi/) | Verified brand logo. Use to decorate UI only after `pass`. |
| 🟡 `Feedback-ID` | [google-feedback-id](https://support.google.com/mail/answer/6254652) | Campaign id from senders; useful for bulk/marketing clustering. |
| 🟡 `TLS-Required` | [8689](https://www.rfc-editor.org/rfc/rfc8689) | Sender's TLS requirement. |
| ⚫ `DomainKey-Signature` | [4870](https://www.rfc-editor.org/rfc/rfc4870) (Historic) | Predecessor of DKIM. Ignore. |
| ⚫ `Sender-ID` / PRA | [4406](https://www.rfc-editor.org/rfc/rfc4406) | Never adopted. Ignore. |

SPF itself lives in DNS (`v=spf1 …`), not in a header. DMARC policy too
(`_dmarc.<domain>` TXT). Their *verdicts* appear in `Authentication-Results`.

### 8.1 Derived trust signals 🧮

- DKIM signing domain (`d=`) vs `From` domain → **alignment** (DMARC core check).
- SPF-pass domain (`Return-Path`) vs `From` → alignment.
- Presence of ARC chain + chain validity for forwarded mail.
- TLS usage on last hop (parsed from last `Received`).
- Originating IP reputation (geo, ASN, known-bulk list).

---

## 9. Mailing list & automated mail

| Header | RFC | Notes |
|---|---|---|
| 🟢 `List-Id` | [2919](https://www.rfc-editor.org/rfc/rfc2919) | Stable list identifier. Primary grouping key. |
| 🟢 `List-Unsubscribe` | [2369](https://www.rfc-editor.org/rfc/rfc2369) | One or more URIs (`mailto:` and/or `https:`). |
| 🟢 `List-Unsubscribe-Post` | [8058](https://www.rfc-editor.org/rfc/rfc8058) | `List-Unsubscribe=One-Click`. Enables one-click unsubscribe against the `https:` URL. |
| 🟡 `List-Post`, `List-Help`, `List-Archive`, `List-Subscribe`, `List-Owner` | 2369 | Action URIs. |
| 🟡 `Precedence` | de-facto | `bulk | list | junk`. Non-standard but widely set. |
| 🟡 `Auto-Submitted` | [3834](https://www.rfc-editor.org/rfc/rfc3834) | `no | auto-generated | auto-replied`. Signals "don't auto-reply to this". |
| 🔵 `X-Auto-Response-Suppress` | Microsoft | `All | DR | NDR | RN | NRN | OOF | AutoReply`. |

Presence of any of `List-Id` / `List-Unsubscribe` / `Precedence: bulk` is our
main "this is a newsletter" signal.

---

## 10. Delivery status, receipts, reports

| Concept | RFC | Notes |
|---|---|---|
| 🟢 Bounces / DSN | [3464](https://www.rfc-editor.org/rfc/rfc3464), [6522](https://www.rfc-editor.org/rfc/rfc6522) | `multipart/report; report-type=delivery-status`. Parts: human text + `message/delivery-status` + original message/headers. Extract: `Action`, `Status` (enhanced code, [3463](https://www.rfc-editor.org/rfc/rfc3463)), `Diagnostic-Code`, `Final-Recipient`, `Original-Recipient`. |
| 🟡 Read receipts (MDN) | [8098](https://www.rfc-editor.org/rfc/rfc8098) | Request header: `Disposition-Notification-To`. Response: `multipart/report; report-type=disposition-notification`. |
| 🔵 Feedback / ARF | [5965](https://www.rfc-editor.org/rfc/rfc5965) | Abuse reports from ISPs to senders. |
| ⚫ `Return-Receipt-To` | non-standard | Legacy. Ignore; use MDN. |

---

## 11. Encryption & signing

| Mechanism | RFC | Notes |
|---|---|---|
| 🟡 S/MIME | [8551](https://www.rfc-editor.org/rfc/rfc8551) | `application/pkcs7-*` or `multipart/signed; protocol="application/pkcs7-signature"`. X.509-based. |
| 🟡 PGP/MIME | [3156](https://www.rfc-editor.org/rfc/rfc3156), [4880](https://www.rfc-editor.org/rfc/rfc4880) | `multipart/signed; protocol="application/pgp-signature"`, `multipart/encrypted; protocol="application/pgp-encrypted"`. |
| 🔵 Inline PGP | de-facto | `-----BEGIN PGP MESSAGE-----` inside `text/plain`. Discouraged but still seen. |
| 🔵 Autocrypt | [Autocrypt Level 1](https://autocrypt.org/level1.html) | `Autocrypt:` header for opportunistic key discovery. |

For both we need to keep the raw signed bytes untouched (line-ending
canonicalization matters).

---

## 12. Internationalization

| Area | RFC | Notes |
|---|---|---|
| 🟢 Encoded-words in headers | [2047](https://www.rfc-editor.org/rfc/rfc2047) | Decode on parse. |
| 🟡 EAI (UTF-8 in headers + addresses) | [6530](https://www.rfc-editor.org/rfc/rfc6530)–[6533](https://www.rfc-editor.org/rfc/rfc6533) | Unicode local-parts and display names. |
| 🟡 SMTPUTF8 | [6531](https://www.rfc-editor.org/rfc/rfc6531) | SMTP extension; only affects sending. |
| 🟡 IMAP UTF8 | [6855](https://www.rfc-editor.org/rfc/rfc6855) | Enables UTF-8 in mailbox names / search. |
| 🟡 IDN (domains) | [5890](https://www.rfc-editor.org/rfc/rfc5890)–[5893](https://www.rfc-editor.org/rfc/rfc5893), Punycode [3492](https://www.rfc-editor.org/rfc/rfc3492) | Store both A-label and U-label; display U-label, compare A-label. |

---

## 13. Calendar / meeting invites

- `text/calendar; method=REQUEST|REPLY|CANCEL|PUBLISH|COUNTER` per
  [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) (iCalendar) and
  [RFC 6047](https://www.rfc-editor.org/rfc/rfc6047) (iMIP).
- Often delivered as a sibling in `multipart/alternative` (`text/plain`,
  `text/html`, `text/calendar`) plus sometimes `application/ics` attachment.
- Extract: `UID`, `SEQUENCE`, `DTSTART`, `DTEND`, `SUMMARY`, `LOCATION`,
  `ORGANIZER`, `ATTENDEE`s (+ `PARTSTAT`), `RRULE`, `METHOD`.
- Strong candidate for an `Entity` kind.

---

## 14. Importance / priority

| Header | RFC | Notes |
|---|---|---|
| 🟡 `Importance` | [4021](https://www.rfc-editor.org/rfc/rfc4021) (registry) | `low | normal | high`. |
| 🟡 `Priority` | [4021](https://www.rfc-editor.org/rfc/rfc4021) | `normal | urgent | non-urgent`. |
| ⚫ `X-Priority` | non-standard (Microsoft) | `1`–`5`. Map to `Importance` if present and no standard header. |
| ⚫ `X-MSMail-Priority` | non-standard | Same. |

---

## 15. Common non-standard / vendor headers worth capturing

All prefixed `X-*` or vendor-specific. None standardized but frequent enough
to reason about:

- 🟡 `X-Mailer`, `User-Agent` — sender client; useful for grouping "sent from
  phone" etc.
- 🟡 `X-Originating-IP` — some webmails expose submitter IP.
- 🟡 `X-Spam-Status`, `X-Spam-Score`, `X-Spam-Flag` (SpamAssassin de-facto).
- 🟡 `X-Mailgun-*`, `X-SG-*` (SendGrid), `X-Amzn-*` (SES), `X-Mailchimp-*`,
  `X-SES-Outgoing`, `X-Postmark-*` — ESP fingerprints; useful for bulk
  detection & entity ("sender ESP").
- 🟡 `Feedback-ID` (Gmail postmaster), `X-CSA-Complaints` (CSA).
- 🔵 `X-Entity-Ref-ID`, `X-Google-Smtp-Source`, `X-Received` — trace extensions.
- 🔵 `Thread-Topic`, `Thread-Index` — Microsoft Outlook threading (binary in
  Thread-Index). Use as a *fallback* threading signal.
- ⚫ `Apparently-To` — ancient BCC-leak workaround. Ignore.
- ⚫ `X-UIDL` — POP3 UIDL leak in some clients. Ignore.

Strategy: **store the full header map as-is** (key + raw value list, order
preserved), then project the fields we care about into typed columns. Future
features can mine the blob without schema changes.

---

## 16. Derived / computed fields 🧮

Not headers — produced by our ingest pipeline. These become
`EntityProperty`-like signals.

### 16.1 Identity & routing
- `fromAddressNormalized` (lower-cased, IDN-folded, gmail-dot-stripped? — **no**,
  we keep canonical; dots only matter for Gmail and we handle at match time).
- `fromDomain`, `fromRegistrableDomain` (via [PSL](https://publicsuffix.org/)).
- `envelopeFromDomain` (from `Return-Path`).
- `dkimSigningDomains[]`, `dkimAligned` (bool).
- `spfResult`, `dkimResult`, `dmarcResult`, `arcResult` (from
  `Authentication-Results`).
- `firstReceivedIp`, `firstReceivedAsn`, `firstReceivedCountry`.
- `tlsOnLastHop` (bool).

### 16.2 Threading
- `normalizedSubject` (prefix-stripped, lower-cased).
- `threadId` (our own, from References + subject + participants fallback).
- Linked Gmail `X-GM-THRID` when present.

### 16.3 Classification
- `isAutomated` (`Auto-Submitted` != `no` OR `Precedence: auto*`).
- `isBulk` (`List-Id` present OR `Precedence: bulk|list` OR ESP signature).
- `isNewsletter` (bulk + `List-Unsubscribe`).
- `isTransactional` 🧠 (heuristics + LLM: receipts, invoices, OTPs, shipping).
- `isPersonal` 🧠 (1-to-1, no list headers, trusted contact).
- `hasCalendarInvite`, `hasAttachments`, `hasInlineImages`.
- `language` (body language detection).
- `topic`, `summary` 🧠 (LLM-derived).
- `urgencyScore`, `sentiment` 🧠 (optional).

### 16.4 Content signals
- `linksExternal[]`, `linksTracking[]`, `hasTrackingPixels`.
- `unsubscribeMailto`, `unsubscribeHttp`.
- `quotedReplyOffset`, `signatureOffset` (plain-text split).
- `extractedOtp`, `extractedAmount`, `extractedDates[]`, `extractedAddresses[]`
  — per entity kind.
- `attachmentHashes[]` — dedup across messages, basis for `Document`.

### 16.5 People / orgs
- `participants[]` — union of From, To, Cc, Bcc (if visible), Reply-To.
- `participantRoles[]` — which field each came from.
- `organizationGuess` — from `fromRegistrableDomain` + signature block.

---

## 17. Quick reference: what to persist minimally (v0)

Keyed by UID + UIDVALIDITY + account:

- Raw bytes (compressed blob or external store) + SHA-256.
- Full header map (list of `{name, value, decodedValue}`).
- MIME tree metadata (per part: type, params, disposition, size, hash,
  filename, contentId).
- Typed columns for the 🟢 fields above.
- Typed JSON/STRUCT column for the 🟡 fields (Authentication-Results parsed,
  List-* URIs, DKIM domains, ESP fingerprint, etc.).
- Derived columns materialized by the ingest pipeline (§16).

Everything else stays queryable from the raw blob / header map.

---

## 18. Deprecated / ignore list (consolidated)

| Item | Why |
|---|---|
| `\Recent` IMAP flag | Removed in IMAP4rev2. |
| `Content-MD5` | Rarely populated; we hash ourselves. |
| `Content-Base` | Obsoleted by `Content-Location`. |
| `DomainKey-Signature` | Superseded by DKIM (RFC 6376). |
| `Sender-ID` / PRA | Never adopted outside Microsoft. |
| `Return-Receipt-To` | Non-standard; use MDN. |
| `Apparently-To` | Ancient BCC-leak workaround. |
| `X-Priority`, `X-MSMail-Priority` | Non-standard; use `Importance`/`Priority`. |
| POP3 | No folder/flag model; not suitable as a sync source. |
| `Resent-Bcc` | Rarely used correctly. |
| `X-UIDL` | POP3 leakage. |

---

## 19. Open questions

1. Do we keep the **raw RFC 5322 blob forever** (required for DKIM
   re-verification and forensic features) or purge after N days for size?
2. Storage of the parsed header map — JSON blob vs dedicated `headers` table
   (for header-level search).
3. Attachment storage — in-DB blob vs external object store keyed by
   `contentHash`.
4. How deeply do we normalize addresses? (Gmail dots, plus-addressing —
   preserve canonical, normalize only at match.)
5. Which `Authentication-Results` do we trust? Only the one added by a
   configured boundary MTA per `authserv-id`.
6. Do we expose raw provider-native IDs (`X-GM-MSGID`, Graph id) as
   first-class, or only as extra metadata?

These feed directly into the §7 checklist in `DATA-MODEL.md`.
