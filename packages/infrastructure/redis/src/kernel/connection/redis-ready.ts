import type Redis from 'ioredis'

/**
 * Waits until an ioredis client can accept commands (`enableOfflineQueue: false`).
 */
export class RedisReady {
  static async wait(client: Redis): Promise<void> {
    if (client.status === 'ready') {
      return
    }

    await new Promise<void>((resolve, reject) => {
      const onReady = (): void => {
        client.off('error', onError)
        resolve()
      }
      const onError = (error: Error): void => {
        client.off('ready', onReady)
        reject(error)
      }

      client.once('ready', onReady)
      client.once('error', onError)

      if (client.status === 'ready') {
        client.off('ready', onReady)
        client.off('error', onError)
        resolve()
      }
    })
  }
}
