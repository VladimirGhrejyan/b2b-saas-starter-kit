export type RateLimitOptions = {
  readonly bucket: string
  readonly limit: number
  readonly windowSeconds: number
}
