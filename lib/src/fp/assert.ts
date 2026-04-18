import { Err, Ok, type Result } from './result.ts'

export function assert(condition: boolean, message: string): Result<true> {
  return condition ? Ok(true as const) : Err(message)
}

export function assertAll(results: Array<Result<unknown>>): Result<true> {
  const errors = results.filter((r): r is Extract<typeof r, { ok: false }> => !r.ok)
  if (errors.length === 0) return Ok(true as const)
  return Err(errors.map((e) => e.error.message).join('; '))
}

export function assertAny(results: Array<Result<unknown>>): Result<true> {
  if (results.some((r) => r.ok)) return Ok(true as const)
  const msgs = results
    .filter((r): r is Extract<typeof r, { ok: false }> => !r.ok)
    .map((e) => e.error.message)
    .join('; ')
  return Err(`All assertions failed: ${msgs}`)
}
