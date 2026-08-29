import {describe, expect, it} from 'vitest'

import type {HttpClientPort} from './http-client.port'
import type {HttpRequest, HttpResponse} from './http-client.types'

describe('HttpClientPort', () => {
  it('merges scope defaults and requires a timeout after merge', async () => {
    const calls: HttpRequest[] = []
    const client: HttpClientPort = {
      request: async (req) => {
        const timeoutMs = req.timeoutMs

        expect(timeoutMs).toBeGreaterThan(0)
        calls.push(req)

        return {status: 200, headers: {}, body: {ok: true}}
      },
      scope: (defaults) => ({
        request: async (req) =>
          client.request({
            ...req,
            url: defaults.baseUrl ? new URL(req.url, defaults.baseUrl).toString() : req.url,
            headers: {...defaults.headers, ...req.headers},
            timeoutMs: req.timeoutMs ?? defaults.timeoutMs,
          }),
        scope: client.scope,
      }),
    }

    const scoped = client.scope({
      name: 'stripe',
      baseUrl: 'https://api.stripe.com',
      headers: {authorization: 'Bearer t'},
      timeoutMs: 5_000,
    })
    const response: HttpResponse = await scoped.request({method: 'GET', url: '/v1/balance'})

    expect(response.status).toBe(200)
    expect(calls[0]?.timeoutMs).toBe(5_000)
    expect(calls[0]?.url).toBe('https://api.stripe.com/v1/balance')
    expect(calls[0]?.headers?.authorization).toBe('Bearer t')
  })
})
