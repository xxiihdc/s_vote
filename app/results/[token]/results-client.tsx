'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

interface TokenResultItem {
  optionId: string
  label: string
  votes: number
  percentage: number
}

interface TokenResultsPayload {
  voteId: string
  question: string
  results: TokenResultItem[]
  updatedAt: string
}

interface TokenResultsClientProps {
  token: string
  refreshIntervalMs: number
}

export function TokenResultsClient({ token, refreshIntervalMs }: TokenResultsClientProps) {
  const [data, setData] = useState<TokenResultsPayload | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'not-available'>('loading')
  const [message, setMessage] = useState('Loading vote results...')

  const endpoint = useMemo(() => `/api/votes/results/${encodeURIComponent(token)}`, [token])
  const refreshSeconds = useMemo(() => Math.max(1, Math.round(refreshIntervalMs / 1000)), [refreshIntervalMs])
  const totalVotes = useMemo(() => data?.results.reduce((sum, result) => sum + result.votes, 0) ?? 0, [data])
  const leadingResult = useMemo(
    () =>
      data?.results.reduce<TokenResultItem | null>(
        (currentLeader, result) =>
          !currentLeader || result.votes > currentLeader.votes ? result : currentLeader,
        null
      ) ?? null,
    [data]
  )

  const loadResults = useCallback(async () => {
    const response = await fetch(endpoint, { cache: 'no-store' })

    if (response.status === 404 || response.status === 410) {
      setState('not-available')
      setMessage('This result link is not available.')
      console.info('vote.token.page.unavailable', { status: response.status })
      return
    }

    if (!response.ok) {
      setState('not-available')
      setMessage('Unable to load vote results right now.')
      console.warn('vote.token.page.fetch_failed', { status: response.status })
      return
    }

    const json = (await response.json()) as TokenResultsPayload
    setData(json)
    setState('ready')
    console.info('vote.token.page.refreshed', { voteId: json.voteId })
  }, [endpoint])

  useEffect(() => {
    let active = true

    const execute = async () => {
      try {
        await loadResults()
      } catch {
        if (active) {
          setState('not-available')
          setMessage('Unable to load vote results right now.')
        }
      }
    }

    void execute()

    const timer = window.setInterval(() => {
      void execute()
    }, refreshIntervalMs)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [loadResults, refreshIntervalMs])

  if (state === 'loading') {
    return (
      <section className="card stack results-shell" aria-live="polite">
        <p className="eyebrow">Live results</p>
        <p>{message}</p>
      </section>
    )
  }

  if (state === 'not-available') {
    return (
      <section className="card stack notice-error results-shell" role="alert">
        <p className="eyebrow">Live results</p>
        <p>{message}</p>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="card notice-error" role="alert">
        Result data is unavailable.
      </section>
    )
  }

  const formattedUpdatedAt = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(data.updatedAt))

  return (
    <section className="card stack results-shell">
      <header className="results-header">
        <div className="stack">
          <p className="eyebrow">Live results</p>
          <h1 className="page-title">{data.question}</h1>
          <p className="page-subtitle">Results refresh automatically every {refreshSeconds} seconds.</p>
        </div>
        <div className="live-pill" aria-label={`Auto refresh every ${refreshSeconds} seconds`}>
          <span className="live-dot" aria-hidden="true" />
          Live
        </div>
      </header>

      <div className="results-summary-grid" aria-label="Result summary">
        <article className="summary-stat">
          <span>Total votes</span>
          <strong>{totalVotes}</strong>
        </article>
        <article className="summary-stat">
          <span>Options</span>
          <strong>{data.results.length}</strong>
        </article>
        <article className="summary-stat">
          <span>Current leader</span>
          <strong>{leadingResult ? leadingResult.label : 'No leader yet'}</strong>
        </article>
      </div>

      {data.results.length === 0 ? <p className="muted result-empty">No responses yet.</p> : null}
      <ul className="result-list">
        {data.results.map((result) => (
          <li className="result-item" key={result.optionId}>
            <div className="result-meta">
              <strong>{result.label}</strong>
              <span>
                {result.votes} votes ({result.percentage}%)
              </span>
            </div>
            <div className="result-bar" aria-hidden="true">
              <div className="result-bar-fill" style={{ width: `${Math.max(0, Math.min(100, result.percentage))}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="muted">Last updated: {formattedUpdatedAt}</p>
    </section>
  )
}
