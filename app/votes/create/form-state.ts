export interface CreateVoteFormValues {
  question: string
  options: string
  openTime: string
  closeTime: string
  expirationDays: string
  allowMultiple: boolean
  requiresPassword: boolean
}

export interface CreateVoteFormState {
  message?: string
  errors: Record<string, string[]>
  values: CreateVoteFormValues
  submissionId: string
}

export const initialCreateVoteFormState: CreateVoteFormState = {
  errors: {},
  values: {
    question: '',
    options: '',
    openTime: '',
    closeTime: '',
    expirationDays: '30',
    allowMultiple: false,
    requiresPassword: false,
  },
  submissionId: 'initial',
}