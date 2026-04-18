import { expect, test } from 'bun:test'
import { assert, assertAll, assertAny } from './assert.ts'

test('assert ok / err', () => {
  expect(assert(true, 'x').ok).toBe(true)
  expect(assert(false, 'x').ok).toBe(false)
})

test('assertAll joins messages', () => {
  const r = assertAll([assert(false, 'a'), assert(false, 'b'), assert(true, 'c')])
  expect(r.ok).toBe(false)
  if (!r.ok) expect(r.error.message).toBe('a; b')
})

test('assertAny passes if any ok', () => {
  expect(assertAny([assert(false, 'a'), assert(true, 'b')]).ok).toBe(true)
  const r = assertAny([assert(false, 'a'), assert(false, 'b')])
  expect(r.ok).toBe(false)
  if (!r.ok) expect(r.error.message).toMatch(/All assertions failed/)
})
