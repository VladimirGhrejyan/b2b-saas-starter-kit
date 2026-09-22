import type {INestApplicationContext} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'

import {AppConfigFiles} from '@b2b-saas-starter-kit/config'

import {LoggerLocator, PinoLogger, registerProcessErrorHandlers} from '@b2b-saas-starter-kit/logger'
import {mapTelemetryConfig, startTelemetry, type TelemetryHandle} from '@b2b-saas-starter-kit/telemetry'

import {loadWorkerConfig} from '../config/load-worker-config'
import type {WorkerConfig} from '../config/worker-config.schema'

export class WorkerBootstrap {
  static async run(configDirectory: string): Promise<void> {
    const config = WorkerBootstrap.loadConfig(configDirectory)
    const telemetry = await WorkerBootstrap.startTelemetry(config)

    WorkerBootstrap.initLogger(config)
    registerProcessErrorHandlers()

    const app = await WorkerBootstrap.createContext(config)

    app.enableShutdownHooks()

    await WorkerBootstrap.attachShutdown(async () => {
      await app.close()
      await telemetry.shutdown()
    })
  }

  private static loadConfig(configDirectory: string): WorkerConfig {
    return loadWorkerConfig(AppConfigFiles.resolveDirectory(configDirectory))
  }

  private static async startTelemetry(config: WorkerConfig): Promise<TelemetryHandle> {
    return startTelemetry(
      mapTelemetryConfig({
        enabled: config.telemetry.enabled,
        otlpEndpoint: config.telemetry.otlpEndpoint,
        serviceName: config.telemetry.serviceName,
        appType: config.appType,
      }),
    )
  }

  private static initLogger(config: WorkerConfig): void {
    LoggerLocator.init(
      new PinoLogger({
        level: config.log.level,
        isPretty: config.log.pretty ?? config.nodeEnv === 'development',
      }),
    )
  }

  private static async createContext(config: WorkerConfig): Promise<INestApplicationContext> {
    const {AppModule} = await import('../app/app.module.js')

    return NestFactory.createApplicationContext(AppModule.forRoot(config), {
      logger: ['error'],
      abortOnError: false,
    })
  }

  private static attachShutdown(onShutdown: () => Promise<void>): Promise<void> {
    return new Promise((resolve) => {
      const shutdown = () => {
        void onShutdown().finally(resolve)
      }

      process.once('SIGINT', shutdown)
      process.once('SIGTERM', shutdown)
    })
  }
}
