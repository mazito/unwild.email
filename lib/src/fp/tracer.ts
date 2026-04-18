import type { Env } from './env.ts'

export interface TraceEntry {
  type?: string
  data?: unknown
}

export interface TracerOptions {
  name?: string
  enabled?: boolean
}

export interface Tracer {
  readonly enabled: boolean
  readonly name: string
  write(message: string, entry?: TraceEntry): void
  close(): void
}

function makeNullTracer(name: string): Tracer {
  return {
    enabled: false,
    name,
    write: () => {},
    close: () => {},
  }
}

export async function getTracer(env: Env, opts: TracerOptions = {}): Promise<Tracer> {
  const name = opts.name ?? `trace-${Date.now()}`
  const enabled = opts.enabled ?? env.tracerEnabled
  if (!enabled) return makeNullTracer(name)

  const started = Date.now()

  function write(message: string, entry: TraceEntry = {}): void {
    const delta = Date.now() - started
    const head = `[TRACE:${name} +${delta}ms]`
    const type = entry.type ? `(${entry.type}) ` : ''
    if (entry.data === undefined) console.log(`${head} ${type}${message}`)
    else console.log(`${head} ${type}${message}`, entry.data)
  }

  return {
    enabled: true,
    name,
    write,
    close: () => write('trace closed', { type: 'meta' }),
  }
}
