import { describe, expect, test } from 'bun:test'
import { Err, Ok, flatMapResult, mapResult, protect, protectAsync } from './result.ts'

describe('Result', () => {
  test('Ok / Err basics', () => {
    expect(Ok(1)).toEqual({ ok: true, value: 1 })
    const e = Err('boom', 500, { k: 1 })
    expect(e).toEqual({ ok: false, error: { message: 'boom', code: 500, data: { k: 1 } } })
  })

  test('mapResult transforms Ok, passes Err', () => {
    expect(mapResult(Ok(2), (v) => v * 3)).toEqual(Ok(6))
    const e = Err('x')
    expect(mapResult(e, (v) => v)).toBe(e)
  })

  test('flatMapResult chains, short-circuits on Err', () => {
    const double = (n: number) => (n > 0 ? Ok(n * 2) : Err('neg'))
    expect(flatMapResult(Ok(5), double)).toEqual(Ok(10))
    expect(flatMapResult(Ok(-1), double).ok).toBe(false)
  })

  test('protect catches throws → Err', () => {
    const bad = protect(() => {
      throw new Error('nope')
    })
    const r = bad()
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.message).toBe('nope')
  })

  test('protectAsync catches rejections → Err', async () => {
    const bad = protectAsync(async () => {
      throw new Error('async nope')
    })
    const r = await bad()
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.message).toBe('async nope')
  })
})
