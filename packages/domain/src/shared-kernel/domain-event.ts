/**
 * A fact that already happened inside a bounded context.
 *
 * `type` is past tense (`TenantCreated`). Extra payload fields sit alongside
 * `type` and `occurredAt`. The domain records events; it never dispatches them.
 */
export type DomainEvent<TType extends string = string> = {
  readonly type: TType
  readonly occurredAt: Date
} & Record<string, unknown>
