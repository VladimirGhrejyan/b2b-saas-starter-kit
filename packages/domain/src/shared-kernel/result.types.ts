export type Ok<T> = {
  readonly ok: true
  readonly value: T
}

export type Fail<E> = {
  readonly ok: false
  readonly error: E
}

export type Result<T, E = unknown> = Ok<T> | Fail<E>
