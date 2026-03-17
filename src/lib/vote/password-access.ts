import { createHash, randomBytes, timingSafeEqual } from 'crypto'

interface VoteUnlockSession {
  voteId: string
  expiresAt: number
}

const sessions = new Map<string, VoteUnlockSession>()

function nowMs(): number {
  return Date.now()
}

function resolveUnlockTtlMs(): number {
  const raw = Number(process.env.VOTE_UNLOCK_TOKEN_TTL_MS ?? '120000')
  if (!Number.isFinite(raw)) {
    return 120000
  }

  return Math.min(Math.max(Math.floor(raw), 5000), 300000)
}

function makeToken(): string {
  return randomBytes(24).toString('base64url')
}

function fingerprintToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function clearExpiredSessions(reference = nowMs()) {
  for (const [key, value] of sessions.entries()) {
    if (value.expiresAt <= reference) {
      sessions.delete(key)
    }
  }
}

export function issueVoteUnlockToken(voteId: string): { token: string; expiresAt: string } {
  clearExpiredSessions()

  const token = makeToken()
  const expiresAt = nowMs() + resolveUnlockTtlMs()
  sessions.set(fingerprintToken(token), {
    voteId,
    expiresAt,
  })

  return {
    token,
    expiresAt: new Date(expiresAt).toISOString(),
  }
}

export function validateVoteUnlockToken(voteId: string, token: string | null | undefined): boolean {
  if (!token) {
    return false
  }

  clearExpiredSessions()

  const record = sessions.get(fingerprintToken(token))
  if (!record) {
    return false
  }

  if (record.expiresAt <= nowMs()) {
    sessions.delete(fingerprintToken(token))
    return false
  }

  const left = Buffer.from(record.voteId, 'utf8')
  const right = Buffer.from(voteId, 'utf8')
  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

export function readVoteUnlockTokenFromHeader(headers: Headers): string | null {
  const raw = headers.get('x-vote-unlock-token')?.trim()
  if (!raw) {
    return null
  }

  return raw
}

export function readVotePasswordFromHeader(headers: Headers): string | null {
  const raw = headers.get('x-vote-password')?.trim()
  if (!raw) {
    return null
  }

  return raw
}

export function clearVoteUnlockSessionsForTest(): void {
  sessions.clear()
}