import {describe, expect, it} from 'vitest'

import {mapTelemetryConfig} from './map-telemetry-config'
import {TELEMETRY_ENDPOINT_REQUIRED} from './telemetry-config'

describe('mapTelemetryConfig', () => {
  it('defaults serviceName from APP_TYPE', () => {
    expect(
      mapTelemetryConfig({
        TELEMETRY_ENABLED: 'false',
        APP_TYPE: 'worker',
      }),
    ).toEqual({enabled: false, serviceName: 'worker'})
  })

  it('throws when enabled without an endpoint', () => {
    expect(() =>
      mapTelemetryConfig({
        TELEMETRY_ENABLED: 'true',
        APP_TYPE: 'api',
      }),
    ).toThrow(TELEMETRY_ENDPOINT_REQUIRED)
  })
})
