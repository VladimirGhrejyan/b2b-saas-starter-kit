import {describe, expect, it} from 'vitest'

import {healthOutputSchema} from './health.output'

describe('healthOutputSchema', () => {
  it('parses a liveness envelope without checks', () => {
    const parsed = healthOutputSchema.parse({status: 'ok'})

    expect(parsed).toEqual({status: 'ok'})
  })

  it('parses a readiness envelope with up and down checks', () => {
    const parsed = healthOutputSchema.parse({
      status: 'error',
      checks: {
        postgres: {status: 'up'},
        redis: {status: 'down', message: 'unreachable'},
      },
    })

    expect(parsed.status).toBe('error')
    expect(parsed.checks?.redis).toEqual({status: 'down', message: 'unreachable'})
  })

  it('rejects an invalid status', () => {
    const result = healthOutputSchema.safeParse({status: 'degraded'})

    expect(result.success).toBe(false)
  })
})
