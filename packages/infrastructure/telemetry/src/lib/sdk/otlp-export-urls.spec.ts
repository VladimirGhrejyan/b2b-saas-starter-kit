import {describe, expect, it} from 'vitest'

import {OtlpExportUrls} from './otlp-export-urls'

describe('OtlpExportUrls', () => {
  it('appends standard OTLP HTTP paths', () => {
    expect(OtlpExportUrls.traces('http://collector:4318')).toBe('http://collector:4318/v1/traces')
    expect(OtlpExportUrls.metrics('http://collector:4318/')).toBe('http://collector:4318/v1/metrics')
  })
})
