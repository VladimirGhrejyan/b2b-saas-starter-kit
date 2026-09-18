import {createHash} from 'node:crypto'

import {describe, expect, it} from 'vitest'

import {IdempotencyFingerprint} from './idempotency-fingerprint'

describe('IdempotencyFingerprint', () => {
  it('hashes method, path, and body', () => {
    const expected = createHash('sha256').update('POST\n/tenants\n{"name":"Acme"}').digest('hex')

    expect(IdempotencyFingerprint.hash('POST', '/tenants', {name: 'Acme'})).toBe(expected)
  })

  it('treats missing body as null', () => {
    const expected = createHash('sha256').update('POST\n/tenants\nnull').digest('hex')

    expect(IdempotencyFingerprint.hash('POST', '/tenants', undefined)).toBe(expected)
  })
})
