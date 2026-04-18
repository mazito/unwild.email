# FP Conventions — LLM Code Generation Reference

This document defines the patterns and rules an LLM must follow when generating or reviewing vanilla TypeScript code for this project. It is a companion to `FP-CONVENTIONS.md` (the human-readable version).

Use this as a system prompt or skill reference. Every rule includes the pattern to follow, the anti-pattern to reject, and verification checks.

---

## Environment

- **Language:** TypeScript (light touch — types for signatures and data shapes, no complex generics)
- **Module system:** ES modules (`import`/`export`, `<script type="module">`)
- **Build (dev):** `bun --watch src/app.ts` (runs TS directly) + `tsc --noEmit --watch` (type checking)
- **Build (prod):** `bun build src/app.ts --outfile=public/app.js --minify`
- **Tests:** `bun test` (built-in test runner)
- **File extension:** `.ts`
- **Dependencies:** Keep them minimal

---

## Core utilities

The following utilities are assumed to exist in the project. Generate code that uses them. If they don't exist yet, provide them.

### Result type

```typescript
// result.ts
interface ErrorInfo {
  message: string
  code?: number
  data?: unknown
}

type Result<T, E = ErrorInfo> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function Err(message: string, code?: number, data?: unknown): Result<never, ErrorInfo> {
  return { ok: false, error: { message, code, data } }
}

export function mapResult<T, U, E>(result: Result<T, E>, fn: (v: T) => U): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result
}

export function flatMapResult<T, U, E>(result: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> {
  return result.ok ? fn(result.value) : result
}
```

### pipe

```typescript
// pipe.ts
export function pipe<T>(value: T, ...fns: Array<(v: any) => any>): any {
  return fns.reduce((v, fn) => fn(v), value)
}
```

### match (exhaustive variant matching)

```typescript
// match.ts
interface Tagged { tag: string }

export function match<V extends Tagged, R>(
  variant: V,
  cases: Record<string, (v: V) => R>
): R {
  const handler = cases[variant.tag]
  if (!handler) throw new Error(`unhandled variant: ${variant.tag}`)
  return handler(variant)
}
```

### Store

```typescript
// store.ts
type Subscriber<S> = (state: S, prev: S) => void

interface Store<S> {
  getState: () => S
  transition: (name: string, fn: (state: S) => S) => void
  subscribe: (fn: Subscriber<S>) => () => void
}

export function createStore<S>(initialState: S): Store<S> {
  let state = initialState
  const subscribers = new Set<Subscriber<S>>()

  return {
    getState: () => state,
    transition(name, fn) {
      const prev = state
      const next = fn(state)
      if (next === prev) return
      state = next
      console.debug('state:', name, { prev, next })
      subscribers.forEach(sub => sub(state, prev))
    },
    subscribe(fn) {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }
}
```

---

## Rules

### R1: Functions must be pure by default

**Generate:**
- Functions that take all inputs as parameters and return a value
- No access to variables outside function scope (except imports)
- No mutation of parameters

**Reject:**
- Functions that read or write global/module-level mutable variables
- Functions that modify their arguments
- Functions that call DOM APIs, fetch, localStorage, or console in logic code

**Verification:** A function is pure if it:
1. Only references its parameters and local `const`/`let` variables
2. Does not call any function known to have side effects
3. Does not use `this` (except in the el() helper or DOM wiring)
4. Returns a value

**Exception:** Effect shell functions and wiring functions (see R6) are allowed to have side effects.

```javascript
// GENERATE THIS
function calculateTotal(items, taxRate) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0) * (1 + taxRate)
}

// NOT THIS
let taxRate = 0.21
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0) * (1 + taxRate)
}
```

---

### R2: Never mutate — always create new values

**Generate:**
- Spread operators for object updates: `{ ...obj, key: newValue }`
- `Array.map`, `Array.filter`, `Array.concat`, spread for array changes
- `Array.reduce` for building new structures

**Reject:**
- `obj.key = value` on shared/passed-in objects
- `Array.push`, `Array.pop`, `Array.splice`, `Array.shift`, `Array.unshift`
- `delete obj.key`
- `Array.sort()` without copying first (it mutates in-place)

**Verification:** Scan for assignment to properties of parameters or variables received from outside the function. Flag `Array.push/pop/splice/shift/unshift/sort/reverse` on non-local arrays.

```javascript
// GENERATE THIS
function addItem(items, item) {
  return [...items, item]
}

function sortByDate(items) {
  return [...items].sort((a, b) => a.date - b.date)
}

// NOT THIS
function addItem(items, item) {
  items.push(item)
  return items
}
```

---

### R3: Return Results — never throw or use try/catch

**Generate:**
- `Ok(value)` for success
- `Err(message)` for failure
- `mapResult()` and `flatMapResult()` for chaining
- `if (!result.ok)` for checking

**Reject:**
- `throw new Error(...)`
- `try { ... } catch (e) { ... }` in application code
- Functions that return `null` or `undefined` to signal failure
- Bare `if (result) / if (!result)` without checking `.ok`

**Exception:** `try/catch` is allowed ONLY to wrap external APIs that throw. It must immediately convert to a Result:

```javascript
// ALLOWED — boundary wrapping
export function tryParseJSON(text) {
  try {
    return Ok(JSON.parse(text))
  } catch (e) {
    return Err(`invalid JSON: ${e.message}`)
  }
}

// ALLOWED — fetch wrapper
export async function fetchJSON(url, options = {}) {
  try {
    const response = await fetch(url, options)
    if (!response.ok) return Err(`HTTP ${response.status}: ${response.statusText}`)
    const data = await response.json()
    return Ok(data)
  } catch (e) {
    return Err(`network error: ${e.message}`)
  }
}
```

**Verification:** Search for `throw`, `try`, `catch` keywords. Flag any that are not in a boundary-wrapping function (a function whose sole purpose is to convert an external API's exceptions into Results).

---

### R4: Use pipe() for multi-step transformations

**Generate:**
- `pipe(value, fn1, fn2, fn3)` for sequential transformations
- Small, named functions as pipeline steps
- Arrow functions for simple inline steps

**Reject:**
- Deeply nested function calls: `f(g(h(x)))`
- Long imperative sequences of `let x = ...; x = ...; x = ...`
- Unnamed inline functions longer than one expression

**Verification:** If a function applies 3+ transformations to data sequentially, it should use `pipe()`. Flag nested calls more than 2 levels deep.

```javascript
// GENERATE THIS
const result = pipe(
  rawInput,
  parseFields,
  r => flatMapResult(r, validateRequired),
  r => mapResult(r, normalizeValues),
  r => mapResult(r, buildRecord),
)

// NOT THIS
const parsed = parseFields(rawInput)
if (!parsed.ok) return parsed
const validated = validateRequired(parsed.value)
if (!validated.ok) return validated
const normalized = normalizeValues(validated.value)
const record = buildRecord(normalized)
```

---

### R5: Model variants with tagged objects + match()

**Generate:**
- Factory functions that return `{ tag: 'name', ...data }`
- `match(variant, { case1: fn, case2: fn, ... })` for branching
- Variant namespaces: `const Status = { draft: () => ..., submitted: (ts) => ... }`

**Reject:**
- `if (obj.type === 'foo')` chains
- `switch (obj.type)` without exhaustiveness
- `instanceof` checks
- Class hierarchies for data variants

**Verification:** When a function branches on a type/status/kind field, it should use `match()`. When data has a fixed set of shapes, it should use tagged variants.

```javascript
// GENERATE THIS
const FieldType = {
  text:     (config) => ({ tag: 'text', ...config }),
  number:   (config) => ({ tag: 'number', ...config }),
  date:     (config) => ({ tag: 'date', ...config }),
  select:   (config) => ({ tag: 'select', ...config }),
}

function renderField(field, value) {
  return match(field, {
    text:   (f) => el('input', { type: 'text', name: f.name, value }),
    number: (f) => el('input', { type: 'number', name: f.name, value, step: f.step }),
    date:   (f) => el('input', { type: 'date', name: f.name, value }),
    select: (f) => el('select', { name: f.name },
      ...f.options.map(o => el('option', { value: o.value, selected: o.value === value }, o.label))
    ),
  })
}

// NOT THIS
function renderField(field, value) {
  if (field.type === 'text') return `<input type="text" value="${value}">`
  else if (field.type === 'number') return `<input type="number" value="${value}">`
  // ... easy to forget a case, returns strings, no escaping
}
```

---

### R6: Separate pure logic from side effects

**Generate code in three layers:**

1. **Pure core** (most code) — functions that transform data. No DOM, no fetch, no storage, no console.
2. **Effect shell** — async functions that orchestrate side effects, calling pure functions for decisions.
3. **Wiring** — event listeners that connect DOM events to the effect shell.

**File naming convention:**
- `feature.ts` — pure core (validation, transformation, calculation)
- `feature.effects.ts` — effect shell (API calls, storage, DOM updates)
- `feature.page.ts` — wiring (event listeners, page lifecycle)

**Verification:**
- Files without `.effects.ts` or `.page.ts` in the name must not contain: `document.*`, `fetch`, `localStorage`, `addEventListener`, `console.*` (except in a `traced` wrapper)
- Pure core files: only `import` from other pure core files or utility modules
- Effect shell files: may `import` from pure core and utility modules

```typescript
// record.ts — PURE CORE
interface FormDef {
  requiredFields: string[]
}

interface ValidationError {
  field: string
  message: string
}

export function validateRecord(record: Record<string, unknown>, formDef: FormDef): Result<Record<string, unknown>, ValidationError[]> {
  const errors = formDef.requiredFields
    .filter(field => !record[field])
    .map(field => ({ field, message: `${field} is required` }))
  return errors.length > 0 ? Err(errors) : Ok(record)
}

export function buildSubmission(record: Record<string, unknown>, profile: { id: string }): Record<string, unknown> {
  return {
    ...record,
    submitted_by: profile.id,
    submitted_at: new Date().toISOString(),
    status: 'submitted',
  }
}

// record.effects.ts — EFFECT SHELL
import { validateRecord, buildSubmission } from './record.ts'
import { saveToStorage } from './store.ts'
import { fetchJSON } from './api.ts'

export async function submitRecord(record: Record<string, unknown>, formDef: FormDef, profile: { id: string }): Promise<Result<unknown>> {
  const validated = validateRecord(record, formDef)
  if (!validated.ok) return validated

  const submission = buildSubmission(validated.value, profile)
  const saved = await saveToStorage('records', submission)
  if (!saved.ok) return saved

  return fetchJSON('/api/records', {
    method: 'POST',
    body: JSON.stringify(submission),
  })
}

// record.page.ts — WIRING
import { submitRecord } from './record.effects.ts'
import { el, replaceChildren } from './el.ts'

export function initSubmitPage(container: HTMLElement, formDef: FormDef, profile: { id: string }): void {
  const form = container.querySelector('.record-form') as HTMLFormElement
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(form))
    const result = await submitRecord(data, formDef, profile)
    if (!result.ok) renderErrors(result.error, container)
    else navigateTo('#home')
  })
}
```

---

### R7: Use ES modules exclusively

**Generate:**
- `export function ...` / `export const ...` for public API
- `import { name } from './path.ts'` with explicit `.ts` extension
- One concern per file

**Reject:**
- Global namespace objects: `window.App = {}`, `var Appl = {}`
- `<script>` tags without `type="module"`
- Implicit dependencies (code that assumes another script loaded first)
- `module.exports` / `require()` (CommonJS)

**Verification:** Every file must have at least one `export`. No file should assign to `window.*` for application code. The HTML entry point uses `<script type="module">`.

---

### R8: Build DOM with el(), never with strings

**Generate:**
- `el('tag', { attrs }, ...children)` for DOM construction
- `replaceChildren(container, nodes)` for updating content
- Event handlers as `onclick` attributes in `el()` or separate `addEventListener`

**Reject:**
- `innerHTML = ...`
- Template literal HTML: `` `<div>${value}</div>` ``
- `document.write()`
- String concatenation for HTML: `'<div>' + value + '</div>'`

**Exception:** Static HTML in `.html` files is fine. This rule applies to JS-generated DOM only.

**Verification:** Search for `innerHTML`, `outerHTML`, template literals containing `<`, and string concatenation with HTML tags.

---

### R9: State changes via named transitions

**Generate:**
- `store.transition('transitionName', state => newState)`
- Transitions as pure functions on state
- Subscriber-based reactions to state changes

**Reject:**
- Direct mutation of state: `store.state.x = y`
- State stored in module-level `let` variables (except inside `createStore`)
- Unnamed state changes

**Verification:** State modifications must go through `store.transition()`. The transition name must be a descriptive string. The transition function must return a new object (using spread), not mutate.

```javascript
// GENERATE THIS
function addRecord(store, record) {
  store.transition('addRecord', state => ({
    ...state,
    records: [...state.records, record],
  }))
}

// NOT THIS
function addRecord(store, record) {
  store.getState().records.push(record)  // mutation!
}
```

---

### R10: Critical operations must be traceable

**Generate:**
- `traced(name, fn)` or `tracedAsync(name, fn)` wrappers on effect functions
- Trace entries: `{ ts, op, ok }` minimum
- `log(label)` in pipelines for debugging

**Reject:**
- Async operations without any form of logging or tracing
- Silent failure (catching errors without recording them)

**Verification:** Every function in `.effects.ts` files that calls `fetch`, `localStorage`, or other I/O should be wrapped with `traced`/`tracedAsync` or include trace logging.

---

### R11: TypeScript — light touch, signatures and shapes only

**Generate:**
- Type annotations on function parameters and return types
- `interface` or `type` for data shapes (records, form definitions, API responses)
- Generic types only at one level: `Result<Record, Error>`, `Store<AppState>`

**Reject:**
- Complex generic chains: `Mapped<Infer<Extract<T, K>>>`
- Branded/nominal types for simple primitives unless there's a real confusion risk
- Type-only files with no runtime code (except a single shared `types.ts` per feature area)
- `any` as a shortcut — use `unknown` and narrow, or simplify the type
- `as` type assertions — if you need to cast, the data model is probably wrong

**Verification:** If a type definition is longer or harder to read than the function it types, simplify it. Function signatures should read like documentation.

```typescript
// GENERATE THIS
interface FormField {
  name: string
  label: string
  type: string
  required: boolean
}

function validateRequired(fields: FormField[], data: Record<string, string>): Result<Record<string, string>, ValidationError[]> {
  const errors = fields
    .filter(f => f.required && !data[f.name])
    .map(f => ({ field: f.name, message: `${f.label} is required` }))
  return errors.length > 0 ? Err(errors) : Ok(data)
}

// NOT THIS
type Validator<T extends Record<string, unknown>, K extends keyof T, E extends Error> =
  <F extends FormField & { name: Extract<K, string> }>(fields: F[]) =>
    (data: T) => Result<Pick<T, K>, E[]>
```

---

## Code generation checklist

When generating a new feature or function, verify:

- [ ] Functions that compute/transform/validate are pure (R1)
- [ ] No mutation of inputs (R2)
- [ ] Failure returns `Err()`, success returns `Ok()` (R3)
- [ ] Multi-step transforms use `pipe()` (R4)
- [ ] Branching on type/status uses `match()` with tagged variants (R5)
- [ ] Pure logic separated from DOM/IO effects (R6)
- [ ] All dependencies via `import`/`export` (R7)
- [ ] State changes via `store.transition()` (R9)
- [ ] Effect functions are traceable (R10)
- [ ] Type annotations on all function signatures; no complex generics (R11)

## Code review checklist

When reviewing existing code for compliance, check in this order:

1. **R3 (Results)** — search for `throw`, `try`, `catch`. Highest impact on traceability.
2. **R2 (Immutability)** — search for `.push`, `.pop`, `.splice`, `delete`, property assignment on params.
3. **R1 (Purity)** — check logic functions for DOM access, fetch, global reads.
4. **R6 (Separation)** — verify pure files don't import from effect files.
5. **R8 (DOM)** — search for `innerHTML`, template literal HTML.
6. **R7 (Modules)** — search for `window.` assignments, missing exports.
7. **R5 (Variants)** — search for `if.*\.type ===`, `switch.*\.type`, `instanceof`.
8. **R9 (State)** — search for direct state mutation outside transitions.
9. **R4 (Pipelines)** — check for deeply nested calls or long imperative sequences.
10. **R10 (Tracing)** — verify effect functions have trace wrappers.
