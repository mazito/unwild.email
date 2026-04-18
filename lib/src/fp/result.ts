// Result — error-as-values. No try/catch in app code.

export interface ErrorInfo {
  message: string
  code?: number
  data?: unknown
}

export type Result<T, E = ErrorInfo> = { ok: true; value: T } | { ok: false; error: E }

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function Err(message: string, code?: number, data?: unknown): Result<never, ErrorInfo> {
  return { ok: false, error: { message, code, data } }
}

export function mapResult<T, U, E>(result: Result<T, E>, fn: (v: T) => U): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result
}

export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (v: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result
}

// --- protect / protectAsync ---------------------------------------------------

export interface ProtectedOptions {
  label?: string
  code?: number
  logger?: { error: (msg: string, data?: unknown) => void }
  trace?: { write: (msg: string, entry?: { type?: string; data?: unknown }) => void }
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export function protect<A extends unknown[], T>(
  fn: (...args: A) => T,
  opts: ProtectedOptions = {},
): (...args: A) => Result<T, ErrorInfo> {
  const label = opts.label ?? 'protect'
  return (...args: A) => {
    try {
      return Ok(fn(...args))
    } catch (e) {
      const msg = errMessage(e)
      opts.logger?.error(`${label}: ${msg}`, e)
      opts.trace?.write(`${label} threw`, { type: 'error', data: e })
      return Err(msg, opts.code, e)
    }
  }
}

export function protectAsync<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  opts: ProtectedOptions = {},
): (...args: A) => Promise<Result<T, ErrorInfo>> {
  const label = opts.label ?? 'protect'
  return async (...args: A) => {
    try {
      return Ok(await fn(...args))
    } catch (e) {
      const msg = errMessage(e)
      opts.logger?.error(`${label}: ${msg}`, e)
      opts.trace?.write(`${label} threw`, { type: 'error', data: e })
      return Err(msg, opts.code, e)
    }
  }
}
