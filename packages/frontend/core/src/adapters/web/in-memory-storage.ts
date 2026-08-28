import type {StoragePort} from '../../ports/storage.port'

export class InMemoryStorage implements StoragePort {
  readonly #values = new Map<string, string>()

  get(key: string): string | null {
    return this.#values.get(key) ?? null
  }

  set(key: string, value: string): void {
    this.#values.set(key, value)
  }

  remove(key: string): void {
    this.#values.delete(key)
  }
}
