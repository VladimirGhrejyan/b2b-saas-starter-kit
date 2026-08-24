import type {Clock} from '@b2b-saas-starter-kit/platform'

/**
 * Clock that always returns the constructed UTC instant.
 */
export class FixedClock implements Clock {
  readonly #now: Date

  constructor(now: Date) {
    this.#now = now
  }

  now(): Date {
    return this.#now
  }
}
