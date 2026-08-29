import type {Unsubscribe} from './pubsub.types'

/**
 * Lightweight fan-out. Not durable — crash-safe delivery uses the outbox later.
 */
export interface PubSubPort {
  publish(channel: string, payload: string): Promise<void>
  subscribe(channel: string, handler: (payload: string) => void): Promise<Unsubscribe>
}
