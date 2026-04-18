// Effect shell: HTTP JSON-RPC client returning Result.
//   rpcGet  — GET  /api/{method}?id=<id>&params=<uri-encoded-json>   (read-only)
//   rpcPost — POST /api/{method}  body = { jsonrpc:"2.0", id, params? }  (mutations)

import { Err, Ok, type Result } from '@unwild/lib/fp/index.ts'
import {
  CONTENT_TYPE,
  JSONRPC_VERSION,
  type RpcRequest,
  type RpcResponse,
  decode,
  encode,
} from '@unwild/lib/rpc/index.ts'

const API_PREFIX = '/api/'

let seq = 0
function nextId(): string {
  return `c${Date.now().toString(36)}-${(++seq).toString(36)}`
}

function urlFor(method: string): string {
  return API_PREFIX + encodeURIComponent(method)
}

function unwrap<T>(bytes: Uint8Array): Result<T> {
  const decoded = decode<RpcResponse<T>>(bytes)
  if (!decoded.ok) return decoded
  const r = decoded.value
  if ('error' in r) return Err(r.error.message, r.error.code, r.error.data)
  return Ok(r.result)
}

export async function rpcGet<T = unknown>(method: string, params?: unknown): Promise<Result<T>> {
  const id = nextId()
  const qs = new URLSearchParams({ id })
  if (params !== undefined) qs.set('params', JSON.stringify(params))
  const url = `${urlFor(method)}?${qs.toString()}`

  let res: Response
  try {
    res = await fetch(url, { method: 'GET' })
  } catch (e) {
    return Err(`network error: ${e instanceof Error ? e.message : String(e)}`)
  }
  const bytes = new Uint8Array(await res.arrayBuffer())
  if (bytes.byteLength === 0) return Err(`http ${res.status}`, res.status)
  return unwrap<T>(bytes)
}

export async function rpcPost<T = unknown>(method: string, params?: unknown): Promise<Result<T>> {
  const envelope: RpcRequest = { jsonrpc: JSONRPC_VERSION, id: nextId() }
  if (params !== undefined) envelope.params = params
  const body = encode(envelope)
  if (!body.ok) return body

  let res: Response
  try {
    res = await fetch(urlFor(method), {
      method: 'POST',
      headers: { 'content-type': CONTENT_TYPE },
      body: body.value.buffer as ArrayBuffer,
    })
  } catch (e) {
    return Err(`network error: ${e instanceof Error ? e.message : String(e)}`)
  }
  const bytes = new Uint8Array(await res.arrayBuffer())
  if (bytes.byteLength === 0) return Err(`http ${res.status}`, res.status)
  return unwrap<T>(bytes)
}
