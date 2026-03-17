import { ZodError } from 'zod'
import { NextResponse, type NextRequest } from 'next/server'
import { generateCorrelationId } from '@/lib/correlation'
import { extractClientIp, hashClientIp } from '@/lib/vote/ip'
import { logPasswordAccess, logVoteFailure } from '@/lib/vote/logging'
import { issueVoteUnlockToken } from '@/lib/vote/password-access'
import {
  clearPasswordFailureAttempts,
  createPasswordRateLimitKey,
  isPasswordRateLimited,
  registerPasswordFailureAttempt,
} from '@/lib/vote/password-rate-limit'
import { isSupportedPasswordHash, verifyVotePassword } from '@/lib/vote/password'
import { getVoteAccessGuard, getVoteById } from '@/lib/vote/service'
import {
  parsePasswordVerifyPayload,
  parseVoteIdParam,
  toPasswordVerifyFailureResponse,
  toValidationError,
} from '@/lib/vote/validate'

interface RouteContext {
  params: Promise<{ voteId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const correlationId = request.headers.get('x-correlation-id') ?? generateCorrelationId()
  const startedAt = Date.now()

  try {
    const { voteId: rawVoteId } = await context.params
    const voteId = parseVoteIdParam(rawVoteId)
    const payload = parsePasswordVerifyPayload(await request.json())

    const clientIp = extractClientIp(request)
    const hashedIp = hashClientIp(clientIp)
    const limitKey = createPasswordRateLimitKey(voteId, hashedIp)

    if (isPasswordRateLimited(limitKey)) {
      const response = toPasswordVerifyFailureResponse('rate_limited')

      logPasswordAccess('vote.password.rate_limited', {
        correlationId,
        voteId,
        elapsedMs: Date.now() - startedAt,
      })

      return NextResponse.json(response.body, {
        status: response.status,
        headers: {
          ...response.headers,
          'x-correlation-id': correlationId,
        },
      })
    }

    const access = await getVoteAccessGuard(voteId)
    if (!access || access.status === 'expired' || new Date(access.expires_at) <= new Date()) {
      return NextResponse.json(
        {
          error: 'not_found',
          message: 'Vote not found',
        },
        {
          status: 404,
          headers: {
            'x-correlation-id': correlationId,
          },
        }
      )
    }

    if (!access.requires_password) {
      return NextResponse.json(
        {
          authenticated: false,
          message: 'Vote does not require password',
        },
        {
          status: 400,
          headers: {
            'x-correlation-id': correlationId,
          },
        }
      )
    }

    if (!access.password_hash || !isSupportedPasswordHash(access.password_hash)) {
      logVoteFailure('vote.password.hash_invalid', {
        correlationId,
        voteId,
        elapsedMs: Date.now() - startedAt,
      })

      return NextResponse.json(
        {
          error: 'internal_error',
          message: 'Password verification is unavailable',
        },
        {
          status: 500,
          headers: {
            'x-correlation-id': correlationId,
          },
        }
      )
    }

    const verified = verifyVotePassword(payload.password, access.password_hash)
    if (!verified) {
      const attemptNumber = registerPasswordFailureAttempt(limitKey)
      const response = toPasswordVerifyFailureResponse('invalid_password')

      logPasswordAccess('vote.password.invalid', {
        correlationId,
        voteId,
        attemptNumber,
        elapsedMs: Date.now() - startedAt,
      })

      return NextResponse.json(response.body, {
        status: response.status,
        headers: {
          'x-correlation-id': correlationId,
        },
      })
    }

    clearPasswordFailureAttempts(limitKey)
    const unlock = issueVoteUnlockToken(voteId)
    const vote = await getVoteById(voteId)

    if (!vote) {
      return NextResponse.json(
        {
          error: 'not_found',
          message: 'Vote not found',
        },
        {
          status: 404,
          headers: {
            'x-correlation-id': correlationId,
          },
        }
      )
    }

    logPasswordAccess('vote.password.verified', {
      correlationId,
      voteId,
      elapsedMs: Date.now() - startedAt,
    })

    return NextResponse.json(
      {
        authenticated: true,
        unlockToken: unlock.token,
        expiresAt: unlock.expiresAt,
        vote,
      },
      {
        status: 200,
        headers: {
          'x-correlation-id': correlationId,
        },
      }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(toValidationError(error), {
        status: 400,
        headers: {
          'x-correlation-id': correlationId,
        },
      })
    }

    logVoteFailure('vote.password.failed', {
      correlationId,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'unknown_error',
    })

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Failed to verify password',
      },
      {
        status: 500,
        headers: {
          'x-correlation-id': correlationId,
        },
      }
    )
  }
}