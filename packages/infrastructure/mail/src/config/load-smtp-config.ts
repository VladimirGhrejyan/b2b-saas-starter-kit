import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import type {SmtpConfig} from './smtp-config'
import {smtpConfigSchema} from './smtp-config'

/**
 * Loads SMTP config when `SMTP_HOST` is set. Returns null so composition can keep the logging stub.
 */
export function tryLoadSmtpConfigFromEnv(env: NodeJS.ProcessEnv = process.env): SmtpConfig | null {
  if (env.SMTP_HOST === undefined || env.SMTP_HOST === '') {
    return null
  }

  return ConfigLoader.load(smtpConfigSchema, {
    source: 'env',
    keys: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'SMTP_SECURE'],
    env,
  })
}
