import {describe, expect, it} from 'vitest'

import {appEnvSchema, kitAppEnvSchema, nodeEnvSchema} from './env-schemas'

describe('nodeEnvSchema', () => {
  it('keeps production and coerces everything else to development', () => {
    expect(nodeEnvSchema.parse('production')).toBe('production')
    expect(nodeEnvSchema.parse('development')).toBe('development')
    expect(nodeEnvSchema.parse('test')).toBe('development')
    expect(nodeEnvSchema.parse(undefined)).toBe('development')
  })
})

describe('appEnvSchema', () => {
  it('accepts staging and production only', () => {
    expect(appEnvSchema.parse('staging')).toBe('staging')
    expect(appEnvSchema.parse('production')).toBe('production')
    expect(() => appEnvSchema.parse('development')).toThrow()
    expect(() => appEnvSchema.parse('preview')).toThrow()
  })
})

describe('kitAppEnvSchema', () => {
  it('accepts development in addition to product appEnv values', () => {
    expect(kitAppEnvSchema.parse('development')).toBe('development')
    expect(kitAppEnvSchema.parse('staging')).toBe('staging')
    expect(kitAppEnvSchema.parse('production')).toBe('production')
    expect(() => kitAppEnvSchema.parse('preview')).toThrow()
  })
})
