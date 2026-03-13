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
    return <p>Loading vote results...</p>
  }

  if (state === 'not-available') {
    return <p role="alert">{message}</p>
  }

  if (!data) {
    return <p role="alert">Result data is unavailable.</p>
  }

  return (
    <section>
      <h1>{data.question}</h1>
      {data.results.length === 0 ? <p>No responses yet.</p> : null}
      <ul>
        {data.results.map((result) => (
          <li key={result.optionId}>
            {result.label}: {result.votes} votes ({result.percentage}%)
          </li>
        ))}
      </ul>
      <p>Last updated: {new Date(data.updatedAt).toISOString()}</p>
    </section>
  )
}
