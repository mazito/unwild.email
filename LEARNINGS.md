# LEARNINGS

Critical learnings to avoid repeating mistakes.

---

## 2026-04-17

### L1 — Never overwrite a file the user is actively editing
**Rule:** When the user points at a reference implementation ("look how we
did X in project Y"), summarize the pattern and/or write it to a *new* scratch
file. Ask before rewriting an existing component they've been working on.
**Why:** Lost the user's Header.svelte in this session; recoverable only
because VS Code kept per-file history. In a plain editor it would have been
gone. Also: no git repo existed yet at that moment — no safety net.

### L2 — Biome 1.x cannot safely lint `.svelte` files
**Rule:** Add `**/*.svelte` to `biome.json` `files.ignore`. Lint Svelte with
`svelte-check` instead.
**Why:** `biome check --fix` rewrites reactive `let foo = $state(false)` →
`const foo = ...`, which Svelte rejects with `constant_assignment` /
`constant_binding`. Bit twice this session (App.svelte, Header.svelte).

### L3 — TS 5.9 `Uint8Array<ArrayBufferLike>` ≠ `BodyInit`
**Rule:** When passing a `Uint8Array` returned by our `encode()` to
`fetch`/`new Response`, pass `.buffer as ArrayBuffer`, not the view.
**Why:** TS 5.9 tightened `Uint8Array`'s generic, and the default lib's
`BodyInit` now rejects it. Hit in both client (`rpc-client.effects.ts`) and
server (`dispatcher.effects.ts`).

### L4 — TS composite project refs don't play with `noEmit: true`
**Rule:** For this project we use a single root `tsconfig.json` with
`include` across all workspaces + path aliases. Drop composite/project-refs.
**Why:** `"composite": true` requires emit, conflicts with our
`"noEmit": true` base. Bun/Vite handle transpilation anyway — `tsc` is
type-check-only for us.

### L5 — Vite respects `exports` in `package.json` strictly
**Rule:** If the shared lib is consumed via deep paths like
`@unwild/lib/fp/index.ts`, the `exports` map needs matching wildcards
(`"./fp/*": "./src/fp/*"`, `"./*": "./src/*"`).
**Why:** Vite's resolver threw `Missing "./fp/index.ts" specifier in
"@unwild/lib"`. Node resolution was happy; Vite was not.

### L6 — Svelte 5: `{@const}` must be a direct child of a block tag
**Rule:** Do not put `{@const Icon = item.icon}` inside an `<li>` / `<a>`.
Either declare it directly under `{#each}` or use dynamic component syntax
`<it.icon class="..." />`.
**Why:** Compiler error `const_tag_invalid_placement`. Dynamic-tag form is
cleaner and what Svelte 5 recommends.

### L7 — daisyUI `dropdown` works without JS
**Rule:** For simple menus, prefer daisyUI's `dropdown dropdown-end` +
`menu dropdown-content` over a custom `menuOpen` rune + `<svelte:window
onclick>`. Only go custom when you need submenus, hover-delays, or
identicon avatars inside the trigger.
**Why:** Simpler, themable, accessible out of the box. Custom pattern only
justified by the avatar/identicon use case.

### L8 — Commit early, commit often
**Rule:** On a fresh project, init git and make a first "scaffold" commit
before any editing session where the user may be typing in parallel.
**Why:** The L1 mishap would have been a one-keystroke revert if the repo
had been initialized.
