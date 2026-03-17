import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const SALT_BYTES = 16
const KEY_BYTES = 64

export function hashVotePassword(password: string): string {
  const salt = randomBytes(SALT_BYTES).toString('hex')
  const key = scryptSync(password, salt, KEY_BYTES).toString('hex')
  return `${salt}:${key}`
}

export function verifyVotePassword(password: string, encodedHash: string): boolean {
  const [salt, stored] = encodedHash.split(':')
  if (!salt || !stored) return false

  const computed = scryptSync(password, salt, KEY_BYTES).toString('hex')
  const storedBuffer = Buffer.from(stored, 'hex')
  const computedBuffer = Buffer.from(computed, 'hex')

  if (storedBuffer.length !== computedBuffer.length) return false
  return timingSafeEqual(storedBuffer, computedBuffer)
}

export function isSupportedPasswordHash(encodedHash: string): boolean {
  const [salt, stored] = encodedHash.split(':')
  return Boolean(salt && stored && /^[a-f0-9]+$/i.test(salt) && /^[a-f0-9]+$/i.test(stored))
}
