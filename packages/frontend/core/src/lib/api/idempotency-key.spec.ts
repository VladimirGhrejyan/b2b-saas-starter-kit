import type {FetchArgs} from '@reduxjs/toolkit/query'
import {describe, expect, it} from 'vitest'

import {IdempotencyKey} from './idempotency-key'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

describe('IdempotencyKey', () => {
  it('returns args unchanged when the endpoint is not marked idempotent', () => {
    const args: FetchArgs = {url: '/tenants', method: 'POST'}

    expect(IdempotencyKey.apply('/probe', undefined)).toBe('/probe')
    expect(IdempotencyKey.apply(args, {})).toBe(args)
    expect(IdempotencyKey.apply(args, {idempotent: false})).toBe(args)
  })

  it('adds a UUID Idempotency-Key when opted in', () => {
    const request = IdempotencyKey.apply({url: '/tenants', method: 'POST'}, {idempotent: true})

    expect(typeof request).toBe('object')
    expect(header(request).get(IdempotencyKey.header)).toMatch(uuidPattern)
  })

  it('normalizes a string url to FetchArgs when opted in', () => {
    const request = IdempotencyKey.apply('/tenants', {idempotent: true})

    expect(typeof request).not.toBe('string')
    expect(header(request).get(IdempotencyKey.header)).toMatch(uuidPattern)
  })

  it('preserves a caller-supplied Idempotency-Key', () => {
    const request = IdempotencyKey.apply(
      {
        url: '/tenants',
        method: 'POST',
        headers: {'idempotency-key': 'stable-key'},
      },
      {idempotent: true},
    )

    expect(header(request).get(IdempotencyKey.header)).toBe('stable-key')
  })
})

function header(args: string | FetchArgs): Headers {
  if (typeof args === 'string') {
    return new Headers()
  }

  return new Headers(args.headers as HeadersInit | undefined)
}
