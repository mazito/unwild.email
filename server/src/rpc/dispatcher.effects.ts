// Effect shell: HTTP -> RPC adapter.
//   GET  /api/{method}?id=<id>&params=<uri-encoded-json>   (read-only)
//   POST /api/{method}  body = { jsonrpc: "2.0", id, params? }  (mutations)

import { Err, type Logger, type Tracer, protectAsync } from '@unwild/lib/fp/index.ts'
import {
  CONTENT_TYPE,
  ErrorCode,
  JSONRPC_VERSION,
  type RpcRequest,
  decode,
  encode,
  responseFromResult,
} from '@unwild/lib/rpc/index.ts'
import { type RpcRegistry, methodNotFound, methodWrongVerb } from './registry.ts'

interface Deps {
  registry: RpcRegistry
  logger: Logger
  tracer: Tracer
}

const API_PREFIX = '/api/'
const UNKNOWN_ID = '<unknown>'

function methodFromUrl(pathname: string): string | null {
  if (!pathname.startsWith(API_PREFIX)) return null
  const name = pathname.slice(API_PREFIX.length)
  return name.length === 0 ? null : name
}

interface ParsedEnvelope {
  id: string
  params: unknown
}

function parseGetEnvelope(
  url: URL,
): { ok: true; value: ParsedEnvelope } | { ok: false; message: string } {
  const id = url.searchParams.get('id')
  if (!id) return { ok: false, message: 'missing ?id=' }
  const rawParams = url.searchParams.get('params')
  if (rawParams === null || rawParams === '') return { ok: true, value: { id, params: undefined } }
  try {
    return { ok: true, value: { id, params: JSON.parse(rawParams) } }
  } catch (e) {
    return {
      ok: false,
      message: `invalid ?params= (${e instanceof Error ? e.message : String(e)})`,
    }
  }
}

function parsePostEnvelope(
  raw: Uint8Array,
): { ok: true; value: ParsedEnvelope } | { ok: false; message: string } {
  if (raw.byteLength === 0) return { ok: false, message: 'empty body' }
  const decoded = decode<RpcRequest>(raw)
  if (!decoded.ok) return { ok: false, message: decoded.error.message }
  const env = decoded.value
  if (env.jsonrpc !== JSONRPC_VERSION) {
    return { ok: false, message: `unsupported jsonrpc version: ${String(env.jsonrpc)}` }
  }
  if (!env.id || typeof env.id !== 'string') return { ok: false, message: 'missing envelope id' }
  return { ok: true, value: { id: env.id, params: env.params } }
}

function respondBytes(bytes: Uint8Array, status: number): Response {
  return new Response(bytes.buffer as ArrayBuffer, {
    status,
    headers: { 'content-type': CONTENT_TYPE },
  })
}

function respondError(id: string, message: string, code: number, httpStatus: number): Response {
  const body = encode(responseFromResult(id, Err(message, code)))
  return respondBytes(body.ok ? body.value : new Uint8Array(), httpStatus)
}

export async function handleRpc(req: Request, deps: Deps): Promise<Response> {
  const { registry, logger, tracer } = deps
  const url = new URL(req.url)

  const method = methodFromUrl(url.pathname)
  if (!method) return respondError(UNKNOWN_ID, 'missing method in path', ErrorCode.BadRequest, 400)

  const verb = req.method as 'GET' | 'POST'
  if (verb !== 'GET' && verb !== 'POST') {
    return new Response('method not allowed', { status: 405 })
  }

  // --- Parse envelope --------------------------------------------------------
  const parsed =
    verb === 'GET'
      ? parseGetEnvelope(url)
      : parsePostEnvelope(new Uint8Array(await req.arrayBuffer()))

  if (!parsed.ok) {
    logger.warn('rpc envelope parse failed', { method, verb, message: parsed.message })
    return respondError(UNKNOWN_ID, parsed.message, ErrorCode.DecodeFailed, 400)
  }
  const { id, params } = parsed.value

  // --- Lookup + verb-check ---------------------------------------------------
  const found = registry.get(method)
  if (!found) {
    tracer.write('rpc method not found', { type: 'error', data: { method, id } })
    const body = encode(responseFromResult(id, methodNotFound(method)))
    return respondBytes(body.ok ? body.value : new Uint8Array(), 404)
  }

  const expectedVerb = found.kind === 'read' ? 'GET' : 'POST'
  if (verb !== expectedVerb) {
    const mismatch = methodWrongVerb(method, found.kind, verb)
    tracer.write('rpc wrong verb', { type: 'error', data: { method, verb, kind: found.kind, id } })
    const body = encode(responseFromResult(id, mismatch))
    return respondBytes(body.ok ? body.value : new Uint8Array(), 405)
  }

  // --- Invoke handler --------------------------------------------------------
  tracer.write('rpc request', { type: 'step', data: { method, verb, id } })

  const guarded = protectAsync(() => Promise.resolve(found.handler(params)), {
    label: `rpc:${method}`,
    logger,
    trace: tracer,
  })
  const outer = await guarded()
  const result = outer.ok
    ? outer.value
    : Err(outer.error.message, outer.error.code, outer.error.data)

  const encoded = encode(responseFromResult(id, result))
  if (!encoded.ok) {
    logger.error('rpc encode failed', encoded.error)
    return respondError(id, 'encode failed', ErrorCode.EncodeFailed, 500)
  }
  return respondBytes(encoded.value, result.ok ? 200 : 400)
}
