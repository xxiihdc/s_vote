import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'

function firstIpFromHeader(value: string | null): string | null {
  if (!value) return null
  const first = value.split(',')[0]?.trim()
  return first || null
}

export function extractClientIp(request: Pick<NextRequest, 'headers'>): string {
  return (
    firstIpFromHeader(request.headers.get('x-forwarded-for')) ??
    firstIpFromHeader(request.headers.get('x-real-ip')) ??
    'unknown'
  )
}

export function hashClientIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}
