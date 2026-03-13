import { NextResponse } from 'next/server'
import { getVoteById } from '@/lib/vote/service'

interface RouteContext {
  params: Promise<{ voteId: string }>
}

export async function GET(_: Request, context: RouteContext) {
  const { voteId } = await context.params
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

  return NextResponse.json(vote)
}
