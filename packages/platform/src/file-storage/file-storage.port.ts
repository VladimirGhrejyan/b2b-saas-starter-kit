import type {
  FileObjectMeta,
  FileStorageBucket,
  FileStorageGetResult,
  FileStoragePresignGetInput,
  FileStoragePresignPutInput,
  FileStoragePutInput,
  PresignedUrl,
} from './file-storage.types'

/**
 * Object-storage bytes. Keys must be produced by {@link ObjectKey}; implementations
 * call {@link ObjectKey.assert} before write/presign. `head` / `get` return `null`
 * when the object is missing. `delete` is idempotent.
 */
export interface FileStoragePort {
  put(input: FileStoragePutInput): Promise<FileObjectMeta>
  head(bucket: FileStorageBucket, key: string): Promise<FileObjectMeta | null>
  get(bucket: FileStorageBucket, key: string): Promise<FileStorageGetResult | null>
  delete(bucket: FileStorageBucket, key: string): Promise<void>
  presignPut(input: FileStoragePresignPutInput): Promise<PresignedUrl>
  presignGet(input: FileStoragePresignGetInput): Promise<PresignedUrl>
}
