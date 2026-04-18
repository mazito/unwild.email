// RPC wire shapes. Envelope keeps `jsonrpc` + `id` for correlation/logging;
// `method` is carried in the URL path (`/api/{method}`), not repeated here.

import type { ErrorInfo, Result } from '../fp/result.ts'

export type MethodKind = 'read' | 'write'

export const JSONRPC_VERSION = '2.0' as const
export type JsonRpcVersion = typeof JSONRPC_VERSION

export interface RpcRequest<P = unknown> {
  jsonrpc: JsonRpcVersion
  id: string
  params?: P
}

export interface RpcSuccess<T = unknown> {
  jsonrpc: JsonRpcVersion
  id: string
  result: T
}

export interface RpcFailure {
  jsonrpc: JsonRpcVersion
  id: string
  error: ErrorInfo
}

export type RpcResponse<T = unknown> = RpcSuccess<T> | RpcFailure

export function responseFromResult<T>(id: string, r: Result<T>): RpcResponse<T> {
  return r.ok
    ? { jsonrpc: JSONRPC_VERSION, id, result: r.value }
    : { jsonrpc: JSONRPC_VERSION, id, error: r.error }
}
