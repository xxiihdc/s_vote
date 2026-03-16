import { logger } from '@/lib/logger'

export function logVoteRequest(event: string, context: Record<string, unknown>): void {
  logger.info(event, {
    domain: 'vote',
    ...context,
  })
}

export function logVoteFailure(event: string, context: Record<string, unknown>): void {
  logger.warn(event, {
    domain: 'vote',
    ...context,
  })
}

export function logTokenRead(event: string, context: Record<string, unknown>): void {
  logger.info(event, {
    domain: 'vote-token-read',
    ...context,
  })
}

export function logTokenCreate(event: string, context: Record<string, unknown>): void {
  logger.info(event, {
    domain: 'vote-token-create',
    ...context,
  })
}

export function logVoteSubmit(event: string, context: Record<string, unknown>): void {
  logger.info(event, {
    domain: 'vote-submit',
    ...context,
  })
}
