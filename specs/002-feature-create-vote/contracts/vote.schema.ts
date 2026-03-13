import { z } from 'zod';

/**
 * Shared TypeScript contracts for Vote feature
 * Used across frontend (app/), backend (api/), and Edge Functions
 * Location: src/types/contracts.ts
 */

// ============================================================================
// Vote Entity
// ============================================================================

export const VoteOptionSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(500),
  order: z.number().int().non_negative(),
});

export type VoteOption = z.infer<typeof VoteOptionSchema>;

export const VoteSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(3).max(1000),
  options: z.array(VoteOptionSchema).min(2).max(50),
  openTime: z.coerce.date(),
  closeTime: z.coerce.date().nullable(),
  requiresPassword: z.boolean(),
  allowMultiple: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  shareUrl: z.string().url().or(z.string()), // Can be full URL or short token
  creatorUserId: z.string().uuid().nullable(),
  status: z.enum(['active', 'closed', 'expired']),
});

export type Vote = z.infer<typeof VoteSchema>;

// Public-facing vote data (excludes sensitive fields)
export const VotePublicSchema = VoteSchema.omit({
  creatorUserId: true,
  passwordHash: true,
});

export type VotePublic = z.infer<typeof VotePublicSchema>;

// ============================================================================
// Vote Response (Voter Submission)
// ============================================================================

export const VoteResponseSchema = z.object({
  id: z.string().uuid(),
  voteId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).min(1),
  submittedAt: z.coerce.date(),
  voterFingerprint: z.string().max(255),
});

export type VoteResponse = z.infer<typeof VoteResponseSchema>;

// ============================================================================
// API Request Schemas
// ============================================================================

/**
 * POST /api/votes - Create a new vote
 */
export const CreateVoteRequestSchema = z.object({
  question: z.string().min(3).max(1000),
  options: z.array(z.string().min(1).max(500)).min(2).max(50),
  openTime: z.coerce.date().optional(),
  closeTime: z.coerce.date().nullable().optional(),
  requiresPassword: z.boolean().default(false),
  password: z.string().max(255).optional(),
  allowMultiple: z.boolean().default(false),
  expirationDays: z.number().int().min(1).max(30).default(30),
})
  .refine(
    (data) => data.closeTime === null || data.closeTime > (data.openTime || new Date()),
    { message: 'closeTime must be after openTime' }
  )
  .refine(
    (data) => !data.requiresPassword || data.password,
    { message: 'password required when requiresPassword is true' }
  );

export type CreateVoteRequest = z.infer<typeof CreateVoteRequestSchema>;

/**
 * Successful response from POST /api/votes -> 201 Created
 */
export const CreateVoteResponseSchema = VoteSchema.pick({
  id: true,
  question: true,
  options: true,
  createdAt: true,
  openTime: true,
  closeTime: true,
  expiresAt: true,
  shareUrl: true,
  allowMultiple: true,
  requiresPassword: true,
});

export type CreateVoteResponse = z.infer<typeof CreateVoteResponseSchema>;

/**
 * POST /api/votes/:id/verify-password - Verify password for protected vote
 */
export const VerifyPasswordRequestSchema = z.object({
  voteId: z.string().uuid(),
  password: z.string().max(255),
});

export type VerifyPasswordRequest = z.infer<typeof VerifyPasswordRequestSchema>;

export const VerifyPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type VerifyPasswordResponse = z.infer<typeof VerifyPasswordResponseSchema>;

/**
 * POST /api/votes/:id/respond - Submit a vote response
 */
export const SubmitResponseRequestSchema = z.object({
  voteId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).min(1),
});

export type SubmitResponseRequest = z.infer<typeof SubmitResponseRequestSchema>;

export const SubmitResponseResponseSchema = z.object({
  success: z.boolean(),
  responseId: z.string().uuid(),
  message: z.string(),
});

export type SubmitResponseResponse = z.infer<typeof SubmitResponseResponseSchema>;

/**
 * GET /api/votes/:id/results - Get vote results
 */
export const VoteResultsSchema = z.object({
  voteId: z.string().uuid(),
  question: z.string(),
  options: z.array(z.object({
    id: z.string().uuid(),
    text: z.string(),
    order: z.number(),
    count: z.number().non_negative(),
    percentage: z.number().min(0).max(100),
  })),
  totalResponses: z.number().non_negative(),
  isOpen: z.boolean(),
  allowMultiple: z.boolean(),
});

export type VoteResults = z.infer<typeof VoteResultsSchema>;

// ============================================================================
// Error Responses
// ============================================================================

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.coerce.date().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ValidationErrorSchema = ApiErrorSchema.extend({
  error: z.literal('validation_error'),
  details: z.record(z.array(z.string())), // Field name -> error messages
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

export const NotFoundErrorSchema = ApiErrorSchema.extend({
  error: z.literal('not_found'),
});

export type NotFoundError = z.infer<typeof NotFoundErrorSchema>;

export const UnauthorizedErrorSchema = ApiErrorSchema.extend({
  error: z.literal('unauthorized'),
});

export type UnauthorizedError = z.infer<typeof UnauthorizedErrorSchema>;

export const ConflictErrorSchema = ApiErrorSchema.extend({
  error: z.literal('conflict'),
});

export type ConflictError = z.infer<typeof ConflictErrorSchema>;

// ============================================================================
// Health Check
// ============================================================================

export const HealthCheckResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  timestamp: z.coerce.date(),
  checks: z.object({
    database: z.enum(['ok', 'failed']),
    supabaseRealtime: z.enum(['ok', 'failed']).optional(),
  }),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
