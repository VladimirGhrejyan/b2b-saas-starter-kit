import {MockAgent} from 'undici'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {
  HttpResponseTooLargeError,
  HttpTimeoutError,
  type Logger,
  LoggerLocator,
  RequestContextLocator,
} from '@b2b-saas-starter-kit/platform'

import {httpClientConfigSchema} from './kernel/config/http-client-config'
import {UndiciHttpClient} from './http-client.adapter'

const origin = 'https://api.example.com'

const silentLogger: Logger = {
  context: () => silentLogger,
  trace: () => undefined,
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  fatal: () => undefined,
}

describe('UndiciHttpClient', () => {
  let mockAgent: MockAgent
  let client: UndiciHttpClient

  beforeEach(() => {
    LoggerLocator.init(silentLogger)
    mockAgent = new MockAgent()
    mockAgent.disableNetConnect()
    client = new UndiciHttpClient(mockAgent, httpClientConfigSchema.parse({}))
  })

  afterEach(async () => {
    LoggerLocator.reset()
    await mockAgent.close()
  })

  it('returns 2xx JSON without throwing', async () => {
    mockAgent
      .get(origin)
      .intercept({path: '/ok', method: 'GET'})
      .reply(200, {ok: true}, {headers: {'content-type': 'application/json'}})

    const response = await client.request({method: 'GET', url: `${origin}/ok`})

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ok: true})
  })

  it('returns 4xx without throwing', async () => {
    mockAgent
      .get(origin)
      .intercept({path: '/missing', method: 'GET'})
      .reply(404, {error: 'gone'}, {headers: {'content-type': 'application/json'}})

    const response = await client.request({method: 'GET', url: `${origin}/missing`})

    expect(response.status).toBe(404)
    expect(response.body).toEqual({error: 'gone'})
  })

  it('throws HttpTimeoutError when the overall deadline elapses', async () => {
    mockAgent.get(origin).intercept({path: '/slow', method: 'GET'}).reply(200, 'ok').delay(200)

    await expect(
      client.request({
        method: 'GET',
        url: `${origin}/slow`,
        timeoutMs: 20,
        retry: {maxRetries: 0, retryOn: [], backoffMs: {min: 0, max: 0}},
      }),
    ).rejects.toBeInstanceOf(HttpTimeoutError)
  })

  it('retries GET once on 503', async () => {
    const pool = mockAgent.get(origin)

    pool.intercept({path: '/flaky', method: 'GET'}).reply(503, 'unavailable')
    pool
      .intercept({path: '/flaky', method: 'GET'})
      .reply(200, {ok: true}, {headers: {'content-type': 'application/json'}})

    const response = await client.request({
      method: 'GET',
      url: `${origin}/flaky`,
      retry: {maxRetries: 1, retryOn: ['GET', '503'], backoffMs: {min: 1, max: 1}},
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ok: true})
  })

  it('does not retry POST on 503', async () => {
    mockAgent.get(origin).intercept({path: '/write', method: 'POST'}).reply(503, 'unavailable')

    const response = await client.request({
      method: 'POST',
      url: `${origin}/write`,
      body: {n: 1},
    })

    expect(response.status).toBe(503)
  })

  it('throws when the response exceeds the size cap', async () => {
    const capped = new UndiciHttpClient(mockAgent, httpClientConfigSchema.parse({HTTP_CLIENT_MAX_RESPONSE_BYTES: 8}))

    mockAgent.get(origin).intercept({path: '/big', method: 'GET'}).reply(200, '0123456789')

    await expect(capped.request({method: 'GET', url: `${origin}/big`})).rejects.toBeInstanceOf(
      HttpResponseTooLargeError,
    )
  })

  it('sets x-request-id when RequestContextLocator has a context', async () => {
    mockAgent
      .get(origin)
      .intercept({
        path: '/ping',
        method: 'GET',
        headers: (headers) => headers['x-request-id'] === 'req-1',
      })
      .reply(200, 'ok')

    const response = await RequestContextLocator.run({requestId: 'req-1'}, () =>
      client.request({method: 'GET', url: `${origin}/ping`}),
    )

    expect(response.status).toBe(200)
  })
})
