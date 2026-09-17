/**
 * Common shape for every domain event. Context unions extend this with a literal `type`.
 */
export type DomainEventBase<TType extends string = string> = {
  readonly type: TType
  readonly occurredAt: Date
}
