import { createHash } from 'crypto'

function firstIpFromHeader(value: string | null): string {
  if (!value) return 'unknown-ip'
  return value.split(',')[0]?.trim() || 'unknown-ip'
}

export function buildVoterFingerprint(input: {
  ipHeader: string | null
  userAgent: string | null
  acceptLanguage: string | null
}): string {
  const ip = firstIpFromHeader(input.ipHeader)
  const userAgent = input.userAgent ?? 'unknown-ua'
  const language = input.acceptLanguage ?? 'unknown-lang'

  const normalized = `${ip}|${userAgent}|${language}`
  return createHash('sha256').update(normalized).digest('hex')
}
