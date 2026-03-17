'use client'

import React from 'react'
import Link from 'next/link'
import { useActionState } from 'react'
import { createVoteAction } from './actions'
import { initialCreateVoteFormState, type CreateVoteFormState } from './form-state'

interface CreateVoteFormProps {
  initialError?: string
  initialState?: CreateVoteFormState
}

function normalizeFormState(
  state?: Partial<CreateVoteFormState> | null,
  fallback: CreateVoteFormState = initialCreateVoteFormState
): CreateVoteFormState {
  return {
    message: state?.message,
    errors: state?.errors ?? fallback.errors,
    values: {
      ...fallback.values,
      ...state?.values,
    },
    submissionId: state?.submissionId ?? fallback.submissionId,
  }
}

function getInitialMessage(initialError?: string): string | undefined {
  if (!initialError) {
    return undefined
  }

  return 'Unable to create vote. Please verify your input.'
}

function getFieldError(
  state: Partial<CreateVoteFormState> | null | undefined,
  field: keyof CreateVoteFormState['errors'] | string
): string | undefined {
  const messages = state?.errors?.[field]
  if (!messages || messages.length === 0) {
    return undefined
  }

  return messages.join(' ')
}

function getDescribedBy(errorId: string, hasError: boolean): string | undefined {
  return hasError ? errorId : undefined
}

export function CreateVoteForm({
  initialError,
  initialState = initialCreateVoteFormState,
}: CreateVoteFormProps) {
  const [actionState, formAction] = useActionState(createVoteAction, initialState)
  const state = normalizeFormState(actionState, initialState)
  const values = state.values ?? initialState.values
  const formMessage = state.message ?? getInitialMessage(initialError)
  const questionError = getFieldError(state, 'question')
  const optionsError = getFieldError(state, 'options')
  const openTimeError = getFieldError(state, 'openTime')
  const closeTimeError = getFieldError(state, 'closeTime')
  const passwordError = getFieldError(state, 'password')
  const expirationDaysError = getFieldError(state, 'expirationDays')

  return (
    <form key={state.submissionId ?? initialState.submissionId} className="card form-grid" action={formAction}>
      {formMessage ? (
        <p className="notice-inline notice-inline-error" role="alert">
          {formMessage}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="question">Question</label>
        <input
          id="question"
          name="question"
          required
          minLength={3}
          maxLength={1000}
          defaultValue={values.question}
          aria-invalid={questionError ? 'true' : 'false'}
          aria-describedby={getDescribedBy('question-error', Boolean(questionError))}
          className={questionError ? 'field-input-error' : undefined}
        />
        {questionError ? (
          <p id="question-error" className="field-error">
            {questionError}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="options">Options (one per line)</label>
        <textarea
          id="options"
          name="options"
          required
          rows={6}
          defaultValue={values.options}
          aria-invalid={optionsError ? 'true' : 'false'}
          aria-describedby={getDescribedBy('options-error', Boolean(optionsError))}
          className={optionsError ? 'field-input-error' : undefined}
        />
        {optionsError ? (
          <p id="options-error" className="field-error">
            {optionsError}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="openTime">Open time (optional)</label>
        <input
          id="openTime"
          name="openTime"
          type="datetime-local"
          defaultValue={values.openTime}
          aria-invalid={openTimeError ? 'true' : 'false'}
          aria-describedby={getDescribedBy('openTime-error', Boolean(openTimeError))}
          className={openTimeError ? 'field-input-error' : undefined}
        />
        {openTimeError ? (
          <p id="openTime-error" className="field-error">
            {openTimeError}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="closeTime">Close time (optional)</label>
        <input
          id="closeTime"
          name="closeTime"
          type="datetime-local"
          defaultValue={values.closeTime}
          aria-invalid={closeTimeError ? 'true' : 'false'}
          aria-describedby={getDescribedBy('closeTime-error', Boolean(closeTimeError))}
          className={closeTimeError ? 'field-input-error' : undefined}
        />
        {closeTimeError ? (
          <p id="closeTime-error" className="field-error">
            {closeTimeError}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="expirationDays">Expiration days (1-30)</label>
        <input
          id="expirationDays"
          name="expirationDays"
          type="number"
          min={1}
          max={30}
          defaultValue={values.expirationDays}
          aria-invalid={expirationDaysError ? 'true' : 'false'}
          aria-describedby={getDescribedBy('expirationDays-error', Boolean(expirationDaysError))}
          className={expirationDaysError ? 'field-input-error' : undefined}
        />
        {expirationDaysError ? (
          <p id="expirationDays-error" className="field-error">
            {expirationDaysError}
          </p>
        ) : null}
      </div>

      <div className="inline-field">
        <label className="inline-field">
          <input name="allowMultiple" type="checkbox" defaultChecked={values.allowMultiple} />
          Allow multiple selections
        </label>
      </div>

      <div className="inline-field">
        <label className="inline-field">
          <input name="requiresPassword" type="checkbox" defaultChecked={values.requiresPassword} />
          Require password for voters
        </label>
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          maxLength={255}
          aria-invalid={passwordError ? 'true' : 'false'}
          aria-describedby={getDescribedBy('password-error', Boolean(passwordError))}
          className={passwordError ? 'field-input-error' : undefined}
        />
        {passwordError ? (
          <p id="password-error" className="field-error">
            {passwordError}
          </p>
        ) : null}
      </div>

      <div className="btn-row">
        <button className="btn" type="submit">
          Create vote
        </button>
        <Link className="btn-secondary" href="/">
          Back to home
        </Link>
      </div>
    </form>
  )
}