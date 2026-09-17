import type {DomainEvent} from '@b2b-saas-starter-kit/domain'

export type EventSource = {
  pullEvents(): DomainEvent[]
}
