import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { getEnv } from '@/lib/env'

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/

export function generateResultToken(): string {
  return randomBytes(24).toString('base64url')
}

export function hashResultToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function compareResultToken(rawToken: string, hashedToken: string): boolean {
  const left = Buffer.from(hashResultToken(rawToken), 'utf8')
  const right = Buffer.from(hashedToken, 'utf8')

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

export function normalizeResultToken(value: string): string | null {
  const token = value.trim()
  if (!TOKEN_PATTERN.test(token)) {
    return null
  }
  return token
}

export function getCanonicalAppUrl(): string {
  return (() => {
    try {
      return getEnv().APP_URL
    } catch {
      return process.env.APP_URL ?? 'http://localhost:3000'
    }
  })().replace(/\/$/, '')
}

export function buildVoteUrl(voteId: string): string {
  const base = getCanonicalAppUrl()
  return `${base}/votes/${voteId}`
}

export function buildResultUrl(token: string): string {
  const base = getCanonicalAppUrl()
  return `${base}/results/${token}`
}
