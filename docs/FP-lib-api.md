# FP Library API Reference

All exports available from `src/lib/fp/index.ts`.

---

## Result (`result.ts`)

Core error-as-values type. No try/catch — failures are data.

### Types

```ts
interface ErrorInfo { message: string; code?: number; data?: unknown }

type Result<T, E = ErrorInfo> =
  | { ok: true; value: T }
  | { ok: false; error: E }
```

### Ok(value): Result

Creates a success result.

```ts
const r = Ok(42)       // { ok: true, value: 42 }
```

### Err(message, code?, data?): Result

Creates a failure result with structured error info.

```ts
const r = Err('not found', 404, { id: 'abc' })
// { ok: false, error: { message: 'not found', code: 404, data: { id: 'abc' } } }
```

### mapResult(result, fn): Result

Transforms the value inside an Ok. Passes Err through unchanged.

```ts
mapResult(Ok(5), v => v * 2)       // Ok(10)
mapResult(Err('fail'), v => v * 2) // Err('fail')
```

### flatMapResult(result, fn): Result

Chains a function that itself returns a Result. Short-circuits on Err.

```ts
const double = (n: number) => n > 0 ? Ok(n * 2) : Err('must be positive')
flatMapResult(Ok(5), double)   // Ok(10)
flatMapResult(Ok(-1), double)  // Err('must be positive')
```

---

## Protect (`result.ts`)

Decorator-style exception boundary. Wrap once at definition, call site stays clean.

### Options

```ts
interface ProtectedOptions {
  label?: string     // name for logging/tracing (default: 'protect')
  code?: number      // error code attached to Err on failure
  logger?: Logger    // logs errors via logger.error()
  trace?: Tracer     // writes errors via tracer.write()
}
```

### protect(fn, opts?): (...args) => Result

Wraps a sync function. Returns Ok on success, Err on throw.

```ts
const parseJSON = protect(
  (input: string) => JSON.parse(input),
  { label: 'parseJSON', code: 400 }
)

parseJSON('{"a":1}')    // Ok({ a: 1 })
parseJSON('bad')         // Err('...')
```

### protectAsync(fn, opts?): (...args) => Promise\<Result\>

Wraps an async function. Same behavior, returns Promise\<Result\>.

```ts
const fetchUser = protectAsync(
  async (id: string) => fetch(`/api/users/${id}`).then(r => r.json()),
  { label: 'fetchUser', logger, trace: tracer }
)

const result = await fetchUser('123')
```

---

## Pipe (`pipe.ts`)

Left-to-right function composition.

### pipe(value, ...fns): any

Passes a value through a chain of functions.

```ts
pipe(
  '  hello  ',
  s => s.trim(),
  s => s.toUpperCase(),
)
// 'HELLO'
```

---

## Match (`match.ts`)

Exhaustive branching on tagged variants.

### Types

```ts
interface Tagged { tag: string }
```

### match(variant, cases): R

Dispatches on `variant.tag`. Throws if no handler matches.

```ts
type Shape =
  | { tag: 'circle'; radius: number }
  | { tag: 'rect'; w: number; h: number }

const area = match(shape, {
  circle: s => Math.PI * s.radius ** 2,
  rect: s => s.w * s.h,
})
```

---

## Store (`store.ts`)

Immutable state container with named transitions and subscribers.

### Types

```ts
type Subscriber<S> = (state: S, prev: S) => void

interface Store<S> {
  getState: () => S
  transition: (name: string, fn: (state: S) => S) => S
  subscribe: (fn: Subscriber<S>) => () => void
}
```

### createStore(initialState): Store

Creates a store. Transitions are named for traceability. Subscribers are notified only when state changes (referential inequality).

```ts
const store = createStore({ count: 0 })

store.subscribe((state, prev) => console.log(prev, '->', state))

store.transition('increment', s => ({ count: s.count + 1 }))
// logs: { count: 0 } -> { count: 1 }

store.getState()  // { count: 1 }
```

`subscribe` returns an unsubscribe function:

```ts
const unsub = store.subscribe(fn)
unsub()  // removes the subscriber
```

---

## Assert (`assert.ts`)

Validation as values. All functions return Result — no throwing.

### assert(condition, message): Result\<true\>

Returns Ok(true) if condition is true, Err(message) if false.

```ts
assert(name.length > 0, 'name required')   // Ok(true) or Err('name required')
```

### assertAll(results): Result\<true\>

All must pass. Collects all error messages joined with `; `.

```ts
assertAll([
  assert(name.length > 0, 'name required'),
  assert(email.includes('@'), 'email invalid'),
])
// Ok(true) or Err('name required; email invalid')
```

### assertAny(results): Result\<true\>

At least one must pass. Returns Ok if any succeed, Err with all messages if all fail.

```ts
assertAny([
  assert(phone !== '', 'no phone'),
  assert(email !== '', 'no email'),
])
// Ok(true) if either exists, Err('All assertions failed: no phone; no email')
```

---

## Env (`env.ts`)

Immutable environment configuration. Browser-safe — no fs dependency.

### Types

```ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface Env {
  readonly tracerEnabled: boolean     // default: false
  readonly tracerOutput: 'console'    // default: 'console'
  readonly loggerEnabled: boolean     // default: true
  readonly loggerLevel: LogLevel      // default: 'info'
  readonly loggerOutput: 'console'    // default: 'console'
}
```

### getEnv(overrides?): Result\<Env\>

Returns a frozen Env object. Merges overrides with defaults.

```ts
const env = getEnv({ tracerEnabled: true, loggerLevel: 'debug' })
if (!env.ok) throw env.error
// env.value is frozen — immutable after creation
```

---

## Logger (`logger.ts`)

System-wide log with level filtering. Null-object pattern — disabled logger is a no-op, no branching at call sites.

### Types

```ts
interface Logger {
  readonly enabled: boolean
  log(level: LogLevel, message: string, data?: unknown): void
  debug(message: string, data?: unknown): void
  info(message: string, data?: unknown): void
  warn(message: string, data?: unknown): void
  error(message: string, data?: unknown): void
  fatal(message: string, data?: unknown): void
  close(): void
}
```

### Options

```ts
interface LoggerOptions {
  enabled?: boolean    // overrides env.loggerEnabled
  level?: LogLevel     // overrides env.loggerLevel
}
```

### await getLogger(env, opts?): Promise\<Logger\>

Returns a Logger based on env config. `opts` overrides env settings for this instance. If disabled, returns a null logger (all methods are no-ops).

```ts
const logger = await getLogger(env.value)
const debugLogger = await getLogger(env.value, { level: 'debug' })

logger.info('server started', { port: 3000 })
logger.error('connection failed')
logger.debug('skipped if level > debug')

logger.close()  // flush and release resources
```

Output format: `[2026-03-31T12:00:00.000Z] INFO server started { port: 3000 }`

---

## Tracer (`tracer.ts`)

Scoped, detailed tracing for a unit of work. One tracer per transaction/request/action. Null-object pattern — disabled tracer is a no-op.

### Types

```ts
interface TraceEntry {
  type?: string       // category: 'step', 'error', 'db', etc.
  data?: unknown      // associated data
}

interface TracerOptions {
  name?: string       // identifier (default: 'trace-{timestamp}')
  enabled?: boolean   // overrides env.tracerEnabled
}

interface Tracer {
  readonly enabled: boolean
  readonly name: string
  write(message: string, entry?: TraceEntry): void
  close(): void
}
```

### await getTracer(env, opts?): Promise\<Tracer\>

Creates a scoped tracer. Multiple tracers can coexist. `opts.enabled` overrides env setting.

```ts
const tracer = await getTracer(env.value, { name: 'txn-123', enabled: true })

tracer.write('validate input', { type: 'step', data: { fields: 5 } })
tracer.write('save failed', { type: 'error', data: err })

tracer.close()  // flushes and ends trace
```

Output format: `[TRACE:txn-123 +12ms] (step) validate input { fields: 5 }`

### Wiring with protect

```ts
const env = getEnv({ tracerEnabled: true, loggerLevel: 'debug' })
if (!env.ok) throw env.error

const logger = await getLogger(env.value)
const tracer = await getTracer(env.value, { name: 'txn-456' })

const saveTxn = protect(
  (data: any) => processAndSave(data),
  { label: 'saveTxn', logger, trace: tracer }
)

const result = saveTxn(payload)  // errors auto-logged and traced
tracer.close()
```
