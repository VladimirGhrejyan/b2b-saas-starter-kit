import type {Fail, Ok, Result as ResultShape} from './result.types'

/**
 * Factory and type guards for a composable success/failure value.
 *
 * Aggregates still throw {@link DomainError} for invariants. Use `Result` when
 * a caller should branch without exceptions.
 */
export class Result {
  static ok<T>(value: T): Ok<T> {
    return {ok: true, value}
  }

  static fail<E>(error: E): Fail<E> {
    return {ok: false, error}
  }

  static isOk<T, E>(result: ResultShape<T, E>): result is Ok<T> {
    return result.ok
  }

  static isFail<T, E>(result: ResultShape<T, E>): result is Fail<E> {
    return !result.ok
  }
}
