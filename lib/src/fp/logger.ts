import type { Env, LogLevel } from './env.ts'

export interface Logger {
  readonly enabled: boolean
  log(level: LogLevel, message: string, data?: unknown): void
  debug(message: string, data?: unknown): void
  info(message: string, data?: unknown): void
  warn(message: string, data?: unknown): void
  error(message: string, data?: unknown): void
  fatal(message: string, data?: unknown): void
  close(): void
}

export interface LoggerOptions {
  enabled?: boolean
  level?: LogLevel
}

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
}

const nullLogger: Logger = {
  enabled: false,
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  close: () => {},
}

export async function getLogger(env: Env, opts: LoggerOptions = {}): Promise<Logger> {
  const enabled = opts.enabled ?? env.loggerEnabled
  if (!enabled) return nullLogger
  const threshold = LEVELS[opts.level ?? env.loggerLevel]

  function emit(level: LogLevel, message: string, data?: unknown): void {
    if (LEVELS[level] < threshold) return
    const ts = new Date().toISOString()
    const line = `[${ts}] ${level.toUpperCase()} ${message}`
    if (data === undefined) console.log(line)
    else console.log(line, data)
  }

  return {
    enabled: true,
    log: emit,
    debug: (m, d) => emit('debug', m, d),
    info: (m, d) => emit('info', m, d),
    warn: (m, d) => emit('warn', m, d),
    error: (m, d) => emit('error', m, d),
    fatal: (m, d) => emit('fatal', m, d),
    close: () => {},
  }
}
