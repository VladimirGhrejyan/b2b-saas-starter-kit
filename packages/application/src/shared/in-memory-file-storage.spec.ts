import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {DateUtils} from '@b2b-saas-starter-kit/utils'

import {FileStorageBucket, InvalidObjectKeyError, ObjectKey} from '@b2b-saas-starter-kit/platform'

import {InMemoryFileStorage} from './in-memory-file-storage'

const TENANT = TenantId.parse('33333333-3333-4333-8333-333333333333')
const AT = new Date('2026-09-21T12:00:00.000Z')
const OBJECT_ID = '01996a2e-7c3a-7c3a-8c3a-7c3a7c3a7c3a'

describe('InMemoryFileStorage', () => {
  const key = ObjectKey.tenant(TENANT, 'avatar', OBJECT_ID, AT)
  const body = new Uint8Array([1, 2, 3])

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(AT)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('round-trips put/get and copies bytes', async () => {
    const storage = new InMemoryFileStorage()
    const mutable = new Uint8Array(body)

    await storage.put({
      bucket: FileStorageBucket.private,
      key,
      contentType: 'image/png',
      body: mutable,
    })

    mutable[0] = 9

    const got = await storage.get(FileStorageBucket.private, key)

    expect(got).toEqual({
      meta: {key, contentType: 'image/png', sizeBytes: 3},
      body,
    })
    expect(got?.body).not.toBe(mutable)

    const listed = storage.entries[0]?.body ?? new Uint8Array()

    listed[0] = 8
    expect((await storage.get(FileStorageBucket.private, key))?.body).toEqual(body)
  })

  it('isolates the same key across buckets and returns null when missing', async () => {
    const storage = new InMemoryFileStorage()

    await storage.put({
      bucket: FileStorageBucket.private,
      key,
      contentType: 'image/png',
      body,
    })

    expect(await storage.head(FileStorageBucket.public, key)).toBeNull()
    expect(await storage.get(FileStorageBucket.public, key)).toBeNull()

    await storage.delete(FileStorageBucket.private, key)
    await storage.delete(FileStorageBucket.private, key)

    expect(await storage.head(FileStorageBucket.private, key)).toBeNull()
    expect(storage.entries).toEqual([])
  })

  it('rejects malformed keys', async () => {
    const storage = new InMemoryFileStorage()

    await expect(
      storage.put({
        bucket: FileStorageBucket.private,
        key: 'not-a-key',
        contentType: 'text/plain',
        body,
      }),
    ).rejects.toBeInstanceOf(InvalidObjectKeyError)
  })

  it('returns memory: presign URLs with optional Content-Length', async () => {
    const storage = new InMemoryFileStorage()
    const expiresInSeconds = 60

    await expect(
      storage.presignPut({
        bucket: FileStorageBucket.public,
        key,
        contentType: 'image/webp',
        maxBytes: 2048,
        expiresInSeconds,
      }),
    ).resolves.toEqual({
      url: `memory://public/${key}`,
      method: 'PUT',
      headers: {'Content-Type': 'image/webp', 'Content-Length': '2048'},
      expiresAt: DateUtils.fromUnixMs(AT.getTime() + DateUtils.secToMs(expiresInSeconds)),
    })

    await expect(storage.presignGet({bucket: FileStorageBucket.private, key, expiresInSeconds})).resolves.toMatchObject(
      {url: `memory://private/${key}`, method: 'GET', headers: {}},
    )
  })
})
