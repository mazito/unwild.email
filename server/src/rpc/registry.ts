// Pure: RPC method registry. Each method declares its kind (read/write)
// so the HTTP adapter can enforce GET vs POST.

import { Err, type Result } from '@unwild/lib/fp/index.ts'
import { ErrorCode, type MethodKind } from '@unwild/lib/rpc/index.ts'

export type RpcHandler = (params: unknown) => Result<unknown> | Promise<Result<unknown>>

export interface RpcMethod {
  kind: MethodKind
  handler: RpcHandler
}

export interface RpcRegistry {
  register: (method: string, kind: MethodKind, handler: RpcHandler) => void
  get: (method: string) => RpcMethod | undefined
  list: () => Array<{ name: string; kind: MethodKind }>
}

export function createRegistry(): RpcRegistry {
  const methods = new Map<string, RpcMethod>()
  return {
    register(name, kind, handler) {
      methods.set(name, { kind, handler })
    },
    get: (name) => methods.get(name),
    list: () =>
      Array.from(methods.entries())
        .map(([name, m]) => ({ name, kind: m.kind }))
        .sort((a, b) => a.name.localeCompare(b.name)),
  }
}

export function methodNotFound(method: string): Result<never> {
  return Err(`method not found: ${method}`, ErrorCode.MethodNotFound)
}

export function methodWrongVerb(
  method: string,
  expected: MethodKind,
  got: 'GET' | 'POST',
): Result<never> {
  return Err(`method '${method}' is ${expected}-only, received ${got}`, ErrorCode.BadRequest, {
    expected,
    got,
  })
}
