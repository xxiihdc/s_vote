import { NextResponse } from 'next/server'
import { getVoteResultsByToken } from '@/lib/vote/service'
import { generateCorrelationId } from '@/lib/correlation'
import { logTokenRead, logVoteFailure } from '@/lib/vote/logging'
import { parseTokenParam, TokenLookupError, toTokenLookupResponse } from '@/lib/vote/validate'

interface RouteContext {
  params: Promise<{ token: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const correlationId = request.headers.get('x-correlation-id') ?? generateCorrelationId()
  const startedAt = Date.now()

  try {
    const { token } = await context.params
    const normalizedToken = parseTokenParam(token)
    const payload = await getVoteResultsByToken(normalizedToken)

    logTokenRead('vote.token.read.success', {
      correlationId,
      voteId: payload.voteId,
      elapsedMs: Date.now() - startedAt,
    })

    return NextResponse.json(payload, {
      status: 200,
      headers: { 'x-correlation-id': correlationId },
    })
  } catch (error) {
    if (error instanceof TokenLookupError) {
      const mapped = toTokenLookupResponse(error)
      logTokenRead('vote.token.read.unavailable', {
        correlationId,
        reason: error.code,
        elapsedMs: Date.now() - startedAt,
      })

      return NextResponse.json(mapped.body, {
        status: mapped.status,
        headers: { 'x-correlation-id': correlationId },
      })
    }

    logVoteFailure('vote.token.read.failed', {
      correlationId,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'unknown_error',
    })

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Failed to load vote results',
      },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      }
    )
  }
}
