interface PasswordRateLimitState {
  attempts: number
  resetAt: number
}

const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 5
const states = new Map<string, PasswordRateLimitState>()

function nowMs(): number {
  return Date.now()
}

function cleanupExpired(reference = nowMs()): void {
  for (const [key, state] of states.entries()) {
    if (state.resetAt <= reference) {
      states.delete(key)
    }
  }
}

export function isPasswordRateLimited(key: string): boolean {
  cleanupExpired()
  const state = states.get(key)
  if (!state) {
    return false
  }

  return state.attempts >= MAX_ATTEMPTS && state.resetAt > nowMs()
}

export function registerPasswordFailureAttempt(key: string): number {
  cleanupExpired()
  const current = states.get(key)
  const reference = nowMs()

  if (!current || current.resetAt <= reference) {
    states.set(key, {
      attempts: 1,
      resetAt: reference + WINDOW_MS,
    })
    return 1
  }

  current.attempts += 1
  states.set(key, current)
  return current.attempts
}

export function clearPasswordFailureAttempts(key: string): void {
  states.delete(key)
}

export function createPasswordRateLimitKey(voteId: string, hashedIp: string): string {
  return `${voteId}:${hashedIp}`
}

export function clearPasswordRateLimitsForTest(): void {
  states.clear()
}