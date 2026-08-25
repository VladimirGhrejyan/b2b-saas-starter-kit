import type {INestApplication} from '@nestjs/common'
import {VersioningType} from '@nestjs/common'
import helmet from 'helmet'

import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import {OpenApi} from '../openapi/open-api'

import type {ApiHttpConfig} from './api-http-config.types'

export class ApiBuilder {
  readonly #app: INestApplication

  readonly #config: ApiHttpConfig

  constructor(app: INestApplication, config: ApiHttpConfig) {
    this.#app = app
    this.#config = config
  }

  useSecurity(): this {
    if (this.#config.isPlainHttp === true) {
      this.#logger().warn('helmet disabled (plain HTTP / Swagger UI compatibility)')

      return this
    }

    this.#app.use(helmet())

    return this
  }

  enableCors(): this {
    if (this.#config.isProduction && this.#config.corsOrigins.length === 0) {
      throw new Error('CORS origins must be configured when isProduction is true')
    }

    this.#app.enableCors({
      origin: this.#config.corsOrigins,
      credentials: this.#config.corsCredentials ?? false,
    })

    return this
  }

  enableVersioning(): this {
    this.#app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: this.#config.version ?? '1',
    })

    return this
  }

  useGlobalPrefix(): this {
    const prefix = this.#config.globalPrefix

    if (!prefix) {
      return this
    }

    this.#app.setGlobalPrefix(prefix)

    return this
  }

  enableShutdownHooks(): this {
    this.#app.enableShutdownHooks()

    return this
  }

  setupSwagger(): this {
    OpenApi.setup(this.#app, this.#config)

    return this
  }

  async listen(): Promise<void> {
    const host = this.#config.host
    const port = this.#config.port

    if (host === undefined) {
      await this.#app.listen(port)
    } else {
      await this.#app.listen(port, host)
    }

    this.#logger().info(`${this.#config.title} API is running on: http://${host ?? 'localhost'}:${String(port)}`)
  }

  #logger() {
    return LoggerLocator.get().context(ApiBuilder.name)
  }
}
