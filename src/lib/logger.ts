import { getEnv } from './env'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function getConfiguredLevel(): LogLevel {
  try {
    return getEnv().LOG_LEVEL
  } catch {
    return 'info'
  }
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[getConfiguredLevel()]
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return

  const entry: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
  }

  if (context) {
    // Never log secrets — filter known sensitive keys
    const safe = Object.fromEntries(
      Object.entries(context).filter(
        ([k]) => !/(key|secret|token|password|credential)/i.test(k)
      )
    )
    Object.assign(entry, safe)
  }

  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  fn(JSON.stringify(entry))
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context),
}
