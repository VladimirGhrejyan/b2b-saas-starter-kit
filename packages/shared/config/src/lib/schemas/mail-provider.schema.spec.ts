import {describe, expect, it} from 'vitest'

import {mailProviderSchema} from './mail-provider.schema'

describe('mailProviderSchema', () => {
  it('accepts an SMTP transport and applies port/secure defaults', () => {
    expect(
      mailProviderSchema.parse({
        transport: 'smtp',
        from: 'noreply@example.com',
        host: 'smtp.example.com',
      }),
    ).toEqual({
      transport: 'smtp',
      from: 'noreply@example.com',
      host: 'smtp.example.com',
      port: 587,
      secure: false,
    })
  })

  it('accepts an HTTP emailing service', () => {
    expect(
      mailProviderSchema.parse({
        transport: 'http',
        from: 'noreply@example.com',
        url: 'https://mail.example.com/send',
      }),
    ).toEqual({
      transport: 'http',
      from: 'noreply@example.com',
      url: 'https://mail.example.com/send',
    })
  })

  it('rejects a mix of SMTP and HTTP fields without a transport', () => {
    expect(() =>
      mailProviderSchema.parse({
        from: 'noreply@example.com',
        host: 'smtp.example.com',
        url: 'https://mail.example.com/send',
      }),
    ).toThrow()
  })
})
