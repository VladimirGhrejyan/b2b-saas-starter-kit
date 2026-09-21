import {describe, expect, it} from 'vitest'

import {mapTelemetryConfig} from './map-telemetry-config'
import {TELEMETRY_ENDPOINT_REQUIRED} from './telemetry-config'

describe('mapTelemetryConfig', () => {
  it('defaults serviceName from appType', () => {
    expect(
      mapTelemetryConfig({
        enabled: false,
        appType: 'worker',
      }),
    ).toEqual({enabled: false, serviceName: 'worker'})
  })

  it('throws when enabled without an endpoint', () => {
    expect(() =>
      mapTelemetryConfig({
        enabled: true,
        appType: 'api',
      }),
    ).toThrow(TELEMETRY_ENDPOINT_REQUIRED)
  })
})
