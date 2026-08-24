import type {IdGenerator} from '@b2b-saas-starter-kit/platform'

/**
 * Deterministic UUID strings that pass branded-id `parse`.
 */
export class SequentialIdGenerator implements IdGenerator {
  #sequence = 0

  generate(): string {
    this.#sequence += 1
    const hex = this.#sequence.toString(16).padStart(12, '0')

    return `00000000-0000-4000-8000-${hex}`
  }
}
