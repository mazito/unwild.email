import { expect, test } from 'bun:test'
import { createStore } from './store.ts'

test('store: transitions notify subscribers with prev/next', () => {
  const s = createStore({ count: 0 })
  const seen: Array<[number, number]> = []
  s.subscribe((next, prev) => seen.push([prev.count, next.count]))

  s.transition('inc', (x) => ({ count: x.count + 1 }))
  s.transition('inc', (x) => ({ count: x.count + 1 }))

  expect(s.getState().count).toBe(2)
  expect(seen).toEqual([
    [0, 1],
    [1, 2],
  ])
})

test('store: identical state skips subscribers', () => {
  const s = createStore({ count: 0 })
  let calls = 0
  s.subscribe(() => {
    calls++
  })
  s.transition('noop', (x) => x)
  expect(calls).toBe(0)
})
