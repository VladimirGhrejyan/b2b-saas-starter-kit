/**
 * Injectable clock so use cases can pass deterministic timestamps into domain factories.
 *
 * `now()` returns a UTC instant. Adapters must not apply a local timezone.
 */
export interface Clock {
  now(): Date
}
