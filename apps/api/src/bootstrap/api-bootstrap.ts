import type {INestApplication} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'

import {AppConfigFiles} from '@b2b-saas-starter-kit/config'

import {LoggerLocator, PinoLogger, registerProcessErrorHandlers} from '@b2b-saas-starter-kit/logger'
import {mapTelemetryConfig, startTelemetry, type TelemetryHandle} from '@b2b-saas-starter-kit/telemetry'

import {ApiBuilder} from '@b2b-saas-starter-kit/nest-http'

import {assertAuthBootstrap} from '../common/auth/jwt/assert-auth-bootstrap'
import type {ApiConfig} from '../common/config/api-config.schema'
import {loadApiConfig} from '../common/config/load-api-config'
import {mapApiHttpConfig} from '../common/config/map-api-http-config'

export class ApiBootstrap {
  static async run(configDirectory: string): Promise<void> {
    const config = ApiBootstrap.loadConfig(configDirectory)

    ApiBootstrap.assertAuth(config)

    const telemetry = await ApiBootstrap.startTelemetry(config)

    ApiBootstrap.initLogger(config)
    registerProcessErrorHandlers()

    const app = await ApiBootstrap.createHttpApp(config)

    await ApiBootstrap.listen(app, config)

    ApiBootstrap.attachShutdown(async () => {
      await app.close()
      await telemetry.shutdown()
    })
  }

  private static loadConfig(configDirectory: string): ApiConfig {
    return loadApiConfig(AppConfigFiles.resolveDirectory(configDirectory))
  }

  private static assertAuth(config: ApiConfig): void {
    assertAuthBootstrap({
      nodeEnv: config.nodeEnv,
      appEnv: config.appEnv,
      jwtAccessSecret: config.jwt.accessSecret,
      corsOrigins: config.http.cors.origins,
    })
  }

  private static async startTelemetry(config: ApiConfig): Promise<TelemetryHandle> {
    return startTelemetry(
      mapTelemetryConfig({
        enabled: config.telemetry.enabled,
        otlpEndpoint: config.telemetry.otlpEndpoint,
        serviceName: config.telemetry.serviceName,
        appType: config.appType,
      }),
    )
  }

  private static initLogger(config: ApiConfig): void {
    LoggerLocator.init(
      new PinoLogger({
        level: config.log.level,
        isPretty: config.log.pretty ?? config.nodeEnv === 'development',
      }),
    )
  }

  private static async createHttpApp(config: ApiConfig): Promise<INestApplication> {
    const {AppModule} = await import('../app/app.module.js')

    return NestFactory.create(AppModule.forRoot(config))
  }

  private static async listen(app: INestApplication, config: ApiConfig): Promise<void> {
    await new ApiBuilder(app, mapApiHttpConfig(config))
      .useSecurity()
      .useCookies()
      .enableCors()
      .enableVersioning()
      .useGlobalPrefix()
      .enableShutdownHooks()
      .setupSwagger()
      .listen()
  }

  private static attachShutdown(onShutdown: () => Promise<void>): void {
    const shutdown = () => {
      void onShutdown()
    }

    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)
  }
}
