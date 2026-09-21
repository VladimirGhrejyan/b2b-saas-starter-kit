import type {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const FileStorageBucket = {
  private: 'private',
  public: 'public',
} as const

export type FileStorageBucket = (typeof FileStorageBucket)[keyof typeof FileStorageBucket]

export type FileObjectMeta = {
  readonly key: string
  readonly contentType: string
  readonly sizeBytes: number
}

export type FileStoragePutInput = {
  readonly bucket: FileStorageBucket
  readonly key: string
  readonly contentType: string
  readonly body: Uint8Array
}

export type FileStorageGetResult = {
  readonly meta: FileObjectMeta
  readonly body: Uint8Array
}

export type FileStoragePresignPutInput = {
  readonly bucket: FileStorageBucket
  readonly key: string
  readonly contentType: string
  readonly maxBytes?: number
  readonly expiresInSeconds: number
}

export type FileStoragePresignGetInput = {
  readonly bucket: FileStorageBucket
  readonly key: string
  readonly expiresInSeconds: number
}

export type PresignedUrl = {
  readonly url: string
  readonly method: 'PUT' | 'GET'
  readonly headers: Readonly<Record<string, string>>
  readonly expiresAt: Date
}

export type ParsedTenantObjectKey = {
  readonly kind: 'tenant'
  readonly tenantId: TenantId
  readonly purpose: string
  readonly year: string
  readonly month: string
  readonly objectId: string
  readonly key: string
}

export type ParsedGlobalObjectKey = {
  readonly kind: 'global'
  readonly purpose: string
  readonly year: string
  readonly month: string
  readonly objectId: string
  readonly key: string
}

export type ParsedObjectKey = ParsedTenantObjectKey | ParsedGlobalObjectKey
