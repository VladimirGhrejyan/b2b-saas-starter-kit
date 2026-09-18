export const IdempotencyClaimKind = {
  Acquired: 'acquired',
  Replay: 'replay',
  InFlight: 'inFlight',
  FingerprintMismatch: 'fingerprintMismatch',
} as const

export type IdempotencyClaimInput = {
  readonly scope: string
  readonly endpoint: string
  readonly key: string
  readonly fingerprint: string
  readonly expiresAt: Date
}

export type IdempotencyCompleteInput = {
  readonly scope: string
  readonly endpoint: string
  readonly key: string
  readonly statusCode: number
  readonly body: unknown
}

export type IdempotencyClaim =
  | {readonly kind: typeof IdempotencyClaimKind.Acquired}
  | {readonly kind: typeof IdempotencyClaimKind.Replay; readonly statusCode: number; readonly body: unknown}
  | {readonly kind: typeof IdempotencyClaimKind.InFlight}
  | {readonly kind: typeof IdempotencyClaimKind.FingerprintMismatch}
