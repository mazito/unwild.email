# PLAN — Floating Search/Compose Box

_Previous plan backed up in `plans/PLAN-260420-151125.md`._

## Goal
Floating input at bottom-center of content area. Collapses to a search pill;
expands into a two-area panel when focused.

## Component
`app/src/components/FloatingSearch.svelte` (new), mounted once inside `<main>`
in `App.svelte` (all pages for now — revisit later).

> !!! for now just add it to Mails page

## Layout

**Container** — absolute, bottom-center of `<main>`:
- `absolute bottom-6 left-1/2 -translate-x-1/2`
- width ~`30rem` (`w-[30rem] max-w-[calc(100vw-2rem)]`)
- `rounded-sm border border-base-300 bg-base-100 shadow-lg`
- max height: `calc(100vh - 4rem)`

**Collapsed state** (not focused, empty):
- Single row: `<input>` (borderless) + search `<button>` (borderless, lucide `Search`).
- Height ~2.5rem.

**Expanded state** (focused or has content):
- Flex column, two regions:
  1. **Results area (top)** — `flex-1 min-h-0 overflow-y-auto p-3`
     - Grows as content grows, up to container max.
     - Simulation: each keystroke/submit appends a 2-line paragraph.
  2. **Input area (bottom)** — `border-t border-base-300 p-2 relative`
     - `<textarea>` auto-grow 1→5 lines (`field-sizing: content` + `max-h`), borderless, no resize handle.
     - Search button pinned top-right of this area (`absolute top-2 right-2`).

## State (Svelte 5 runes)
```ts
let focused = $state(false)
let value   = $state('')
let results = $state<string[]>([])
const expanded = $derived(focused || value.length > 0 || results.length > 0)
```

## Behaviors
- `onfocus` → `focused = true`.
- `onblur` → collapse only if `value === '' && results.length === 0`.
- Simulation on input: append `"lorem ipsum dolor sit amet,\nconsectetur adipiscing elit."` to `results`.
- Textarea auto-grow: CSS `field-sizing: content` + `rows="1"` + `max-h-[7.5rem]`.
- `Esc` → blur + clear.
- Click-outside → blur.

## Icons
`lucide-svelte` → `Search`. Size via `size-4`.

## Files
- **new** `app/src/components/FloatingSearch.svelte`
- **edit** `app/src/App.svelte` — ensure `<main>` is `relative`, mount component inside.

## Open questions (deferred)
1. Global vs per-page mount.
> !!! Mail page only for now

2. Submit behavior (route vs RPC vs noop).
> !!! Noop , but show a simple Alert for debug 

3. Persist results across collapse cycles.
> !!! No, just want test how it may behave form a user's perspective. Not final design yet.

