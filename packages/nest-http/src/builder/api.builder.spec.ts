import type {INestApplication} from '@nestjs/common'
import {RequestMethod, VersioningType} from '@nestjs/common'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import {FakeLogger} from '../testing/fake-logger'

import {ApiBuilder} from './api.builder'
import type {ApiHttpConfig} from './api-http-config.types'

function createConfig(overrides: Partial<ApiHttpConfig> = {}): ApiHttpConfig {
  return {
    title: 'Test API',
    port: 3000,
    isProduction: false,
    corsOrigins: ['http://localhost:4200'],
    ...overrides,
  }
}

function createApp() {
  return {
    use: vi.fn(),
    enableCors: vi.fn(),
    enableVersioning: vi.fn(),
    setGlobalPrefix: vi.fn(),
    enableShutdownHooks: vi.fn(),
    listen: vi.fn().mockResolvedValue(undefined),
  }
}

describe('ApiBuilder', () => {
  afterEach(() => {
    LoggerLocator.reset()
  })

  it('throws when enabling CORS in production with empty origins', () => {
    const app = createApp()
    const builder = new ApiBuilder(
      app as unknown as INestApplication,
      createConfig({isProduction: true, corsOrigins: []}),
    )

    expect(() => builder.enableCors()).toThrow(/CORS origins must be configured/)
    expect(app.enableCors).not.toHaveBeenCalled()
  })

  it('enables listed CORS origins', () => {
    const app = createApp()
    const origins = ['https://app.example.com']
    const builder = new ApiBuilder(
      app as unknown as INestApplication,
      createConfig({corsOrigins: origins, corsCredentials: true}),
    )

    builder.enableCors()

    expect(app.enableCors).toHaveBeenCalledWith({origin: origins, credentials: true})
  })

  it('enables URI versioning with default 1', () => {
    const app = createApp()
    const builder = new ApiBuilder(app as unknown as INestApplication, createConfig())

    builder.enableVersioning()

    expect(app.enableVersioning).toHaveBeenCalledWith({type: VersioningType.URI, defaultVersion: '1'})
  })

  it('excludes health probes from the global prefix', () => {
    const app = createApp()
    const builder = new ApiBuilder(app as unknown as INestApplication, createConfig({globalPrefix: 'api'}))

    builder.useGlobalPrefix()

    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api', {
      exclude: [
        {path: 'live', method: RequestMethod.GET},
        {path: 'ready', method: RequestMethod.GET},
        {path: 'health', method: RequestMethod.GET},
      ],
    })
  })

  it('skips helmet when isPlainHttp is true', () => {
    LoggerLocator.init(new FakeLogger())
    const app = createApp()
    const builder = new ApiBuilder(app as unknown as INestApplication, createConfig({isPlainHttp: true}))

    builder.useSecurity()

    expect(app.use).not.toHaveBeenCalled()
  })
})
