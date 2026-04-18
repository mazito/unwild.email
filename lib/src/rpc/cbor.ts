// CBOR encode/decode placeholder. We'll wire `cbor-x` (or similar) later.
// For P0-P2 we use JSON + UTF-8 so the stack boots without adding a dep.
// The functions return Results so swapping in CBOR later is a single-file change.

import { Err, Ok, type Result } from '../fp/result.ts'

export const CONTENT_TYPE = 'application/json' // swap to 'application/cbor' when wired

export function encode(value: unknown): Result<Uint8Array> {
  try {
    const json = JSON.stringify(value)
    return Ok(new TextEncoder().encode(json))
  } catch (e) {
    return Err(`encode failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}

export function decode<T = unknown>(bytes: Uint8Array | ArrayBuffer): Result<T> {
  try {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
    const text = new TextDecoder().decode(u8)
    return Ok(JSON.parse(text) as T)
  } catch (e) {
    return Err(`decode failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}
