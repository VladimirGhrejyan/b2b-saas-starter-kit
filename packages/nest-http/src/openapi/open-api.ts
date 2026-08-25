import {timingSafeEqual} from 'node:crypto'
import {existsSync, mkdirSync, writeFileSync} from 'node:fs'
import {dirname, isAbsolute, join} from 'node:path'
import {cwd} from 'node:process'

import type {INestApplication} from '@nestjs/common'
import type {OpenAPIObject} from '@nestjs/swagger'
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger'
import {cleanupOpenApiDoc} from 'nestjs-zod'

import type {ApiHttpConfig, ApiSwaggerBasicAuth} from '../builder/api-http-config.types'

export class OpenApi {
  static setup(app: INestApplication, config: ApiHttpConfig): void {
    const swagger = config.swagger

    if (!swagger?.enabled) {
      return
    }

    const path = swagger.path ?? '/docs'

    OpenApi.#applyBasicAuth(app, path, swagger.basicAuth)

    const document = OpenApi.#createDocument(app, config)

    SwaggerModule.setup(path, app, document, {
      swaggerOptions: {
        persistAuthorization: swagger.persistAuthorization ?? true,
      },
    })

    OpenApi.#writeSchema(document, config)
  }

  static #createDocument(app: INestApplication, config: ApiHttpConfig): OpenAPIObject {
    const swagger = config.swagger
    const builder = new DocumentBuilder().setTitle(config.title).setVersion(config.version ?? '1')

    if (swagger?.description) {
      builder.setDescription(swagger.description)
    }

    if (swagger?.bearerAuth !== false) {
      builder.addBearerAuth()
    }

    return cleanupOpenApiDoc(SwaggerModule.createDocument(app, builder.build()))
  }

  static #writeSchema(document: OpenAPIObject, config: ApiHttpConfig): void {
    const outputPath = OpenApi.#schemaOutputPath(config)

    if (outputPath === undefined) {
      return
    }

    const outputDirectory = dirname(outputPath)

    if (!existsSync(outputDirectory)) {
      mkdirSync(outputDirectory, {recursive: true})
    }

    writeFileSync(outputPath, JSON.stringify(document, null, 2))
  }

  static #schemaOutputPath(config: ApiHttpConfig): string | undefined {
    const schema = config.swagger?.schema
    const filename = schema?.filename ?? 'openapi.json'

    if (schema?.outputDirectory) {
      return join(OpenApi.#absolutePath(schema.outputDirectory), filename)
    }

    if (config.staticAssets) {
      return join(OpenApi.#absolutePath(config.staticAssets.rootPath), schema?.relativePath ?? '', filename)
    }

    if (schema) {
      throw new Error('OpenAPI schema output requires swagger.schema.outputDirectory or staticAssets.rootPath')
    }

    return undefined
  }

  static #absolutePath(path: string): string {
    return isAbsolute(path) ? path : join(cwd(), path)
  }

  static #applyBasicAuth(app: INestApplication, path: string, credentials: ApiSwaggerBasicAuth | undefined): void {
    if (!credentials) {
      return
    }

    const middleware = (
      request: {headers: {authorization?: string}},
      response: {setHeader: (name: string, value: string) => void; statusCode: number; end: () => void},
      next: () => void,
    ) => {
      if (OpenApi.#isAuthorized(request.headers.authorization, credentials)) {
        next()

        return
      }

      response.setHeader('WWW-Authenticate', 'Basic realm="Swagger"')
      response.statusCode = 401
      response.end()
    }

    app.use(path, middleware)
    app.use(`${path}-json`, middleware)
    app.use(`${path}-yaml`, middleware)
  }

  static #isAuthorized(header: string | undefined, credentials: ApiSwaggerBasicAuth): boolean {
    if (header === undefined || !header.startsWith('Basic ')) {
      return false
    }

    const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8')
    const separator = decoded.indexOf(':')

    if (separator < 0) {
      return false
    }

    return (
      OpenApi.#equalUtf8(decoded.slice(0, separator), credentials.username) &&
      OpenApi.#equalUtf8(decoded.slice(separator + 1), credentials.password)
    )
  }

  static #equalUtf8(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left)
    const rightBuffer = Buffer.from(right)

    if (leftBuffer.length !== rightBuffer.length) {
      return false
    }

    return timingSafeEqual(leftBuffer, rightBuffer)
  }
}
