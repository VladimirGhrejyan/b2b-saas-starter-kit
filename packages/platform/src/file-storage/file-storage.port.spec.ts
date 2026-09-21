import {describe, expect, it} from 'vitest'

import type {FileStoragePort} from './file-storage.port'
import {FileStorageBucket} from './file-storage.types'

describe('FileStoragePort', () => {
  it('accepts an in-memory-shaped fake', async () => {
    const stored = new Map<string, Uint8Array>()
    const storage: FileStoragePort = {
      put: async ({bucket, key, contentType, body}) => {
        stored.set(`${bucket}:${key}`, body)

        return {key, contentType, sizeBytes: body.byteLength}
      },
      head: async (bucket, key) => {
        const body = stored.get(`${bucket}:${key}`)

        return body === undefined ? null : {key, contentType: 'application/octet-stream', sizeBytes: body.byteLength}
      },
      get: async (bucket, key) => {
        const body = stored.get(`${bucket}:${key}`)

        return body === undefined
          ? null
          : {meta: {key, contentType: 'application/octet-stream', sizeBytes: body.byteLength}, body}
      },
      delete: async (bucket, key) => {
        stored.delete(`${bucket}:${key}`)
      },
      presignPut: async ({key}) => ({
        url: `memory://private/${key}`,
        method: 'PUT',
        headers: {'Content-Type': 'text/plain'},
        expiresAt: new Date('2026-01-01T00:01:00.000Z'),
      }),
      presignGet: async ({key}) => ({
        url: `memory://private/${key}`,
        method: 'GET',
        headers: {},
        expiresAt: new Date('2026-01-01T00:01:00.000Z'),
      }),
    }

    const meta = await storage.put({
      bucket: FileStorageBucket.private,
      key: 'g/export/2026/01/obj-1',
      contentType: 'text/plain',
      body: new Uint8Array([1, 2, 3]),
    })

    expect(meta.sizeBytes).toBe(3)
    expect(await storage.head(FileStorageBucket.private, meta.key)).toMatchObject({sizeBytes: 3})
  })
})
