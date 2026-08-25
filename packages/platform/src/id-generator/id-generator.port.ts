/**
 * Injectable ID factory. Application brands the raw string
 * (`UserId.parse(ids.generate())`) before calling domain factories.
 *
 * UUID v7 is the Phase 7 adapter, not this port.
 */
export interface IdGenerator {
  generate(): string
}
