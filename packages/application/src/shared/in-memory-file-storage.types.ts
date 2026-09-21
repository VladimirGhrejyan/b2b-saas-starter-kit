import type {FileStorageBucket} from '@b2b-saas-starter-kit/platform'

export type InMemoryFileObject = {
  readonly bucket: FileStorageBucket
  readonly key: string
  readonly contentType: string
  readonly body: Uint8Array
}
