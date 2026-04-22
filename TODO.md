# TODO

_Pending issues and tasks._

## Docs (previous sessions)
- [x] Create `docs/EMAIL-DATA.md` — exhaustive analysis of all extractable email fields (headers, MIME parts, auth results, etc.) with RFC references. _(2026-04-18)_
- [ ] Review `docs/EMAIL-DATA.md` with the user — validate priority buckets (🟢🟡🔵), answer §19 open questions, decide which derived fields (§16) are v0.
- [ ] Fold EMAIL-DATA findings back into `docs/DATA-MODEL.md` §2 (Email core fields) and §7 checklist.
- [ ] **Continue reviewing `docs/EMAILS-BASE-MODEL.md`** — latest review notes were folded in; keep iterating if the user adds more comments, then fold approved tables into `docs/DATA-MODEL.md`.
- [ ] Work through `docs/DATA-MODEL.md` §7 checklist (EntityProperty storage, Person/Org↔Entity, Document↔Attachment↔Entity, Catalog fate, LLM prompts, ERD + sample queries) to unblock P3.
- [ ] Swap JSON → CBOR in `lib/src/rpc/cbor.ts`.
- [ ] Add `svelte-check` to `bun run check` pipeline.

## App — Variant UI (current, 2026-04-22)
- [ ] Wire `SenderBlock` and `SectionHeader` to real API data.
- [ ] Implement Waiting page content.
- [ ] Implement Protected page content.
- [ ] Implement Account page content (profile, settings, logout).
- [ ] Add search/filter to Todo page.
- [ ] Add compose / reply flows (inline or modal).
- [ ] Add keyboard shortcuts (j/k navigation, Enter open, Escape close).
- [ ] Mobile responsive: collapsible header, touch targets, section scrolling.
- [ ] Real avatar fallback (gradients from hash or identicon) vs hardcoded colors.
- [ ] Empty-state illustrations when New/Done sections are empty.
- [ ] Add `svelte-check` to the new `app/` workspace and root `check` script.

## Polish (deferred from classic app)
- [ ] Real logo vector replacing `Sprout` placeholder.
- [ ] Theme switcher (light / dark / system).
- [ ] Mobile drawer for nav on narrow viewports.
