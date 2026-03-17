'use server'

import { redirect } from 'next/navigation'
import { ZodError } from 'zod'
import { createVote } from '@/lib/vote/service'
import { parseCreateVotePayload, toValidationError } from '@/lib/vote/validate'
import { buildVoteUrl } from '@/lib/vote/token'
import type { CreateVoteFormState, CreateVoteFormValues } from './form-state'

function getSubmissionId(): string {
  return `${Date.now()}`
}

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value : ''
}

function readCreateVoteFormValues(formData: FormData): CreateVoteFormValues {
  return {
    question: toStringValue(formData.get('question')),
    options: toStringValue(formData.get('options')),
    openTime: toStringValue(formData.get('openTime')),
    closeTime: toStringValue(formData.get('closeTime')),
    expirationDays: toStringValue(formData.get('expirationDays')) || '30',
    allowMultiple: formData.get('allowMultiple') === 'on',
    requiresPassword: formData.get('requiresPassword') === 'on',
  }
}

function buildValidationFailureState(formData: FormData, error: ZodError): CreateVoteFormState {
  const validationError = toValidationError(error)

  return {
    message: 'Unable to create vote. Please correct the highlighted fields.',
    errors: validationError.details,
    values: readCreateVoteFormValues(formData),
    submissionId: getSubmissionId(),
  }
}

function buildGenericFailureState(formData: FormData): CreateVoteFormState {
  return {
    message: 'Unable to create vote right now. Please try again.',
    errors: {},
    values: readCreateVoteFormValues(formData),
    submissionId: getSubmissionId(),
  }
}

function toOptionalDate(value: FormDataEntryValue | null): Date | undefined | null {
  if (!value) return undefined
  const stringValue = String(value)
  if (!stringValue) return undefined
  return new Date(stringValue)
}

export async function createVoteAction(
  _previousState: CreateVoteFormState,
  formData: FormData
): Promise<CreateVoteFormState> {
  try {
    const submittedValues = readCreateVoteFormValues(formData)
    const rawOptions = String(formData.get('options') ?? '')
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean)

    const payload = parseCreateVotePayload({
      question: submittedValues.question,
      options: rawOptions,
      openTime: toOptionalDate(formData.get('openTime')) ?? undefined,
      closeTime: toOptionalDate(formData.get('closeTime')) ?? null,
      requiresPassword: submittedValues.requiresPassword,
      password: String(formData.get('password') ?? ''),
      allowMultiple: submittedValues.allowMultiple,
      expirationDays: Number(formData.get('expirationDays') ?? 30),
    })

    const vote = await createVote(payload)
    const voteUrl = buildVoteUrl(vote.voteId)
    const params = new URLSearchParams({
      created: '1',
      voteUrl,
      resultUrl: vote.resultUrl,
      tokenExpiresAt: new Date(vote.tokenExpiresAt).toISOString(),
    })
    redirect(`/votes/create?${params.toString()}`)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) {
      throw error
    }

    if (error instanceof ZodError) {
      return buildValidationFailureState(formData, error)
    }

    if (error instanceof Error) {
      console.error('createVoteAction failed', {
        message: error.message,
        stack: error.stack,
      })
    } else {
      console.error('createVoteAction failed with non-Error value', {
        error,
      })
    }

    return buildGenericFailureState(formData)
  }
}
