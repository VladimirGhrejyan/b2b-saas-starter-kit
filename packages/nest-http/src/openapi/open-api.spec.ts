import {mkdtempSync, readFileSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import type {INestApplication} from '@nestjs/common'
import type {OpenAPIObject} from '@nestjs/swagger'
import {SwaggerModule} from '@nestjs/swagger'
import {afterEach, describe, expect, it, vi} from 'vitest'

import type {ApiHttpConfig} from '../builder/api-http-config.types'

import {OpenApi} from './open-api'

function createConfig(overrides: Partial<ApiHttpConfig> = {}): ApiHttpConfig {
  return {
    title: 'Test API',
    port: 3000,
    isProduction: false,
    corsOrigins: ['http://localhost:4200'],
    ...overrides,
  }
}

describe('OpenApi', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not set up Swagger when disabled', () => {
    const setup = vi.spyOn(SwaggerModule, 'setup').mockImplementation(() => undefined)
    const app = {use: vi.fn()} as unknown as INestApplication

    OpenApi.setup(app, createConfig({swagger: {enabled: false}}))

    expect(setup).not.toHaveBeenCalled()
  })

  it('writes the OpenAPI schema and enables bearer auth persistence', () => {
    const outputDirectory = mkdtempSync(join(tmpdir(), 'openapi-'))
    const document = {
      openapi: '3.0.0',
      info: {title: 'Test API', version: '1'},
      paths: {},
    } as OpenAPIObject

    vi.spyOn(SwaggerModule, 'createDocument').mockReturnValue(document)
    const setup = vi.spyOn(SwaggerModule, 'setup').mockImplementation(() => undefined)
    const app = {use: vi.fn()} as unknown as INestApplication

    try {
      OpenApi.setup(
        app,
        createConfig({
          swagger: {
            enabled: true,
            path: '/docs',
            schema: {outputDirectory, filename: 'openapi.json'},
          },
        }),
      )

      expect(setup).toHaveBeenCalledWith(
        '/docs',
        app,
        expect.anything(),
        expect.objectContaining({swaggerOptions: {persistAuthorization: true}}),
      )
      expect(JSON.parse(readFileSync(join(outputDirectory, 'openapi.json'), 'utf8'))).toMatchObject({
        info: {title: 'Test API'},
      })
    } finally {
      rmSync(outputDirectory, {recursive: true, force: true})
    }
  })

  it('throws when schema output is requested without a directory', () => {
    vi.spyOn(SwaggerModule, 'createDocument').mockReturnValue({
      openapi: '3.0.0',
      info: {title: 'Test API', version: '1'},
      paths: {},
    })
    vi.spyOn(SwaggerModule, 'setup').mockImplementation(() => undefined)

    expect(() => {
      OpenApi.setup({use: vi.fn()} as unknown as INestApplication, createConfig({swagger: {enabled: true, schema: {}}}))
    }).toThrow(/schema output requires/)
  })
})
