# PLAN — Bottom Dock: FloatingSearch + Compose

_Previous plan backed up in `plans/PLAN-260420-170455.md`._

## Structure

New wrapper component **`BottomDock.svelte`** mounted in place of today's
`FloatingSearch` on the Mails page. Owns mode state and renders either the
search pill, the compose panel, plus the standalone Compose button.

```
BottomDock
├── mode = 'search' | 'compose'
├── [mode=search]  FloatingSearch (existing, unchanged)  +  ComposeButton (hidden when search focused)
└── [mode=compose] ComposePanel (new)                    +  [no compose button]
```

New components:
- `app/src/components/ComposeButton.svelte` — small reusable, MailPlus icon,
  styled like Header's compose btn (`h-10 w-12 bg-white border border-gray-300
  rounded-md hover:bg-gray-300`).
- `app/src/components/ComposePanel.svelte` — the composer.
- `app/src/components/BottomDock.svelte` — orchestrator.

Existing `FloatingSearch.svelte`:
- Expose prop `onFocusChange?: (focused: boolean) => void` so dock can hide
  the compose btn.
- No other behavior changes.

## Layout — Search mode
Row at bottom-center of `<main>`:
```
[  FloatingSearch (~32rem)  ] [gap] [ Compose btn ]
```
Wrapper: `absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-2`.
Compose btn aligned to collapsed pill row. Hidden (`invisible` or unmounted)
while search focused/expanded.

## Layout — Compose mode
Same anchor, same width as search expanded (~32rem). Single panel:

```
┌─────────────────────────────────────────┐
│  [body textarea, grows]     [Expand][X] │  ← top; buttons overlaid top-right
│  ...                                    │
│  ...                                    │
├─────────────────────────────────────────┤
│ [Attach] [Link]      [To] [Cc] [Send ▾] │  ← bottom button row
└─────────────────────────────────────────┘
```

- Panel: `rounded-sm border border-base-300 bg-base-100 shadow-lg`,
  `max-height: calc(100vh - 7rem)`.
- Body: `<textarea>` with `field-sizing: content`, `min-h` ~6rem,
  `max-h: calc(100vh - 12rem)` (room for button row + padding).
- Top-right overlay: `absolute top-2 right-2 flex gap-1` with `Maximize2`
  (Expand) + `X` (Close). Semi-transparent so text scrolling under is OK.
- Button row: `border-t border-base-300 p-2 flex items-center justify-between`.
  - Left: `[Paperclip Attach]` `[Link Link]` — ghost btns with icon+label.
  - Right: `[To]` `[Cc]` (text-only ghost) + `[Send ▾]` daisyUI
    `dropdown dropdown-top dropdown-end` primary btn; items:
    "Send now", "Save as draft". Use `ChevronDown` caret.

## Behaviors

**Search focus hides Compose btn**
`FloatingSearch` fires `onFocusChange(focused || expanded)`. Dock hides btn
when true.

**Compose open**
Click compose btn → `mode = 'compose'`. Search pill unmounted. Focus first
textarea.

**Compose close**
- Close (X) → `mode = 'search'`, discards body (for now).
- `Esc` inside composer → same as Close.
- Click outside → do not close (avoid losing draft).

**Expand**
Toggles a `maximized` state → panel grows to roughly
`w-[min(64rem,calc(100vw-4rem))]` and `height: calc(100vh - 4rem)`. Icon
swaps to `Minimize2`.

**Send dropdown**
- "Send now" → `alert('Send now (noop)')`.
- "Save as draft" → `alert('Saved as draft (noop)')`.

**Attach / Link / To / Cc**
All noop with `alert('TODO: <action>')` for now.

## Icons (lucide)
`MailPlus` (compose btn), `Maximize2`/`Minimize2` (expand), `X` (close),
`Paperclip` (attach), `Link` (link), `ChevronDown` (send caret), `Send`
(optional, on Send button).

## Files
- **new** `app/src/components/BottomDock.svelte`
- **new** `app/src/components/ComposeButton.svelte`
- **new** `app/src/components/ComposePanel.svelte`
- **edit** `app/src/components/FloatingSearch.svelte` — add `onFocusChange`
  prop; strip its outer `absolute` positioning (dock handles it).
- **edit** `app/src/pages/Mails.svelte` — swap `FloatingSearch` → `BottomDock`.

---

## Questions (answer with `>>>` inline)

1. **Compose btn visibility** — `invisible` (reserves space, no layout shift)
   or fully unmounted (pill can grow wider)? My pick: **invisible**.
   >>> You mean when the Compsoe panel is active ? then it must be invisible

2. **FloatingSearch positioning** — move the outer `absolute bottom-6 ...`
   from `FloatingSearch` into `BottomDock`, making `FloatingSearch` position-
   neutral. OK to refactor?
   >>> Do not quite understand. The BottomDock will be a Floating dock containing
    the Search pill and the Compose btn

3. **Close with unsaved body** — silent discard, `confirm()`, or keep draft
   in memory while dock is back in search mode? v0 suggestion: silent discard.
   >>> discard for now

4. **Outside click in compose** — ignore (safer) or close?
   My pick: ignore.
   >>> ignore

5. **Expand direction** — fill viewport centered, or anchor to bottom and
   grow upward+outward? My pick: bottom-anchored (consistent with dock).
   >>> bottom anchored growing up, with limited width

6. **Subject line?** — DRAFT doesn't mention one. Skip for v0?
   >>> Mmmm. Good question. I think we will skip it for now, and use the first 
   line as the subject line ? I do not want to overcharge the UI here with 
   all traditional email fields, whcih most people never use.

7. **Formatter placement** — "top left of composer panel". Leave an empty
   placeholder slot for now, or skip entirely until we tackle formatting?
   >>> Skip for now, requires carefully thinking 

8. **Send dropdown position** — `dropdown-top dropdown-end` so menu opens
   upward (panel sits at bottom). Confirm.
   >>> Yes 
