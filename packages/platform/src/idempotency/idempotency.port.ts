import type {IdempotencyClaim, IdempotencyClaimInput, IdempotencyCompleteInput} from './idempotency.types'

/**
 * Records a mutating request so a retry with the same key replays the original response.
 * Must run inside an ambient UnitOfWork so the row commits with the work it guards.
 */
export interface IdempotencyPort {
  claim(input: IdempotencyClaimInput): Promise<IdempotencyClaim>
  complete(input: IdempotencyCompleteInput): Promise<void>
}
