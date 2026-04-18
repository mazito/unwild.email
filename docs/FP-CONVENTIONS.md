# Pragmatic FP Conventions for Vanilla TypeScript

A set of conventions for writing plain TypeScript (HTML5+TS, no framework, minimal build) that produce code which is consistent, traceable, and verifiable.

These conventions are grounded in real problems found in the Treme v2.5 codebase (see TREME-ARCHITECTURE.md) and informed by FP principles — but they prioritize pragmatism over purity.

---

## Why these conventions exist

The Treme v2.5 review revealed two dominant problems:

1. **No traceability** — global mutable state means any code can change anything with no record of what changed or why. Business logic mixed into DOM manipulation makes data flow impossible to follow.

2. **No modularity** — implicit dependencies, HTML as string concatenation, no module system.

These conventions address both problems directly. They are not academic FP rules — they are practical patterns that make code easier to read, debug, trace, and verify.

---

## Convention 1: Pure functions by default

A pure function takes inputs, returns an output, and does nothing else. No reading globals, no writing to the DOM, no modifying its arguments.

**Why:** This is the foundation of traceability. If a function is pure, you know everything about it by looking at its signature and body. You can test it without setup. You can trace its behavior without context.

**The rule:** Every function that can be pure, must be pure. Side effects are allowed only in designated places (see Convention 6).

```javascript
// GOOD — pure: data in, data out
function totalPrice(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0)
}

// GOOD — pure: transforms data without touching anything external
function formatRecord(record, locale) {
  return {
    title: record.name.toUpperCase(),
    date: formatDate(record.created, locale),
    total: formatCurrency(record.amount, locale),
  }
}

// BAD — reads global state
function totalPrice(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty * taxRate, 0)
  //                                                                ^^^^^^^ where does this come from?
}

// BAD — mutates input
function addDefaults(record) {
  record.status = record.status || 'draft'  // mutates the input!
  return record
}
```

**How to tell if a function is pure:** It uses only its arguments and local variables. It returns a value. It could run on a different machine with the same arguments and produce the same result.

---

## Convention 2: Immutable data — never mutate, always create

Never modify objects or arrays after creation. Always return new copies with changes applied.

**Why:** In the Treme codebase, `Appl.model` and `Appl.profile` are global mutable objects. Any code can modify them at any time, and there's no way to know what changed or when. Immutability eliminates this entire class of bugs.

**The rule:** Use spread operators and array methods that return new arrays. Never use `push`, `pop`, `splice`, `delete`, or direct property assignment on shared data.

```javascript
// GOOD — creates new object
function setStatus(record, status) {
  return { ...record, status }
}

// GOOD — creates new array
function addItem(items, newItem) {
  return [...items, newItem]
}

// GOOD — remove without mutating
function removeItem(items, id) {
  return items.filter(item => item.id !== id)
}

// GOOD — update one item in a list
function updateItem(items, id, changes) {
  return items.map(item =>
    item.id === id ? { ...item, ...changes } : item
  )
}

// BAD — mutates
function setStatus(record, status) {
  record.status = status  // who else holds a reference to this record?
  return record
}
```

**Practical note:** `Object.freeze()` can enforce immutability at runtime during development. In production, the convention is sufficient — the LLM verification skill checks for mutations.

---

## Convention 3: Results instead of exceptions

Functions that can fail return a Result — a plain object that is either `{ ok: true, value }` or `{ ok: false, error }`. No `try/catch`, no thrown exceptions.

**Why:** Exceptions are invisible control flow. A `try/catch` block tells you nothing about which line threw, what it threw, or whether the caught exception is the one you expected. The Treme codebase has two API clients with different error handling (callbacks vs. thrown exceptions) — neither provides traceable error flow. Results make failure explicit and composable.

**The rule:** Functions that can fail return a Result. Callers check `.ok` before using `.value`. The only place `try/catch` is allowed is at the boundary with external APIs that throw (DOM APIs, `fetch`, `JSON.parse`), and it must immediately convert to a Result.

```typescript
// Result type — error has a message, plus optional code and data for context
interface ErrorInfo {
  message: string
  code?: number       // e.g., HTTP status, app error code
  data?: unknown      // any extra context for debugging or display
}

type Result<T, E = ErrorInfo> =
  | { ok: true; value: T }
  | { ok: false; error: E }

function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

function Err(message: string, code?: number, data?: unknown): Result<never> {
  return { ok: false, error: { message, code, data } }
}

// A function that can fail returns a Result
function parseAmount(input: string): Result<number> {
  const n = Number(input)
  if (Number.isNaN(n)) return Err(`invalid number: "${input}"`)
  if (n < 0) return Err(`amount cannot be negative`, 400, { input: n })
  return Ok(n)
}

// Caller handles both cases explicitly
const result = parseAmount(userInput)
if (!result.ok) {
  showError(result.error.message)  // always available
  console.debug(result.error.code, result.error.data)  // optional context
  return
}
const amount = result.value

// Wrapping external APIs that throw
function tryParseJSON(text: string): Result<unknown> {
  try {
    return Ok(JSON.parse(text))
  } catch (e) {
    return Err(`invalid JSON: ${e.message}`)
  }
}

// fetch wrapper — converts network errors to Results
async function fetchJSON(url: string, options?: RequestInit): Promise<Result<unknown>> {
  try {
    const response = await fetch(url, options)
    if (!response.ok) return Err(response.statusText, response.status)
    const data = await response.json()
    return Ok(data)
  } catch (e) {
    return Err(`network error: ${e.message}`)
  }
}
```

**Chaining Results:** Results can flow through pipelines (see Convention 4). A failure at any step short-circuits the rest.

```javascript
function mapResult(result, fn) {
  return result.ok ? Ok(fn(result.value)) : result
}

function flatMapResult(result, fn) {
  return result.ok ? fn(result.value) : result
}

// Chain: parse -> validate -> format
const processed = pipe(
  userInput,
  parseAmount,                                    // Result
  r => flatMapResult(r, validateRange),            // Result
  r => mapResult(r, amount => formatCurrency(amount, 'USD'))  // Result
)
```

---

## Convention 4: Pipelines — compose with pipe()

Build complex operations by chaining small functions. Data flows left-to-right through a series of transformations.

**Why:** Nested function calls read inside-out: `format(validate(parse(input)))`. Pipelines read top-to-bottom in the order things actually happen. This is readable and traceable — you can log any intermediate step.

**The rule:** Use `pipe()` for multi-step transformations. Each step is a small, named function. Avoid deeply nested expressions.

```javascript
// The pipe utility — applies functions left to right
function pipe(value, ...fns) {
  return fns.reduce((v, fn) => fn(v), value)
}

// Example: processing form submission
const result = pipe(
  rawFormData,
  extractFields,
  validateRequired,
  normalizeValues,
  buildRecord,
)

// Each step is a small, testable, named function:
function extractFields(formData) {
  return {
    name: formData.get('name'),
    amount: formData.get('amount'),
    date: formData.get('date'),
  }
}

function validateRequired(fields) {
  const missing = Object.entries(fields)
    .filter(([_, v]) => !v)
    .map(([k]) => k)
  return missing.length > 0
    ? Err(`missing fields: ${missing.join(', ')}`)
    : Ok(fields)
}
```

**Pipelines with arrays:**

```javascript
// Transform a list of records for display
const displayItems = pipe(
  records,
  rs => rs.filter(r => r.status === 'active'),
  rs => rs.map(r => ({ ...r, total: r.price * r.qty })),
  rs => rs.sort((a, b) => b.total - a.total),
  rs => rs.slice(0, 20),
)
```

**Debugging pipelines:** Insert a `log` function to log intermediate values without breaking the chain:

```javascript
function log(label) {
  return (value) => { console.log(label, value); return value }
}

const result = pipe(
  rawData,
  extractFields,
  log('after extract'),  // logs without changing the value
  validateRequired,
  log('after validate'),
)
```

---

## Convention 5: Tagged variants for domain modeling

Represent values that can be "one of several things" using plain objects with a `tag` field. This replaces the pattern of type flags, nullable fields, and `instanceof` checks.

**Why:** The Treme codebase uses class hierarchies and type fields (`kind: i32`) to represent variants. This leads to fields that are only valid for certain types (e.g., `radius` on a rectangle), no exhaustiveness checking, and unsafe casting. Tagged variants with a `match` helper solve all three.

**The rule:** When data can be one of several variants, use `{ tag: 'variant_name', ...data }`. Match against variants with a `match()` function that requires handling every case.

```javascript
// Define variants as factory functions
const SyncStatus = {
  idle:    ()            => ({ tag: 'idle' }),
  syncing: (progress)    => ({ tag: 'syncing', progress }),
  success: (timestamp)   => ({ tag: 'success', timestamp }),
  error:   (message)     => ({ tag: 'error', message }),
}

// Match exhaustively — throws if a case is missing
function match(variant, cases) {
  const handler = cases[variant.tag]
  if (!handler) throw new Error(`unhandled variant: ${variant.tag}`)
  return handler(variant)
}

// Usage — every variant must be handled
function renderSyncStatus(status) {
  return match(status, {
    idle:    ()  => 'Ready to sync',
    syncing: (s) => `Syncing... ${s.progress}%`,
    success: (s) => `Last sync: ${formatDate(s.timestamp)}`,
    error:   (s) => `Sync failed: ${s.message}`,
  })
}

// If you add a new variant and forget to handle it, match() throws at runtime.
// The LLM verification skill can also catch this statically.
```

**When to use:** Any time you have a `type` or `status` field and different behavior per value. Common examples: sync states, form field types, API responses, navigation states.

---

## Convention 6: Side effects at the edges

Separate pure logic from effectful operations. Business logic (validation, transformation, calculation) is pure. Side effects (DOM updates, API calls, storage, logging) happen only at the boundaries.

**Why:** In the Treme codebase, every field type mixes business logic with DOM manipulation — `TextField` does validation AND `$field.find('.value').val()` in the same function. You can't test the logic without a DOM, and you can't trace data flow without reading jQuery chains. Separating these makes both the logic and the effects independently testable and traceable.

**The rule:** Structure code in three layers:

1. **Pure core** — functions that transform data. No DOM, no fetch, no storage.
2. **Effect shell** — functions that perform side effects, calling pure functions for logic.
3. **Wiring** — connects events to the effect shell. This is the "main" of each feature.

```javascript
// === PURE CORE ===
// These functions know nothing about the DOM or the network.

function validateRecord(record, formDef) {
  const errors = formDef.requiredFields
    .filter(field => !record[field])
    .map(field => ({ field, message: `${field} is required` }))
  return errors.length > 0 ? Err(errors) : Ok(record)
}

function buildSubmission(record, profile) {
  return {
    ...record,
    submitted_by: profile.id,
    submitted_at: new Date().toISOString(),
    status: 'submitted',
  }
}

// === EFFECT SHELL ===
// These functions perform side effects but delegate logic to pure functions.

async function submitRecord(record, formDef, profile) {
  const validated = validateRecord(record, formDef)
  if (!validated.ok) return validated

  const submission = buildSubmission(validated.value, profile)
  const saved = await saveToStorage('records', submission)
  if (!saved.ok) return saved

  const synced = await syncToServer('/api/records', submission)
  return synced
}

function renderErrors(errors, container) {
  const html = errors.map(e =>
    el('div', { class: 'error' }, `${e.field}: ${e.message}`)
  )
  replaceChildren(container, html)
}

// === WIRING ===
// Connects DOM events to the effect shell.

function initSubmitPage(container, formDef, profile) {
  const form = container.querySelector('.record-form')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const record = readFormData(form)
    const result = await submitRecord(record, formDef, profile)
    if (!result.ok) {
      renderErrors(result.error, container.querySelector('.errors'))
    } else {
      navigateTo('#home')
    }
  })
}
```

**Test benefit:** The pure core can be tested with plain assertions — no DOM, no mocking, no setup. The effect shell can be tested with minimal stubs. Only the wiring needs an actual DOM.

---

## Convention 7: ES modules — explicit dependencies

Every file is an ES module with explicit `import` and `export`. No globals, no script-tag ordering, no namespace objects.

**Why:** The Treme codebase loads files via `<script>` tags in dependency order. Everything lives on global namespaces (`treme.*`, `Appl.*`, `G.*`). Dependencies are invisible — you discover them when something breaks. ES modules make every dependency explicit and visible.

**The rule:** Every file exports what it provides and imports what it needs. No `window.*` globals for application code.

```javascript
// store.js — exports specific functions
export function saveToStorage(key, data) { ... }
export function loadFromStorage(key) { ... }

// record.js — imports what it needs
import { saveToStorage } from './store.js'
import { Ok, Err } from './result.js'

export function saveRecord(record) {
  return saveToStorage(`record:${record.id}`, record)
}
```

**HTML loading:**

```html
<!-- Single entry point with type="module" -->
<script type="module" src="./app.js"></script>
```

**Module organization:** Group by feature, not by type. A `sync/` folder contains the sync engine's pure logic, effects, and wiring — not a `models/` folder with all models and a `views/` folder with all views.

---

## Convention 8: DOM construction via functions, not strings

Build DOM elements using function calls that create actual DOM nodes. Never build HTML as strings.

**Why:** The Treme codebase generates HTML via string concatenation in `FormBuilder` and `FieldBuilder`. This is error-prone (escaping, nesting mismatches), untestable (you'd have to parse strings), and impossible to compose. Function-based DOM construction is safe, composable, and traceable.

**The rule:** Use a small `el()` helper to create elements. Return DOM nodes from render functions, not HTML strings.

```javascript
// The el() helper — creates a DOM element
function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') element.className = value
    else if (key.startsWith('on')) element.addEventListener(key.slice(2), value)
    else element.setAttribute(key, value)
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue
    element.append(
      typeof child === 'string' ? document.createTextNode(child) : child
    )
  }
  return element
}

// Render functions return DOM nodes
function renderField(field, value) {
  return el('div', { class: 'field' },
    el('label', {}, field.label),
    el('input', {
      type: field.type,
      name: field.name,
      value: value || '',
    }),
  )
}

// Compose render functions
function renderForm(formDef, data) {
  return el('form', { class: 'record-form' },
    ...formDef.fields.map(field => renderField(field, data[field.name])),
    el('button', { type: 'submit' }, 'Save'),
  )
}

// Replace content — don't append incrementally
function replaceChildren(container, children) {
  container.replaceChildren(...[children].flat())
}
```

**Why not template literals?** Template literals with `innerHTML` are slightly better than string concatenation but still have the same problems: XSS risks from unescaped values, no way to attach event handlers, no composability. `el()` solves all three.

---

## Convention 9: State transitions as functions

State changes are explicit functions that take old state and return new state. Every transition is a named function that can be logged, replayed, and tested.

**Why:** In the Treme codebase, any code can modify `Appl.model` at any time. There's no change tracking, no event log, no way to know what changed or when. State-as-transitions makes every change traceable.

**The rule:** State is held in a store. Changes happen only through named transition functions. The store notifies subscribers when state changes.

```javascript
// A simple store — holds state, applies transitions, notifies subscribers
function createStore(initialState) {
  let state = initialState
  const subscribers = new Set()

  return {
    getState: () => state,

    transition(name, fn) {
      const prev = state
      const next = fn(state)
      if (next === prev) return  // no change
      state = next
      // Traceability: every state change is named and diffable
      console.debug('state:', name, { prev, next })
      subscribers.forEach(sub => sub(state, prev))
    },

    subscribe(fn) {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }
}

// Usage
const store = createStore({
  records: [],
  syncStatus: SyncStatus.idle(),
})

// Named transitions — each is traceable
function addRecord(store, record) {
  store.transition('addRecord', state => ({
    ...state,
    records: [...state.records, record],
  }))
}

function setSyncStatus(store, status) {
  store.transition('setSyncStatus', state => ({
    ...state,
    syncStatus: status,
  }))
}
```

**What this gives you:**
- Every state change has a name → you can log it
- Every transition is a pure function on state → you can test it
- Subscribers are notified → you can react to changes declaratively
- Previous and next state are available → you can diff

---

## Convention 10: Traceability as a first-class concern

Every operation that matters should be traceable — you should be able to answer "what happened, in what order, and why" by reading logs or inspecting state.

**Why:** This is the overarching goal. All other conventions serve this. The Treme codebase makes it nearly impossible to trace what happened during a sync failure, a form submission, or a state change. Traceability means you can debug in production, audit in compliance, and understand in maintenance.

**The rule:** Critical operations (state transitions, API calls, sync events) produce trace entries. A trace entry is a plain object with timestamp, operation name, input summary, and result summary.

```javascript
// Trace log — simple array that can be written to storage or console
const trace = []

function traced(name, fn) {
  return (...args) => {
    const entry = { ts: Date.now(), op: name }
    const result = fn(...args)
    entry.ok = result.ok !== undefined ? result.ok : true
    trace.push(entry)
    return result
  }
}

// Wrap important functions
const saveRecord = traced('saveRecord', _saveRecord)
const syncToServer = traced('syncToServer', _syncToServer)

// After a failure, read the trace:
// [
//   { ts: 1711808400000, op: 'saveRecord', ok: true },
//   { ts: 1711808400500, op: 'syncToServer', ok: false },
// ]
```

**Async tracing:** For async operations, the `traced` wrapper handles promises:

```javascript
function tracedAsync(name, fn) {
  return async (...args) => {
    const entry = { ts: Date.now(), op: name }
    try {
      const result = await fn(...args)
      entry.ok = result.ok !== undefined ? result.ok : true
      return result
    } catch (e) {
      entry.ok = false
      entry.error = e.message
      return Err(e.message)
    } finally {
      trace.push(entry)
    }
  }
}
```

---

## How the conventions relate

```
Convention 1 (pure functions)  ─┐
Convention 2 (immutable data)  ─┤
Convention 3 (Results)         ─┼── make code TRACEABLE
Convention 4 (pipelines)       ─┤
Convention 10 (tracing)        ─┘

Convention 6 (effects at edges) ─┐
Convention 7 (ES modules)       ─┼── make code MODULAR
Convention 8 (DOM functions)    ─┘

Convention 5 (tagged variants)  ── makes domain EXPLICIT
Convention 9 (state transitions) ── makes state VISIBLE
```

---

## What these conventions do NOT require

- **No framework** — plain HTML5 + TS + ES modules
- **No FP library** — `Ok`, `Err`, `pipe`, `match`, `el` are tiny utilities (~50 lines total)
- **No class hierarchy** — plain objects, plain functions
- **No academic FP** — no monads, no functors, no category theory. Just practical patterns.

## TypeScript: light touch, not heavy hand

The project uses TypeScript, but only for the value it provides: **self-documenting function signatures and data shapes**. The build tooling is minimal:

- **Dev:** `bun --watch` runs TS directly; `tsc --noEmit --watch` for type checking
- **Prod:** `bun build` for bundling + minification into a single file
- **Tests:** `bun test` — built-in, fast, no extra framework

**Use types for:**
- Function parameters and return types
- Data shapes (`interface`, `type` for records, form definitions, API responses)
- Result types: `Result<Record, ValidationError[]>`
- Tagged variant definitions

**Avoid:**
- Complex generics beyond one level (`Result<T, E>` is fine, `Mapped<Infer<Extract<T, K>>>` is not)
- Utility types as clever tricks (`Omit`, `Pick`, `Partial` are fine when they clarify; not when they obscure)
- Overtyping — if a plain `string` or `number` is clear enough, don't wrap it in a branded type
- Type-driven architecture — types serve the code, not the other way around

```typescript
// GOOD — types clarify intent
interface FormField {
  name: string
  label: string
  required: boolean
}

function validateRequired(fields: FormField[], data: Record<string, string>): Result<typeof data, ValidationError[]> {
  const errors = fields
    .filter(f => f.required && !data[f.name])
    .map(f => ({ field: f.name, message: `${f.label} is required` }))
  return errors.length > 0 ? Err(errors) : Ok(data)
}

// BAD — types obscure more than they clarify
type RequiredFieldValidator<T extends Record<string, unknown>, K extends keyof T> =
  (fields: Array<FormField & { name: K }>) => (data: T) => Result<Pick<T, K>, ValidationError[]>
```

The rule of thumb: if the type definition is harder to read than the function body, simplify it.
