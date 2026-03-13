import { describe, expect, it } from 'vitest'
import { buildResultUrl } from '@/lib/vote/token'

describe('token sharing integration', () => {
  it('keeps share URL stable across reuse', () => {
    const token = 'token_abc1234567890'
    const first = buildResultUrl(token)
    const second = buildResultUrl(token)

    expect(first).toBe(second)
  })
})
