import type {StoragePort} from '../../ports/storage.port'

export class LocalStorageAdapter implements StoragePort {
  get(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null
    }

    return localStorage.getItem(key)
  }

  set(key: string, value: string): void {
    if (typeof localStorage === 'undefined') {
      return
    }

    localStorage.setItem(key, value)
  }

  remove(key: string): void {
    if (typeof localStorage === 'undefined') {
      return
    }

    localStorage.removeItem(key)
  }
}
