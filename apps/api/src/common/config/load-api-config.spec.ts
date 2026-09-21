import {mkdirSync, mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {describe, expect, it} from 'vitest'

import {ConfigValidationError} from '@b2b-saas-starter-kit/config'

import {loadApiConfig} from './load-api-config'

describe('loadApiConfig', () => {
  it('loads YAML structure and overlays secrets from env', () => {
    const directory = createApiConfigDir()

    const config = loadApiConfig(directory, {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://app@postgres:5432/app',
      REDIS_URL: 'redis://redis:6379',
      JWT_ACCESS_SECRET: 'production-jwt-access-secret',
    })

    expect(config.appEnv).toBe('development')
    expect(config.nodeEnv).toBe('production')
    expect(config.http.cors.origins).toEqual(['http://localhost:4200'])
    expect(config.postgres.url).toBe('postgres://app@postgres:5432/app')
    expect(config.postgres.poolMax).toBe(10)
    expect(config.redis.url).toBe('redis://redis:6379')
    expect(config.jwt.accessSecret).toBe('production-jwt-access-secret')
    expect(config.mail).toBeUndefined()
  })

  it('overlays SMTP mail secrets when YAML selects the smtp transport', () => {
    const directory = createApiConfigDir(`
appEnv: development
http:
  cors:
    origins:
      - http://localhost:4200
postgres:
  poolMax: 10
redis: {}
jwt:
  issuer: test
mail:
  transport: smtp
  from: noreply@example.com
  host: smtp.example.com
`)

    const config = loadApiConfig(directory, {
      DATABASE_URL: 'postgres://app@postgres:5432/app',
      REDIS_URL: 'redis://redis:6379',
      MAIL_PASS: 'smtp-secret',
    })

    expect(config.mail).toEqual({
      transport: 'smtp',
      from: 'noreply@example.com',
      host: 'smtp.example.com',
      port: 587,
      pass: 'smtp-secret',
      secure: false,
    })
  })

  it('overlays an HTTP mail API key when YAML selects the http transport', () => {
    const directory = createApiConfigDir(`
appEnv: development
http:
  cors:
    origins:
      - http://localhost:4200
postgres:
  poolMax: 10
redis: {}
jwt:
  issuer: test
mail:
  transport: http
  from: noreply@example.com
  url: https://mail.example.com/send
`)

    const config = loadApiConfig(directory, {
      DATABASE_URL: 'postgres://app@postgres:5432/app',
      REDIS_URL: 'redis://redis:6379',
      MAIL_API_KEY: 'http-mail-key',
    })

    expect(config.mail).toEqual({
      transport: 'http',
      from: 'noreply@example.com',
      url: 'https://mail.example.com/send',
      apiKey: 'http-mail-key',
    })
  })

  it('fails when DATABASE_URL is missing', () => {
    const directory = createApiConfigDir()

    expect(() =>
      loadApiConfig(directory, {
        REDIS_URL: 'redis://redis:6379',
      }),
    ).toThrow(ConfigValidationError)
  })
})

function createApiConfigDir(
  yaml = `
appEnv: development
http:
  cors:
    origins:
      - http://localhost:4200
    credentials: true
postgres:
  poolMax: 10
redis: {}
jwt:
  issuer: test
`,
): string {
  const directory = mkdtempSync(join(tmpdir(), 'api-config-'))

  mkdirSync(directory, {recursive: true})
  writeFileSync(join(directory, 'default.yml'), yaml, 'utf8')

  return directory
}
