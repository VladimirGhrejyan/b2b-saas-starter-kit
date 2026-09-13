import {mkdtempSync, readFileSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import type {INestApplication} from '@nestjs/common'
import {Controller, Get, Module} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'
import type {OpenAPIObject, SchemaObject} from '@nestjs/swagger'
import {SwaggerModule} from '@nestjs/swagger'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {z} from 'zod'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import type {ApiHttpConfig} from '../builder/api-http-config.types'
import {Response} from '../http/decorators/response.decorator'
import {createZodDto} from '../http/zod/create-zod-dto'

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

  it('builds a Nest 12 document through cleanupOpenApiDoc with Zod nullable spelling', async () => {
    const outputDirectory = mkdtempSync(join(tmpdir(), 'openapi-zod-'))
    const app = await NestFactory.create(OpenApiZodProbeModule, {logger: false})

    try {
      OpenApi.setup(
        app,
        createConfig({
          swagger: {
            enabled: true,
            schema: {outputDirectory, filename: 'openapi.json'},
          },
        }),
      )

      const document = JSON.parse(readFileSync(join(outputDirectory, 'openapi.json'), 'utf8')) as OpenAPIObject
      const nickname = findNicknameSchema(document)

      expect(document.openapi).toMatch(/^3\./)
      expect(document.paths?.['/probe']).toBeDefined()
      expect(nickname).toBeDefined()
      expect(isOpenApiNullableString(nickname)).toBe(true)
    } finally {
      await app.close()
      rmSync(outputDirectory, {recursive: true, force: true})
    }
  })
})

class OpenApiZodProbeOutputDto extends createZodDto(
  z.object({
    email: z.email(),
    nickname: z.string().nullable(),
  }),
) {}

@Controller('probe')
class OpenApiZodProbeController {
  @Get()
  @Response({status: HttpStatus.OK, description: 'Probe', type: OpenApiZodProbeOutputDto})
  get(): OpenApiZodProbeOutputDto {
    return {email: 'dev@example.com', nickname: null}
  }
}

@Module({controllers: [OpenApiZodProbeController]})
class OpenApiZodProbeModule {}

function findNicknameSchema(document: OpenAPIObject): SchemaObject | undefined {
  const schemas = document.components?.schemas ?? {}

  for (const schema of Object.values(schemas)) {
    if (!isSchemaObject(schema)) {
      continue
    }

    const nickname = schema.properties?.nickname

    if (isSchemaObject(nickname)) {
      return nickname
    }
  }

  return undefined
}

function isSchemaObject(value: unknown): value is SchemaObject {
  return typeof value === 'object' && value !== null && !('$ref' in value)
}

function isOpenApiNullableString(schema: SchemaObject | undefined): boolean {
  if (schema === undefined) {
    return false
  }

  if (schema.nullable === true && (schema.type === 'string' || schema.type === undefined)) {
    return true
  }

  if (Array.isArray(schema.type) && schema.type.includes('string') && schema.type.includes('null')) {
    return true
  }

  return (
    Array.isArray(schema.anyOf) &&
    schema.anyOf.some((item) => isSchemaObject(item) && item.type === 'string') &&
    schema.anyOf.some((item) => isSchemaObject(item) && item.type === 'null')
  )
}
