import React from 'react'
import Link from 'next/link'
import { CreateVoteForm } from './create-vote-form'
import { CopyResultUrlButton } from './copy-result-url-button'
import { hasCompleteCreatedLinks } from '@/types/contracts'

interface CreateVotePageProps {
  searchParams: Promise<{
    error?: string
    created?: string
    voteUrl?: string
    resultUrl?: string
    tokenExpiresAt?: string
  }>
}

export default async function CreateVotePage({ searchParams }: CreateVotePageProps) {
  const { error, created, voteUrl, resultUrl, tokenExpiresAt } = await searchParams
  const createdFlag = created === '1' ? '1' : undefined
  const hasCreatedLinks = hasCompleteCreatedLinks({
    created: createdFlag,
    voteUrl,
    resultUrl,
  })
  const hasIncompleteCreatedLinks = created === '1' && !hasCreatedLinks

  if (hasIncompleteCreatedLinks) {
    console.warn('vote.create.share_links.incomplete', {
      hasVoteUrl: Boolean(voteUrl),
      hasResultUrl: Boolean(resultUrl),
    })
  }

  return (
    <main className="page-container stack">
      <header>
        <h1 className="page-title">Create a vote</h1>
        <p className="page-subtitle">Anonymous flow: create poll, get token URL, share and track results.</p>
      </header>

      {hasCreatedLinks ? (
        <section className="card stack notice-success" aria-label="Vote created successfully">
          <p role="status">Vote created successfully.</p>
          <div className="field">
            <label htmlFor="voteUrl">Voting URL (share with voters)</label>
            <input id="voteUrl" value={voteUrl} readOnly />
          </div>
          <div className="btn-row">
            <Link className="btn-secondary" href={voteUrl!}>
              Open voting page
            </Link>
            <CopyResultUrlButton resultUrl={voteUrl!} label="Copy voting URL" />
          </div>
          <div className="field">
            <label htmlFor="resultUrl">Result URL</label>
            <input id="resultUrl" value={resultUrl} readOnly />
          </div>
          <div className="btn-row">
            <Link className="btn-secondary" href={resultUrl!}>
              Open result page
            </Link>
            <CopyResultUrlButton resultUrl={resultUrl!} />
          </div>
          {tokenExpiresAt ? <p className="muted">Token expires at: {new Date(tokenExpiresAt).toISOString()}</p> : null}
        </section>
      ) : null}

      {hasIncompleteCreatedLinks ? (
        <section className="card notice-error" role="alert">
          Unable to load share links.
        </section>
      ) : null}

      <CreateVoteForm initialError={error} />
    </main>
  )
}
