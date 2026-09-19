import {OTLPMetricExporter} from '@opentelemetry/exporter-metrics-otlp-http'
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http'
import {HttpInstrumentation} from '@opentelemetry/instrumentation-http'
import {IORedisInstrumentation} from '@opentelemetry/instrumentation-ioredis'
import {PgInstrumentation} from '@opentelemetry/instrumentation-pg'
import {UndiciInstrumentation} from '@opentelemetry/instrumentation-undici'
import {AggregationTemporality, PeriodicExportingMetricReader} from '@opentelemetry/sdk-metrics'
import {NodeSDK} from '@opentelemetry/sdk-node'

import {TELEMETRY_ENDPOINT_REQUIRED, type TelemetryConfig} from '../config/telemetry-config'
import type {TelemetryHandle} from '../config/telemetry-handle.types'

import {IgnoredIncomingPaths} from './ignored-incoming-paths'
import {OtlpExportUrls} from './otlp-export-urls'

export function startNodeSdk(config: TelemetryConfig): TelemetryHandle {
  const endpoint = config.otlpEndpoint

  if (endpoint === undefined) {
    throw new Error(TELEMETRY_ENDPOINT_REQUIRED)
  }

  const sdk = new NodeSDK({
    serviceName: config.serviceName,
    traceExporter: new OTLPTraceExporter({
      url: OtlpExportUrls.traces(endpoint),
    }),
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: OtlpExportUrls.metrics(endpoint),
          temporalityPreference: AggregationTemporality.CUMULATIVE,
        }),
      }),
    ],
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) => IgnoredIncomingPaths.matches(request.url),
      }),
      new PgInstrumentation(),
      new IORedisInstrumentation(),
      new UndiciInstrumentation(),
    ],
  })

  sdk.start()

  let didShutdown = false

  return {
    shutdown: async () => {
      if (didShutdown) {
        return
      }

      didShutdown = true
      await sdk.shutdown()
    },
  }
}
