// Pure: initial RPC method set. Each method declares its kind.

import { Ok, type Result } from '@unwild/lib/fp/index.ts'
import type { RpcRegistry } from './registry.ts'

export function registerCoreMethods(reg: RpcRegistry): void {
  reg.register(
    'ping',
    'read',
    (): Result<{ pong: true; ts: number }> => Ok({ pong: true, ts: Date.now() }),
  )

  reg.register('echo', 'read', (params): Result<unknown> => Ok(params ?? null))

  reg.register(
    'server.info',
    'read',
    (): Result<{ name: string; version: string }> => Ok({ name: 'unwild', version: '0.0.0' }),
  )
}
