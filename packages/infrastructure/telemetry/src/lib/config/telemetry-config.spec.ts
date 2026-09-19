import {describe, expect, it} from 'vitest'

import {TELEMETRY_ENDPOINT_REQUIRED, telemetryConfigSchema} from './telemetry-config'

describe('telemetryConfigSchema', () => {
  it('accepts a disabled config without an endpoint', () => {
    expect(telemetryConfigSchema.parse({enabled: false, serviceName: 'api'})).toEqual({
      enabled: false,
      serviceName: 'api',
    })
  })

  it('accepts an enabled config with an endpoint', () => {
    expect(
      telemetryConfigSchema.parse({
        enabled: true,
        serviceName: 'api',
        otlpEndpoint: 'http://collector:4318',
      }),
    ).toEqual({
      enabled: true,
      serviceName: 'api',
      otlpEndpoint: 'http://collector:4318',
    })
  })

  it('rejects enabled without an endpoint', () => {
    const result = telemetryConfigSchema.safeParse({enabled: true, serviceName: 'api'})

    expect(result.success).toBe(false)

    if (result.success) {
      return
    }

    expect(result.error.issues[0]?.message).toBe(TELEMETRY_ENDPOINT_REQUIRED)
  })
})
