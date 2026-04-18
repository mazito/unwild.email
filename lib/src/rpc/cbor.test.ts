import { expect, test } from 'bun:test'
import { decode, encode } from './cbor.ts'

test('encode/decode round-trip', () => {
  const value = { id: 'x', method: 'ping', params: { n: 1 } }
  const enc = encode(value)
  expect(enc.ok).toBe(true)
  if (!enc.ok) return
  const dec = decode(enc.value)
  expect(dec.ok).toBe(true)
  if (!dec.ok) return
  expect(dec.value).toEqual(value)
})
