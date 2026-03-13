import { describe, expect, it } from 'vitest'
import { buildResultUrl } from '@/lib/vote/token'

describe('token URL generation', () => {
  it('builds stable result URL path from token', () => {
    const resultUrl = buildResultUrl('token_abc1234567890')
    expect(resultUrl).toContain('/results/token_abc1234567890')
  })
})
