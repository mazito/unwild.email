# TODO

_Pending issues and tasks._

- [ ] Create `docs/EMAIL-DATA.md` — exhaustive analysis of all extractable email fields (headers, MIME parts, auth results, etc.) with RFC references (RFC 5322, RFC 2045, RFC 2369, RFC 6376/DMARC, etc.).
- [ ] Work through `docs/DATA-MODEL.md` §7 checklist (EntityProperty storage, Person/Org↔Entity, Document↔Attachment↔Entity, Catalog fate, LLM prompts, ERD + sample queries) to unblock P3.
- [ ] Swap JSON → CBOR in `lib/src/rpc/cbor.ts`.
- [ ] Add `svelte-check` to `bun run check` pipeline.
- [ ] Polish app shell (real logo vector, theme switcher, mobile drawer).