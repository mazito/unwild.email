import { expect, test } from 'bun:test'
import { match } from './match.ts'

type Shape = { tag: 'circle'; r: number } | { tag: 'rect'; w: number; h: number }

test('match dispatches on tag', () => {
  const area = (s: Shape) =>
    match(s, {
      circle: (x) => Math.PI * (x as { r: number }).r ** 2,
      rect: (x) => (x as { w: number; h: number }).w * (x as { w: number; h: number }).h,
    })
  expect(area({ tag: 'rect', w: 2, h: 3 })).toBe(6)
})

test('match throws on unknown tag', () => {
  expect(() => match({ tag: 'x' }, { y: () => 1 })).toThrow(/unhandled variant: x/)
})
