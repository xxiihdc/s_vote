export type TokenAccessState = 'active' | 'expired' | 'archived' | 'deleted'

interface ResolveAccessStateInput {
  status: string
  tokenExpiresAt: string | Date
  now?: Date
}

export function resolveTokenAccessState(input: ResolveAccessStateInput): TokenAccessState {
  const now = input.now ?? new Date()
  const expiresAt = new Date(input.tokenExpiresAt)

  if (input.status === 'deleted') {
    return 'deleted'
  }

  if (input.status === 'archived' || input.status === 'closed') {
    return 'archived'
  }

  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= now || input.status === 'expired') {
    return 'expired'
  }

  return 'active'
}

export function canReadTokenResults(state: TokenAccessState): boolean {
  return state === 'active'
}
