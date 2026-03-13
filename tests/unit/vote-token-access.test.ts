import { describe, expect, it } from 'vitest'
import { canReadTokenResults, resolveTokenAccessState } from '@/lib/vote/token-access'

describe('token access state', () => {
  it('returns active for valid active token', () => {
    const state = resolveTokenAccessState({
      status: 'active',
      tokenExpiresAt: '2099-03-13T10:00:00.000Z',
      now: new Date('2026-03-13T10:00:00.000Z'),
    })

    expect(state).toBe('active')
    expect(canReadTokenResults(state)).toBe(true)
  })

  it('returns expired for past expiry time', () => {
    const state = resolveTokenAccessState({
      status: 'active',
      tokenExpiresAt: '2026-03-13T09:00:00.000Z',
      now: new Date('2026-03-13T10:00:00.000Z'),
    })

    expect(state).toBe('expired')
    expect(canReadTokenResults(state)).toBe(false)
  })

  it('returns archived/deleted for non-active states', () => {
    expect(
      resolveTokenAccessState({
        status: 'archived',
        tokenExpiresAt: '2099-03-13T10:00:00.000Z',
      })
    ).toBe('archived')

    expect(
      resolveTokenAccessState({
        status: 'deleted',
        tokenExpiresAt: '2099-03-13T10:00:00.000Z',
      })
    ).toBe('deleted')
  })
})
