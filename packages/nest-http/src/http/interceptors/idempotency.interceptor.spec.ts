import type {CallHandler, ExecutionContext} from '@nestjs/common'
import type {Reflector} from '@nestjs/core'
import {firstValueFrom, of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import type {IdempotencyPort, TxContext, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {
  IdempotencyClaimKind,
  IdempotencyInProgressError,
  IdempotencyKeyRequiredError,
  IdempotencyKeyReusedError,
  IdempotencyScopeUnavailableError,
  RequestContextLocator,
} from '@b2b-saas-starter-kit/platform'

import {IdempotencyInterceptor} from './idempotency.interceptor'
import type {IdempotencyIncomingRequest, IdempotencyOutgoingResponse} from './idempotency.interceptor.types'

describe('IdempotencyInterceptor', () => {
  it('passes through when the route is not marked @Idempotent()', async () => {
    const next = {handle: vi.fn(() => of('ok'))}
    const interceptor = createInterceptor({enabled: false})

    await expect(
      firstValueFrom(interceptor.intercept(createContext(createRequest({}), createResponse()), next as CallHandler)),
    ).resolves.toBe('ok')
  })

  it('requires Idempotency-Key on marked routes', async () => {
    const interceptor = createInterceptor({enabled: true})

    await expect(
      firstValueFrom(
        interceptor.intercept(createContext(createRequest({headers: {}}), createResponse()), createNext()),
      ),
    ).rejects.toBeInstanceOf(IdempotencyKeyRequiredError)
  })

  it('rejects a key with control characters', async () => {
    const interceptor = createInterceptor({enabled: true})

    await expect(
      firstValueFrom(
        interceptor.intercept(
          createContext(createRequest({headers: {'idempotency-key': 'bad\nkey'}}), createResponse()),
          createNext(),
        ),
      ),
    ).rejects.toBeInstanceOf(IdempotencyKeyRequiredError)
  })

  it('requires an actor or tenant scope', async () => {
    const interceptor = createInterceptor({enabled: true})

    await expect(
      RequestContextLocator.run({requestId: 'req-1'}, () =>
        firstValueFrom(
          interceptor.intercept(
            createContext(createRequest({headers: {'idempotency-key': 'key-1'}}), createResponse()),
            createNext(),
          ),
        ),
      ),
    ).rejects.toBeInstanceOf(IdempotencyScopeUnavailableError)
  })

  it('replays a completed response', async () => {
    const idempotency = createStore({
      claim: async () => ({kind: IdempotencyClaimKind.Replay, statusCode: 201, body: {id: 't1'}}),
    })
    const interceptor = createInterceptor({enabled: true, idempotency})
    const response = createResponse()

    const result = await RequestContextLocator.run({requestId: 'req-1', actorId: 'user-1'}, () =>
      firstValueFrom(
        interceptor.intercept(
          createContext(createRequest({headers: {'idempotency-key': 'key-1'}, body: {name: 'Acme'}}), response),
          createNext(),
        ),
      ),
    )

    expect(result).toEqual({id: 't1'})
    expect(response.statusCode).toBe(201)
  })

  it('claims, runs the handler, and completes', async () => {
    const complete = vi.fn(async () => undefined)
    const idempotency = createStore({
      claim: async () => ({kind: IdempotencyClaimKind.Acquired}),
      complete,
    })
    const interceptor = createInterceptor({enabled: true, idempotency, httpCode: 201})
    const next = {handle: vi.fn(() => of({id: 't1'}))}

    const result = await RequestContextLocator.run({requestId: 'req-1', actorId: 'user-1'}, () =>
      firstValueFrom(
        interceptor.intercept(
          createContext(createRequest({headers: {'idempotency-key': 'key-1'}, body: {name: 'Acme'}}), createResponse()),
          next as CallHandler,
        ),
      ),
    )

    expect(result).toEqual({id: 't1'})
    expect(complete).toHaveBeenCalledWith({
      scope: 'u:user-1',
      endpoint: 'POST /tenants',
      key: 'key-1',
      statusCode: 201,
      body: {id: 't1'},
    })
  })

  it('scopes tenant-bound requests by tenant id', async () => {
    const claim = vi.fn(async () => ({kind: IdempotencyClaimKind.Acquired}))
    const interceptor = createInterceptor({
      enabled: true,
      idempotency: createStore({claim, complete: async () => undefined}),
    })

    await RequestContextLocator.run({requestId: 'req-1', actorId: 'user-1', tenantId: 'tenant-1'}, () =>
      firstValueFrom(
        interceptor.intercept(
          createContext(createRequest({headers: {'idempotency-key': 'key-1'}, body: {name: 'Role'}}), createResponse()),
          {handle: () => of({id: 'role-1'})} as CallHandler,
        ),
      ),
    )

    expect(claim).toHaveBeenCalledWith(expect.objectContaining({scope: 't:tenant-1'}))
  })

  it('maps in-flight and fingerprint mismatch claims to errors', async () => {
    const inFlight = createInterceptor({
      enabled: true,
      idempotency: createStore({claim: async () => ({kind: IdempotencyClaimKind.InFlight})}),
    })
    const reused = createInterceptor({
      enabled: true,
      idempotency: createStore({claim: async () => ({kind: IdempotencyClaimKind.FingerprintMismatch})}),
    })

    await expect(
      RequestContextLocator.run({requestId: 'req-1', actorId: 'user-1'}, () =>
        firstValueFrom(
          inFlight.intercept(
            createContext(createRequest({headers: {'idempotency-key': 'key-1'}}), createResponse()),
            createNext(),
          ),
        ),
      ),
    ).rejects.toBeInstanceOf(IdempotencyInProgressError)

    await expect(
      RequestContextLocator.run({requestId: 'req-1', actorId: 'user-1'}, () =>
        firstValueFrom(
          reused.intercept(
            createContext(createRequest({headers: {'idempotency-key': 'key-1'}}), createResponse()),
            createNext(),
          ),
        ),
      ),
    ).rejects.toBeInstanceOf(IdempotencyKeyReusedError)
  })
})

function createInterceptor(options: {
  enabled: boolean
  idempotency?: IdempotencyPort
  httpCode?: number
}): IdempotencyInterceptor {
  const reflector = {
    getAllAndOverride: () => (options.enabled ? true : undefined),
    get: () => options.httpCode,
  } as unknown as Reflector

  const unitOfWork: UnitOfWork = {
    run: async <T>(work: (ctx: TxContext) => Promise<T>): Promise<T> => work({id: 'tx-1'}),
  }

  return new IdempotencyInterceptor(reflector, options.idempotency ?? createStore(), unitOfWork, {
    now: () => new Date('2026-01-01T00:00:00.000Z'),
  })
}

function createStore(overrides: Partial<IdempotencyPort> = {}): IdempotencyPort {
  return {
    claim: async () => ({kind: IdempotencyClaimKind.Acquired}),
    complete: async () => undefined,
    ...overrides,
  }
}

function createNext(): CallHandler {
  return {handle: () => of({ok: true})}
}

function createContext(request: IdempotencyIncomingRequest, response: IdempotencyOutgoingResponse): ExecutionContext {
  return {
    getHandler: () => Function,
    getClass: () => Function,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext
}

function createRequest(
  input: Partial<IdempotencyIncomingRequest> & {headers?: IdempotencyIncomingRequest['headers']},
): IdempotencyIncomingRequest {
  return {
    method: 'POST',
    url: '/v1/tenants',
    headers: input.headers ?? {},
    body: input.body,
    route: {path: '/tenants'},
  }
}

function createResponse(): IdempotencyOutgoingResponse {
  const response: IdempotencyOutgoingResponse = {
    statusCode: 200,
    status(code: number) {
      response.statusCode = code

      return response
    },
  }

  return response
}
