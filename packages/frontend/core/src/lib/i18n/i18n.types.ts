import type {StoragePort} from '../../ports/storage.port'

export type LocaleResource = Record<string, unknown>

export type LoadNamespace = (locale: string, namespace: string) => Promise<LocaleResource>

export type CreateI18nOptions = {
  defaultLocale: string
  storage: StoragePort
  namespaces: string[]
  loadNamespace: LoadNamespace
  storageKey?: string
}
