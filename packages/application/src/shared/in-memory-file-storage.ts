import {Injectable} from '@nestjs/common'

import {DateUtils} from '@b2b-saas-starter-kit/utils'

import type {
  FileObjectMeta,
  FileStorageBucket,
  FileStorageGetResult,
  FileStoragePort,
  FileStoragePresignGetInput,
  FileStoragePresignPutInput,
  FileStoragePutInput,
  PresignedUrl,
} from '@b2b-saas-starter-kit/platform'
import {ObjectKey} from '@b2b-saas-starter-kit/platform'

import type {InMemoryFileObject} from './in-memory-file-storage.types'

/**
 * Process-local {@link FileStoragePort}. Local boot and tests until an S3-compatible adapter exists.
 */
@Injectable()
export class InMemoryFileStorage implements FileStoragePort {
  readonly #objects = new Map<string, InMemoryFileObject>()

  get entries(): readonly InMemoryFileObject[] {
    return [...this.#objects.values()].map((entry) => ({
      bucket: entry.bucket,
      key: entry.key,
      contentType: entry.contentType,
      body: new Uint8Array(entry.body),
    }))
  }

  put(input: FileStoragePutInput): Promise<FileObjectMeta> {
    return Promise.resolve().then(() => {
      ObjectKey.assert(input.key)

      const body = new Uint8Array(input.body)

      this.#objects.set(this.#slot(input.bucket, input.key), {
        bucket: input.bucket,
        key: input.key,
        contentType: input.contentType,
        body,
      })

      return {key: input.key, contentType: input.contentType, sizeBytes: body.byteLength}
    })
  }

  head(bucket: FileStorageBucket, key: string): Promise<FileObjectMeta | null> {
    return Promise.resolve().then(() => {
      ObjectKey.assert(key)

      const stored = this.#objects.get(this.#slot(bucket, key))

      if (stored === undefined) {
        return null
      }

      return {key: stored.key, contentType: stored.contentType, sizeBytes: stored.body.byteLength}
    })
  }

  get(bucket: FileStorageBucket, key: string): Promise<FileStorageGetResult | null> {
    return Promise.resolve().then(() => {
      ObjectKey.assert(key)

      const stored = this.#objects.get(this.#slot(bucket, key))

      if (stored === undefined) {
        return null
      }

      const body = new Uint8Array(stored.body)

      return {
        meta: {key: stored.key, contentType: stored.contentType, sizeBytes: body.byteLength},
        body,
      }
    })
  }

  delete(bucket: FileStorageBucket, key: string): Promise<void> {
    return Promise.resolve().then(() => {
      ObjectKey.assert(key)

      this.#objects.delete(this.#slot(bucket, key))
    })
  }

  presignPut(input: FileStoragePresignPutInput): Promise<PresignedUrl> {
    return Promise.resolve().then(() => {
      ObjectKey.assert(input.key)

      const headers: Record<string, string> = {'Content-Type': input.contentType}

      if (input.maxBytes !== undefined) {
        headers['Content-Length'] = String(input.maxBytes)
      }

      return {
        url: this.#memoryUrl(input.bucket, input.key),
        method: 'PUT' as const,
        headers,
        expiresAt: this.#expiresAt(input.expiresInSeconds),
      }
    })
  }

  presignGet(input: FileStoragePresignGetInput): Promise<PresignedUrl> {
    return Promise.resolve().then(() => {
      ObjectKey.assert(input.key)

      return {
        url: this.#memoryUrl(input.bucket, input.key),
        method: 'GET' as const,
        headers: {},
        expiresAt: this.#expiresAt(input.expiresInSeconds),
      }
    })
  }

  #slot(bucket: FileStorageBucket, key: string): string {
    return `${bucket}:${key}`
  }

  #memoryUrl(bucket: FileStorageBucket, key: string): string {
    return `memory://${bucket}/${key}`
  }

  #expiresAt(expiresInSeconds: number): Date {
    return DateUtils.fromUnixMs(Date.now() + DateUtils.secToMs(expiresInSeconds))
  }
}
