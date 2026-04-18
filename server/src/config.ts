// Pure: server config shape + loader (overrides only; no IO here).

import { Ok, type Result } from '@unwild/lib/fp/index.ts'

export interface ServerConfig {
  host: string
  port: number
  dataDir: string
  docsDir: string
  appDir: string
}

const DEFAULTS: ServerConfig = {
  host: 'localhost',
  port: 3030,
  dataDir: './data',
  docsDir: './docs-data',
  appDir: './app/dist',
}

export function getConfig(overrides: Partial<ServerConfig> = {}): Result<ServerConfig> {
  // Bun exposes process.env natively; keep this pure by passing env in if ever needed.
  const env = (typeof process !== 'undefined' ? process.env : {}) as Record<
    string,
    string | undefined
  >
  const fromEnv: Partial<ServerConfig> = {
    host: env.UNWILD_HOST,
    port: env.UNWILD_PORT ? Number(env.UNWILD_PORT) : undefined,
    dataDir: env.UNWILD_DATA_DIR,
    docsDir: env.UNWILD_DOCS_DIR,
    appDir: env.UNWILD_APP_DIR,
  }
  // Drop undefined before merge.
  const clean = Object.fromEntries(
    Object.entries(fromEnv).filter(([, v]) => v !== undefined),
  ) as Partial<ServerConfig>
  return Ok(Object.freeze({ ...DEFAULTS, ...clean, ...overrides }))
}
