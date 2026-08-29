import {describe, expect, it} from 'vitest'

import {HttpTimeoutRequiredError} from '@b2b-saas-starter-kit/platform'

import {InMemoryHttpClient} from './in-memory-http-client'

describe('InMemoryHttpClient', () => {
  it('records calls and returns a stub without throwing on 4xx', async () => {
    const client = new InMemoryHttpClient()

    client.stub('GET', 'https://api.example.com/missing', {status: 404, headers: {}, body: {error: 'gone'}})

    const response = await client.request({
      method: 'GET',
      url: 'https://api.example.com/missing',
      timeoutMs: 1_000,
    })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({error: 'gone'})
    expect(client.requests).toHaveLength(1)
  })

  it('applies scoped defaults and requires timeout after merge', async () => {
    const root = new InMemoryHttpClient()
    const scoped = root.scope({
      name: 'stripe',
      baseUrl: 'https://api.stripe.com',
      headers: {authorization: 'Bearer t'},
      timeoutMs: 5_000,
    })

    await scoped.request({method: 'GET', url: '/v1/balance'})

    expect(root.requests[0]).toMatchObject({
      url: 'https://api.stripe.com/v1/balance',
      timeoutMs: 5_000,
      headers: {authorization: 'Bearer t'},
    })
  })

  it('rejects when timeoutMs is missing on the request and scope', async () => {
    const client = new InMemoryHttpClient()

    await expect(client.request({method: 'GET', url: 'https://api.example.com'})).rejects.toBeInstanceOf(
      HttpTimeoutRequiredError,
    )
  })
})
