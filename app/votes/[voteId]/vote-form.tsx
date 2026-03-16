'use client'

import { useMemo, useState } from 'react'
import type { VoteOption } from '@/types/contracts'

interface VoteFormProps {
  voteId: string
  options: VoteOption[]
  allowMultiple: boolean
  isOpen: boolean
  previouslySelectedOptionIds?: string[] | null
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

interface SubmitResult {
  action: 'created' | 'updated' | 'unchanged'
  selectedOptionIds: string[]
}

function normalizeSelection(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

export function VoteForm({
  voteId,
  options,
  allowMultiple,
  isOpen,
  previouslySelectedOptionIds = null,
}: VoteFormProps) {
  const initialSelection = useMemo(
    () => normalizeSelection(previouslySelectedOptionIds ?? []),
    [previouslySelectedOptionIds]
  )

  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(initialSelection)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [message, setMessage] = useState<string>('')

  const toggleSelection = (optionId: string) => {
    if (!allowMultiple) {
      setSelectedOptionIds([optionId])
      return
    }

    setSelectedOptionIds((current) => {
      const hasOption = current.includes(optionId)
      return hasOption ? current.filter((item) => item !== optionId) : [...current, optionId]
    })
  }

  const submitVote = async () => {
    if (!isOpen) {
      setSubmitState('error')
      setMessage('Voting has ended for this poll.')
      return
    }

    if (selectedOptionIds.length === 0) {
      setSubmitState('error')
      setMessage('Please select at least one option.')
      return
    }

    try {
      setSubmitState('submitting')
      setMessage('Submitting your vote...')

      const response = await fetch(`/api/votes/${encodeURIComponent(voteId)}/responses`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          selectedOptionIds,
        }),
      })

      const payload = (await response.json()) as SubmitResult | { message?: string }
      if (!response.ok) {
        const errorPayload = payload as { message?: string }
        setSubmitState('error')
        setMessage(errorPayload.message ?? 'Unable to submit vote right now.')
        return
      }

      const result = payload as SubmitResult
      setSelectedOptionIds(normalizeSelection(result.selectedOptionIds))
      setSubmitState('success')

      if (result.action === 'created') {
        setMessage('Your vote has been recorded.')
      } else if (result.action === 'updated') {
        setMessage('Your vote has been updated.')
      } else {
        setMessage('Your current selection is already recorded.')
      }
    } catch {
      setSubmitState('error')
      setMessage('Unable to submit vote right now.')
    }
  }

  return (
    <section>
      <h2>Cast your vote</h2>
      {previouslySelectedOptionIds?.length ? <p>Your previous selection is pre-filled.</p> : null}
      <fieldset disabled={!isOpen || submitState === 'submitting'}>
        <legend>{allowMultiple ? 'Select one or more options' : 'Select one option'}</legend>
        <ul>
          {options.map((option) => {
            const checked = selectedOptionIds.includes(option.id)
            return (
              <li key={option.id}>
                <label>
                  <input
                    type={allowMultiple ? 'checkbox' : 'radio'}
                    name="vote-option"
                    value={option.id}
                    checked={checked}
                    onChange={() => toggleSelection(option.id)}
                  />{' '}
                  {option.text}
                </label>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <button type="button" disabled={!isOpen || submitState === 'submitting'} onClick={submitVote}>
        {submitState === 'submitting' ? 'Submitting...' : 'Submit vote'}
      </button>

      {message ? <p>{message}</p> : null}
    </section>
  )
}
