import { Ok, type Result } from './result.ts'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface Env {
  readonly tracerEnabled: boolean
  readonly tracerOutput: 'console'
  readonly loggerEnabled: boolean
  readonly loggerLevel: LogLevel
  readonly loggerOutput: 'console'
}

const DEFAULTS: Env = Object.freeze({
  tracerEnabled: false,
  tracerOutput: 'console',
  loggerEnabled: true,
  loggerLevel: 'info',
  loggerOutput: 'console',
})

export function getEnv(overrides: Partial<Env> = {}): Result<Env> {
  return Ok(Object.freeze({ ...DEFAULTS, ...overrides }))
}
