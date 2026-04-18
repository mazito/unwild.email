import { expect, test } from 'bun:test'
import { pipe } from './pipe.ts'

test('pipe applies left-to-right', () => {
  const out = pipe(
    '  hi  ',
    (s: string) => s.trim(),
    (s: string) => s.toUpperCase(),
  )
  expect(out).toBe('HI')
})
