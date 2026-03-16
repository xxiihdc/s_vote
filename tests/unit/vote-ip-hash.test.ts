import { describe, expect, it } from 'vitest'
import { extractClientIp, hashClientIp } from '@/lib/vote/ip'

describe('vote ip hashing utilities', () => {
  it('extracts first IP from x-forwarded-for header', () => {
    const request = {
      headers: {
        get(name: string) {
          if (name === 'x-forwarded-for') {
            return '203.0.113.10, 198.51.100.1'
          }
          return null
        },
      },
    }

    expect(extractClientIp(request as never)).toBe('203.0.113.10')
  })

  it('falls back to x-real-ip when x-forwarded-for is missing', () => {
    const request = {
      headers: {
        get(name: string) {
          if (name === 'x-real-ip') {
            return '198.51.100.77'
          }
          return null
        },
      },
    }

    expect(extractClientIp(request as never)).toBe('198.51.100.77')
  })

  it('returns stable sha256 hash for same IP', () => {
    const first = hashClientIp('203.0.113.10')
    const second = hashClientIp('203.0.113.10')

    expect(first).toBe(second)
    expect(first).toMatch(/^[a-f0-9]{64}$/)
  })
})
