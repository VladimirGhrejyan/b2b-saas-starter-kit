import type {CallHandler, ExecutionContext} from '@nestjs/common'
import {firstValueFrom, of} from 'rxjs'
import {afterEach, describe, expect, it} from 'vitest'

import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import {FakeLogger} from '../../testing/fake-logger'

import {REQUEST_ID_RESPONSE_HEADER} from './http-request.constants'
import {HttpRequestInterceptor} from './http-request.interceptor'
import type {HttpIncomingRequest, HttpOutgoingResponse} from './http-request.interceptor.types'

describe('HttpRequestInterceptor', () => {
  afterEach(() => {
    LoggerLocator.reset()
  })

  it('echoes x-request-id and logs info on success', async () => {
    const logger = new FakeLogger()

    LoggerLocator.init(logger)

    const {request, response, finish} = createHttp({
      method: 'GET',
      url: '/v1/me',
      headers: {'x-request-id': 'req-fixed'},
      routePath: '/v1/me',
      statusCode: 200,
    })

    await firstValueFrom(new HttpRequestInterceptor().intercept(createContext(request, response), createNext()))
    finish()

    expect(response.headers[REQUEST_ID_RESPONSE_HEADER]).toBe('req-fixed')
    expect(logger.records).toEqual([
      {
        level: 'info',
        dataOrMessage: {
          method: 'GET',
          route: '/v1/me',
          statusCode: 200,
          durationMs: expect.any(Number),
          requestId: 'req-fixed',
        },
        message: 'request completed',
      },
    ])
  })

  it('generates a request id when the header is missing', async () => {
    const logger = new FakeLogger()

    LoggerLocator.init(logger)

    const {request, response, finish} = createHttp({method: 'POST', url: '/v1/users', headers: {}})

    await firstValueFrom(new HttpRequestInterceptor().intercept(createContext(request, response), createNext()))
    finish()

    const requestId = response.headers[REQUEST_ID_RESPONSE_HEADER]

    expect(requestId).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/i))
    expect(logger.records[0]?.dataOrMessage).toMatchObject({requestId})
  })

  it('logs warn for 4xx and error for 5xx', async () => {
    const logger = new FakeLogger()

    LoggerLocator.init(logger)

    const clientError = createHttp({method: 'GET', url: '/v1/tenants', headers: {}, statusCode: 401})

    await firstValueFrom(
      new HttpRequestInterceptor().intercept(createContext(clientError.request, clientError.response), createNext()),
    )
    clientError.finish()

    const serverError = createHttp({method: 'GET', url: '/v1/tenants', headers: {}, statusCode: 500})

    await firstValueFrom(
      new HttpRequestInterceptor().intercept(createContext(serverError.request, serverError.response), createNext()),
    )
    serverError.finish()

    expect(logger.records.map((record) => record.level)).toEqual(['warn', 'error'])
  })

  it('skips swagger paths', async () => {
    const logger = new FakeLogger()

    LoggerLocator.init(logger)

    const {request, response, finish} = createHttp({method: 'GET', url: '/docs', headers: {}})

    await firstValueFrom(new HttpRequestInterceptor().intercept(createContext(request, response), createNext()))
    finish()

    expect(response.headers[REQUEST_ID_RESPONSE_HEADER]).toBeUndefined()
    expect(logger.records).toEqual([])
  })
})

function createNext(): CallHandler {
  return {handle: () => of(undefined)}
}

function createContext(request: HttpIncomingRequest, response: HttpOutgoingResponse): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as ExecutionContext
}

function createHttp(input: {
  method: string
  url: string
  headers: HttpIncomingRequest['headers']
  routePath?: string
  statusCode?: number
}): {
  request: HttpIncomingRequest
  response: HttpOutgoingResponse & {headers: Record<string, string>}
  finish: () => void
} {
  const listeners: Array<() => void> = []
  const responseHeaders: Record<string, string> = {}
  const response: HttpOutgoingResponse & {headers: Record<string, string>} = {
    statusCode: input.statusCode ?? 200,
    headers: responseHeaders,
    setHeader(name: string, value: string) {
      responseHeaders[name] = value
    },
    once(event: 'finish', listener: () => void) {
      if (event === 'finish') {
        listeners.push(listener)
      }
    },
  }

  return {
    request: {
      method: input.method,
      url: input.url,
      originalUrl: input.url,
      headers: input.headers,
      route: input.routePath === undefined ? undefined : {path: input.routePath},
    },
    response,
    finish: () => {
      for (const listener of listeners) {
        listener()
      }
    },
  }
}
