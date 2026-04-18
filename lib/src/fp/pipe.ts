// Left-to-right function composition.
// Intentionally typed loosely; use small named steps.

export function pipe<T>(value: T, ...fns: Array<(v: never) => unknown>): unknown {
  return (fns as Array<(v: unknown) => unknown>).reduce((v, fn) => fn(v), value as unknown)
}

// Debug helper — returns value unchanged after logging.
export function log<T>(label: string): (v: T) => T {
  return (v) => {
    console.debug(label, v)
    return v
  }
}
