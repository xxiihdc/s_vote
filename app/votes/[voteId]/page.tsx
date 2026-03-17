import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getVoteById } from '@/lib/vote/service'
import { ProtectedVoteClient } from './protected-vote-client'
import { VoteForm } from './vote-form'

interface VotePageProps {
  params: Promise<{ voteId: string }>
}

export default async function VotePage({ params }: VotePageProps) {
  const { voteId } = await params
  const vote = await getVoteById(voteId)

  if (!vote || vote.status === 'expired') {
    notFound()
  }

  const isProtectedVote = vote.requiresPassword

  return (
    <main className="page-container stack">
      <header className="card stack vote-hero">
        <p className="eyebrow">Anonymous voting</p>
        <div className="stack vote-hero-copy">
          <h1 className="page-title">{vote.question}</h1>
          <p className="page-subtitle">
            Choose {vote.allowMultiple ? 'one or more options' : 'the option that matches your answer best'}.
          </p>
        </div>
        <div className="status-row" aria-label="Poll status">
          <span className={`status-badge ${vote.isOpen ? 'status-badge-success' : 'status-badge-neutral'}`}>
            {vote.isOpen ? 'Voting is open' : 'Voting is currently closed'}
          </span>
          <span className="status-badge status-badge-info">
            {vote.allowMultiple ? 'Multiple selections allowed' : 'Single selection only'}
          </span>
          <span className="status-badge status-badge-info">
            {vote.requiresPassword ? 'Password required to vote' : 'No password required'}
          </span>
        </div>
      </header>

      <div className="vote-page-grid">
        <section className="card stack">
          <div>
            <h2 className="card-title">Before you vote</h2>
            <p className="muted">Review the poll settings and available options before submitting your response.</p>
          </div>

          <ul className="vote-info-list">
            <li className="vote-info-item">
              <strong>{vote.allowMultiple ? 'Flexible selection' : 'One response only'}</strong>
              <span>{vote.allowMultiple ? 'You can submit more than one option.' : 'Pick a single option to submit.'}</span>
            </li>
            <li className="vote-info-item">
              <strong>{vote.isOpen ? 'Responses are live' : 'Poll is closed'}</strong>
              <span>
                {vote.isOpen
                  ? 'You can change your selection later from the same device.'
                  : 'Submissions are disabled because this poll is no longer accepting votes.'}
              </span>
            </li>
            <li className="vote-info-item">
              <strong>{vote.options.length} options available</strong>
              <span>All choices appear below exactly as shared by the poll creator.</span>
            </li>
          </ul>

          <div className="stack">
            <h2 className="card-title">Options in this poll</h2>
            {isProtectedVote ? (
              <p className="muted">Options are shown after password verification for this page view.</p>
            ) : (
              <ul className="vote-preview-list">
                {vote.options.map((option, index) => (
                  <li className="vote-preview-item" key={option.id}>
                    <span className="vote-preview-index">{index + 1}</span>
                    <span>{option.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {isProtectedVote ? (
          <ProtectedVoteClient voteId={vote.id} />
        ) : (
          <VoteForm
            voteId={vote.id}
            options={vote.options}
            allowMultiple={vote.allowMultiple}
            isOpen={vote.isOpen}
          />
        )}
      </div>

      <section className="card stack">
        <div>
          <h2 className="card-title">Share and manage</h2>
          <p className="muted">Use the voting link below to invite more participants or create a fresh poll.</p>
        </div>

        <div className="field">
          <label htmlFor="vote-share-link">Share link</label>
          <input id="vote-share-link" value={`/votes/${vote.id}`} readOnly />
        </div>

        <div className="btn-row">
          <Link className="btn-secondary" href="/votes/create">
            Create another vote
          </Link>
        </div>
      </section>
    </main>
  )
}
