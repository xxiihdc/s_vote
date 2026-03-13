import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getVoteById } from '@/lib/vote/service'

interface VotePageProps {
  params: Promise<{ voteId: string }>
}

export default async function VotePage({ params }: VotePageProps) {
  const { voteId } = await params
  const vote = await getVoteById(voteId)

  if (!vote || vote.status === 'expired') {
    notFound()
  }

  return (
    <main>
      <h1>{vote.question}</h1>
      <p>{vote.isOpen ? 'Voting is open' : 'Voting is currently closed'}</p>
      <p>{vote.allowMultiple ? 'Multiple selections allowed' : 'Single selection only'}</p>
      <p>{vote.requiresPassword ? 'Password required to vote' : 'No password required'}</p>

      <ul>
        {vote.options.map((option) => (
          <li key={option.id}>{option.text}</li>
        ))}
      </ul>

      <p>
        Share link: <code>/votes/{vote.id}</code>
      </p>

      <p>
        <Link href="/votes/create">Create another vote</Link>
      </p>
    </main>
  )
}
