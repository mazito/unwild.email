# TODO

_Pending issues and tasks._

- [x] Create `docs/EMAIL-DATA.md` — exhaustive analysis of all extractable email fields (headers, MIME parts, auth results, etc.) with RFC references. _(2026-04-18)_
- [ ] Review `docs/EMAIL-DATA.md` with the user — validate priority buckets (🟢🟡🔵), answer §19 open questions, decide which derived fields (§16) are v0.
- [ ] Fold EMAIL-DATA findings back into `docs/DATA-MODEL.md` §2 (Email core fields) and §7 checklist.
- [ ] Work through `docs/DATA-MODEL.md` §7 checklist (EntityProperty storage, Person/Org↔Entity, Document↔Attachment↔Entity, Catalog fate, LLM prompts, ERD + sample queries) to unblock P3.
- [ ] Swap JSON → CBOR in `lib/src/rpc/cbor.ts`.
- [ ] Add `svelte-check` to `bun run check` pipeline.
- [ ] Polish app shell (real logo vector, theme switcher, mobile drawer).