import type {CallHandler, ExecutionContext} from '@nestjs/common'
import {Reflector} from '@nestjs/core'
import {firstValueFrom, of} from 'rxjs'
import {afterEach, describe, expect, it} from 'vitest'

import {RateLimitExceededError} from '@b2b-saas-starter-kit/platform'

import {LoggerLocator, PinoLogger} from '@b2b-saas-starter-kit/logger'

import {InMemoryRateLimiter} from '@b2b-saas-starter-kit/composition/testing'

import {RateLimit} from './rate-limit.decorator'
import {RateLimitInterceptor} from './rate-limit.interceptor'

class LimitedProbe {
  @RateLimit({bucket: 'login', limit: 1, windowSeconds: 60})
  login() {
    return 'ok'
  }
}

class OpenProbe {
  open() {
    return 'ok'
  }
}

describe('RateLimitInterceptor', () => {
  afterEach(() => {
    LoggerLocator.reset()
  })

  it('allows the first consume and throws on the second', async () => {
    const interceptor = new RateLimitInterceptor(new Reflector(), new InMemoryRateLimiter())
    const next: CallHandler = {handle: () => of('ok')}

    await expect(
      firstValueFrom(interceptor.intercept(createContext(LimitedProbe.prototype.login, {ip: '127.0.0.1'}), next)),
    ).resolves.toBe('ok')

    await expect(
      firstValueFrom(interceptor.intercept(createContext(LimitedProbe.prototype.login, {ip: '127.0.0.1'}), next)),
    ).rejects.toBeInstanceOf(RateLimitExceededError)
  })

  it('skips handlers without @RateLimit', async () => {
    const interceptor = new RateLimitInterceptor(new Reflector(), new InMemoryRateLimiter())
    const next: CallHandler = {handle: () => of('ok')}

    await expect(
      firstValueFrom(interceptor.intercept(createContext(OpenProbe.prototype.open, {ip: '127.0.0.1'}), next)),
    ).resolves.toBe('ok')
  })

  it('fails open when the limiter throws', async () => {
    LoggerLocator.init(new PinoLogger({level: 'error', isPretty: false}))

    const interceptor = new RateLimitInterceptor(new Reflector(), {
      consume: () => Promise.reject(new Error('redis down')),
    })
    const next: CallHandler = {handle: () => of('ok')}

    await expect(
      firstValueFrom(interceptor.intercept(createContext(LimitedProbe.prototype.login, {ip: '127.0.0.1'}), next)),
    ).resolves.toBe('ok')
  })
})

function createContext(handler: () => string, request: {ip: string}): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => Object,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext
}
