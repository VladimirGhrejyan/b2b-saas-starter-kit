import {describe, expect, it} from 'vitest'

import {tryLoadSmtpConfigFromEnv} from './load-smtp-config'

describe('tryLoadSmtpConfigFromEnv', () => {
  it('returns null when SMTP_HOST is missing', () => {
    expect(tryLoadSmtpConfigFromEnv({})).toBeNull()
  })

  it('loads host, from, and defaults', () => {
    expect(
      tryLoadSmtpConfigFromEnv({
        SMTP_HOST: 'smtp.example.com',
        SMTP_FROM: 'noreply@example.com',
      }),
    ).toEqual({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: 587,
      SMTP_FROM: 'noreply@example.com',
    })
  })
})
