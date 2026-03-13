'use server'

import { redirect } from 'next/navigation'
import { createVote } from '@/lib/vote/service'
import { parseCreateVotePayload } from '@/lib/vote/validate'

function toOptionalDate(value: FormDataEntryValue | null): Date | undefined | null {
  if (!value) return undefined
  const stringValue = String(value)
  if (!stringValue) return undefined
  return new Date(stringValue)
}

export async function createVoteAction(formData: FormData): Promise<void> {
  try {
    const rawOptions = String(formData.get('options') ?? '')
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean)

    const payload = parseCreateVotePayload({
      question: String(formData.get('question') ?? ''),
      options: rawOptions,
      openTime: toOptionalDate(formData.get('openTime')) ?? undefined,
      closeTime: toOptionalDate(formData.get('closeTime')) ?? null,
      requiresPassword: formData.get('requiresPassword') === 'on',
      password: String(formData.get('password') ?? ''),
      allowMultiple: formData.get('allowMultiple') === 'on',
      expirationDays: Number(formData.get('expirationDays') ?? 30),
    })

    const vote = await createVote(payload)
    const params = new URLSearchParams({
      created: '1',
      resultUrl: vote.resultUrl,
      tokenExpiresAt: new Date(vote.tokenExpiresAt).toISOString(),
    })
    redirect(`/votes/create?${params.toString()}`)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) {
      throw error
    }
    redirect('/votes/create?error=invalid_input')
  }
}
