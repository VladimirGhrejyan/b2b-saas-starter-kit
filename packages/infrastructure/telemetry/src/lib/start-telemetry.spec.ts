import {beforeEach, describe, expect, it, vi} from 'vitest'

import {startNodeSdk} from './sdk/start-node-sdk'
import {startTelemetry} from './start-telemetry'

vi.mock('./sdk/start-node-sdk', () => ({
  startNodeSdk: vi.fn(() => ({shutdown: async () => undefined})),
}))

describe('startTelemetry', () => {
  beforeEach(() => {
    vi.mocked(startNodeSdk).mockClear()
  })

  it('does not load the SDK when disabled', async () => {
    const handle = await startTelemetry({enabled: false, serviceName: 'api'})

    expect(startNodeSdk).not.toHaveBeenCalled()
    await expect(handle.shutdown()).resolves.toBeUndefined()
  })

  it('starts the SDK when enabled', async () => {
    const config = {
      enabled: true,
      serviceName: 'api',
      otlpEndpoint: 'http://collector:4318',
    } as const

    await startTelemetry(config)

    expect(startNodeSdk).toHaveBeenCalledWith(config)
  })
})
