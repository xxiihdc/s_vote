interface VoteTimingState {
  isOpen: boolean
  reason?: 'not_opened' | 'closed' | 'expired'
}

export function computeExpiresAt(from: Date, expirationDays: number): Date {
  return new Date(from.getTime() + expirationDays * 24 * 60 * 60 * 1000)
}

export function getVoteTimingState(input: {
  now: Date
  openTime: Date
  closeTime: Date | null
  expiresAt?: Date
}): VoteTimingState {
  const { now, openTime, closeTime, expiresAt } = input

  if (now < openTime) {
    return { isOpen: false, reason: 'not_opened' }
  }

  if (closeTime && now > closeTime) {
    return { isOpen: false, reason: 'closed' }
  }

  if (expiresAt && now > expiresAt) {
    return { isOpen: false, reason: 'expired' }
  }

  return { isOpen: true }
}
