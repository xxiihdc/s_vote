import { NextResponse } from 'next/server'
import { getVoteById } from '@/lib/vote/service'
import { parseVoteIdParam } from '@/lib/vote/validate'
import { readVoteUnlockTokenFromHeader, validateVoteUnlockToken } from '@/lib/vote/password-access'

interface RouteContext {
  params: Promise<{ voteId: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { voteId: rawVoteId } = await context.params
  const voteId = parseVoteIdParam(rawVoteId)
  const vote = await getVoteById(voteId)

  if (!vote || vote.status === 'expired') {
    return NextResponse.json(
      {
        error: 'not_found',
        message: 'Vote not found',
      },
      { status: 404 }
    )
  }

  if (vote.requiresPassword) {
    const unlockToken = readVoteUnlockTokenFromHeader(request.headers)
    const isUnlocked = validateVoteUnlockToken(voteId, unlockToken)

    if (!isUnlocked) {
      return NextResponse.json(
        {
          error: 'vote_protected',
          message: 'Password verification is required',
        },
        { status: 403 }
      )
    }
  }

  return NextResponse.json(vote)
}
