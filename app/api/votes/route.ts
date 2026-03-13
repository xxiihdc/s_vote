import { ZodError } from 'zod'
import { NextResponse, type NextRequest } from 'next/server'
import { parseCreateVotePayload, toValidationError } from '@/lib/vote/validate'
import { createVote } from '@/lib/vote/service'
import { generateCorrelationId } from '@/lib/correlation'
import { logTokenCreate, logVoteFailure, logVoteRequest } from '@/lib/vote/logging'

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') ?? generateCorrelationId()
  const startedAt = Date.now()

  try {
    const payload = parseCreateVotePayload(await request.json())

    logVoteRequest('vote.create.request', {
      correlationId,
      hasPassword: payload.requiresPassword,
      optionCount: payload.options.length,
    })

    const vote = await createVote(payload)

    logVoteRequest('vote.create.success', {
      correlationId,
      voteId: vote.voteId,
      elapsedMs: Date.now() - startedAt,
    })

    logTokenCreate('vote.token.created', {
      correlationId,
      voteId: vote.voteId,
      tokenExpiresAt: vote.tokenExpiresAt,
    })

    return NextResponse.json(vote, {
      status: 201,
      headers: { 'x-correlation-id': correlationId },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      logVoteFailure('vote.create.validation_failed', {
        correlationId,
        elapsedMs: Date.now() - startedAt,
      })
      return NextResponse.json(toValidationError(error), {
        status: 400,
        headers: { 'x-correlation-id': correlationId },
      })
    }

    logVoteFailure('vote.create.failed', {
      correlationId,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'unknown_error',
    })

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Failed to create vote',
      },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      }
    )
  }
}
