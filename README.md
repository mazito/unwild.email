# Project Overview

## Email, finally unwild.

**Unwild** is an `opinionated`, `self-hosted` `email engine` built for those who have outgrown the "inbox" paradigm. 

By moving away from traditional folders and into an Entity-First architecture, Unwild automatically groups your communication by Organization, Person or other user defined relevant entities into high-performance, contextual blocks.

Powered by a blazing-fast Bun runtime and a local DuckDB data layer, it transforms your fragmented email stream into a structured, searchable knowledge base—running entirely on your own hardware. No cloud politics, no manual tagging, just the order you’ve been looking for.

### The "Appliance" Feel

It is basically a Local-First Communication Server. This is a very strong niche. 

In a small office or family environment, the pitch for **Unwild.email** becomes:

> Run this folder on any PC in the office. 
>
> It connects your accounts, tames the mess, and everyone can log in via their browser to see a version of email that actually makes sense.
>
> Imagine typing "Invoice" and  **Unwind** showing you a list of Organizations that sent invoices, order by payment priority, rather than just a list of emails.
>

### The "Portable App" 

Instead of a single file, we distribute a .zip that unzips into:

  - unwild.exe (The Bun entry point)
  - modules/ (The native bindings)
  - public/ (Static assets, if not bundled)
  - data/ (Where DuckDB+LMDB will live)
  - docs/ (Where attachments will live)

Since this is intended to be a persistent server for a family or office:

- Stability over Portability: A folder-based install is often easier to debug and update than a packed binary that has to unpack itself into a temp folder every time it runs.

- DuckDB Persistence: Having a clear data/ directory next to our node_modules makes it obvious to the user what they need to back up to save their "Unwild" history.

- Since we are grouping by Org/Person/Entities, we could use DuckDB's Full Text Search (FTS) extension. Because it's all local, we can provide a search experience that is "out of rails" by being instant and offline. 


## Architecture

Draft:

### Server 

The server is responsible  for:

- **Connect, fetch and post to Email providers**. For standard emails servers using SMTP+IMAP and to Gmail/Hotmail/Outlook or other free email servers using whatever they may take.
- **Store** the emails accounts, orgs, and user defined entities (or gropings), the full email history and emails contents, a catalog of docs/files/attachments. We will use Duckdb and LMDB as data layers for this.
- **Provide** a CBOR based JSON-RPC API to be used by the client App to query the emails db, post emails, etc.

- **Serve** the client web App that will provide the Admin and User UI. 

It is built in Bun, and will use Duckdb, LMDB as data tools.  Language: Typescript.

### Web App

The client web App is responsible for the end user's UI:

- **Connects** to the Server via its CBOR JSON-RPC Api.
- **Admins** the users prefs, accounts, email servers etc.

- **Navigates** the emails by org, person, etc. querying the dbs.
- **Shows** email content.
- **Edits and posts** emails (markdown enabled, html editor enabled).

Its is built in Svelte 5 as a SPA fully served by the Server. It may use localStorage and IndexedDb to store local info in a particular device. Language: Typescript.

## Conventions

### Code Conventions

- We use CamelCase for Svelte components, like `AppHome.svelte`
- We use snake case with hiphens for ALL js and ts files, like `local-storage-driver.ts`
- `lib` holds globally shared code used both by `app`  and `server`.
- `app` holds the Web App UI code. The build result of it. 
- `server` holds the Server code. 
- `dist` holds the final build and distribution.
- `CBOR compresses JSON-RPC` for App <-> API communication.

### UI Conventions

- **Styling:** Tailwind v4 + daisyUI v5 for all components. No per-component CSS unless strictly necessary.
- **Icons:** **always** use [`lucide-svelte`](https://lucide.dev/) icons. No inline `<svg>` paths, no emoji, no icon fonts.
  ```svelte
  <script lang="ts">
    import { Menu, Search, Plus } from 'lucide-svelte'
  </script>
  <Menu class="size-5" />
  ```
  Size/color via Tailwind classes (`size-4`, `text-primary`, …) — not via `size` / `color` props.
- **Components:** Svelte 5 runes mode (`$state`, `$props`, `$derived`). Keep component scripts FP-compliant (see FP conventions).

### FP Conventions (mandatory)

All TypeScript code — server, lib, and app (including Svelte `<script>` blocks) — follows the **Pragmatic FP Conventions** defined in:

- [`docs/FP-CONVENTIONS.md`](docs/FP-CONVENTIONS.md) — human-readable rationale + examples
- [`docs/FP-CONVENTIONS-LLM.md`](docs/FP-CONVENTIONS-LLM.md) — LLM code-generation + review rules
- [`docs/FP-lib-api.md`](docs/FP-lib-api.md) — shared FP lib API (`Result`, `pipe`, `match`, `createStore`, `protect`, `assert`, `getLogger`, `getTracer`)

**Summary of rules** (see docs for full detail):

1. **Pure functions by default** — inputs → output, no hidden state.
2. **Immutable data** — never mutate; spread + `map`/`filter`/`reduce`.
3. **Results, not exceptions** — `Ok` / `Err`; `try/catch` only at external boundaries (or via `protect`).
4. **Pipelines** — `pipe(value, f1, f2, ...)` for multi-step transforms.
5. **Tagged variants + `match`** — no `instanceof`, no `switch` on `type` strings.
6. **Side effects at the edges** — split `feature.ts` (pure), `feature.effects.ts` (IO), `feature.page.ts` / wiring.
7. **ES modules** — explicit `import`/`export`, no globals.
8. **DOM via `el()`** — applies to any non-Svelte DOM; Svelte templates replace this for the web app.
9. **State via named transitions** — `store.transition('name', s => ...)` only.
10. **Traceability** — critical effects wrapped with `protect` / `getTracer` / `getLogger`.
11. **TypeScript: light touch** — types for signatures and shapes; no generic gymnastics; no `any`, no `as`.

**Shared FP lib** lives at `lib/fp/` and is imported by both `server` and `app`.

### Server runs:

- Host: `localhost` 
- Port: `3030`
- Web app: [](http:/localhost:3030) and [](http:/localhost:3030/app)
- Server API: [](http:/localhost:3030/api)
- Server monitor: [](http:/localhost:3030/monitor)