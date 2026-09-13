export type RateLimitConsumeOptions = {
  readonly limit: number
  readonly windowSeconds: number
}

export type RateLimitDecision = {
  readonly allowed: boolean
  readonly remaining: number
  readonly retryAfterSeconds: number
}
