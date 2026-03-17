import { ZodError } from 'zod'
import { NextResponse, type NextRequest } from 'next/server'
import { generateCorrelationId } from '@/lib/correlation'
import { extractClientIp, hashClientIp } from '@/lib/vote/ip'
import { logPasswordAccess, logVoteFailure, logVoteSubmit } from '@/lib/vote/logging'
import { verifyVotePassword } from '@/lib/vote/password'
import { getVoteAccessGuard, submitVote } from '@/lib/vote/service'
import { readVotePasswordFromHeader, readVoteUnlockTokenFromHeader, validateVoteUnlockToken } from '@/lib/vote/password-access'
import {
  VoteSubmitError,
  parseVoteIdParam,
  parseVoteSubmissionPayload,
  toValidationError,
  toVoteSubmitResponse,
} from '@/lib/vote/validate'

interface RouteContext {
  params: Promise<{ voteId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const correlationId = request.headers.get('x-correlation-id') ?? generateCorrelationId()
  const startedAt = Date.now()
  let voteIdForLog: string | undefined

  try {
    const { voteId: rawVoteId } = await context.params
    const voteId = parseVoteIdParam(rawVoteId)
    voteIdForLog = voteId
    const payload = parseVoteSubmissionPayload(await request.json())

    const vote = await getVoteAccessGuard(voteId)
    if (vote?.requires_password) {
      const unlockToken = readVoteUnlockTokenFromHeader(request.headers)
      const passwordFromHeader = readVotePasswordFromHeader(request.headers)
      const password = payload.password?.trim() || passwordFromHeader

      const isUnlockedByToken = validateVoteUnlockToken(voteId, unlockToken)
      const isUnlockedByPassword = Boolean(password && vote.password_hash && verifyVotePassword(password, vote.password_hash))
      const isUnlocked = isUnlockedByToken || isUnlockedByPassword

      if (!isUnlocked) {
        logPasswordAccess('vote.submit.protected_rejected', {
          correlationId,
          voteId,
          elapsedMs: Date.now() - startedAt,
        })
        throw new VoteSubmitError('vote_protected', 'Password verification is required')
      }
    }

    const clientIp = extractClientIp(request)
    const voterFingerprint = hashClientIp(clientIp)

    const result = await submitVote({
      voteId,
      selectedOptionIds: payload.selectedOptionIds,
      voterFingerprint,
    })

    logVoteSubmit('vote.submit.success', {
      correlationId,
      voteId,
      action: result.action,
      optionCount: result.selectedOptionIds.length,
      elapsedMs: Date.now() - startedAt,
    })

    return NextResponse.json(result, {
      status: result.action === 'created' ? 201 : 200,
      headers: {
        'x-correlation-id': correlationId,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      logVoteFailure('vote.submit.validation_failed', {
        correlationId,
        elapsedMs: Date.now() - startedAt,
      })

      return NextResponse.json(toValidationError(error), {
        status: 400,
        headers: {
          'x-correlation-id': correlationId,
        },
      })
    }

    if (error instanceof VoteSubmitError) {
      const mapped = toVoteSubmitResponse(error)

      logVoteFailure('vote.submit.rejected', {
        correlationId,
        voteId: error.code === 'vote_not_found' ? undefined : voteIdForLog,
        reason: error.code,
        elapsedMs: Date.now() - startedAt,
      })

      return NextResponse.json(mapped.body, {
        status: mapped.status,
        headers: {
          'x-correlation-id': correlationId,
        },
      })
    }

    logVoteFailure('vote.submit.failed', {
      correlationId,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'unknown_error',
    })

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Failed to submit vote',
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
