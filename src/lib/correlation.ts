/**
 * Generates a lightweight request correlation identifier for tracing
 * frontend-to-Edge-Function call chains without external dependencies.
 */
export function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without Web Crypto
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const CORRELATION_HEADER = 'x-correlation-id'

/** Returns headers object with correlation id set. */
export function withCorrelationHeader(
  existingHeaders: Record<string, string> = {},
  correlationId?: string
): Record<string, string> {
  return {
    ...existingHeaders,
    [CORRELATION_HEADER]: correlationId ?? generateCorrelationId(),
  }
}
