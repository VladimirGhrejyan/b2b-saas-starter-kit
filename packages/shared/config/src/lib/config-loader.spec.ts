import {mkdirSync, mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {describe, expect, it} from 'vitest'
import {z} from 'zod'

import {ConfigLoader} from './config-loader'
import {ConfigValidationError} from './config-validation.error'

const SampleSchema = z.object({
  app: z.object({
    name: z.string(),
    port: z.number().int(),
  }),
  feature: z.object({enabled: z.boolean()}).optional(),
})

describe('ConfigLoader', () => {
  it('loads and validates a single YAML file', () => {
    const directory = createConfigDir({
      'config.yml': `
app:
  name: api
  port: 3000
`,
    })

    const config = ConfigLoader.load(SampleSchema, {source: 'yaml', directory})

    expect(config).toEqual({app: {name: 'api', port: 3000}})
  })

  it('deep-merges nested YAML mappings (later wins, siblings kept)', () => {
    const NestedSchema = z.object({
      http: z.object({
        port: z.number().int(),
        cors: z.object({origins: z.array(z.string()), credentials: z.boolean()}),
      }),
    })
    const directory = createConfigDir({
      'default.yml': `
http:
  port: 3000
  cors:
    origins:
      - http://localhost:4200
    credentials: true
`,
      'overlay.yml': `
http:
  cors:
    origins:
      - https://app.example.com
`,
    })

    const config = ConfigLoader.load(NestedSchema, {
      source: 'yaml',
      directory,
      files: ['default.yml', 'overlay.yml'],
    })

    expect(config).toEqual({
      http: {
        port: 3000,
        cors: {origins: ['https://app.example.com'], credentials: true},
      },
    })
  })

  it('merges multiple YAML files (later wins)', () => {
    const directory = createConfigDir({
      '01-base.yml': `
app:
  name: api
  port: 3000
feature:
  enabled: false
`,
      '02-overlay.yml': `
app:
  name: api
  port: 4000
feature:
  enabled: true
`,
    })

    const config = ConfigLoader.load(SampleSchema, {source: 'yaml', directory})

    expect(config).toEqual({
      app: {name: 'api', port: 4000},
      feature: {enabled: true},
    })
  })

  it('uses explicit files list in order', () => {
    const directory = createConfigDir({
      'b.yml': `
app:
  name: from-b
  port: 2
`,
      'a.yml': `
app:
  name: from-a
  port: 1
`,
    })

    const config = ConfigLoader.load(SampleSchema, {
      source: 'yaml',
      directory,
      files: ['a.yml', 'b.yml'],
    })

    expect(config.app.name).toBe('from-b')
    expect(config.app.port).toBe(2)
  })

  it('throws ConfigValidationError when schema fails', () => {
    const directory = createConfigDir({
      'config.yml': `
app:
  name: api
  port: not-a-number
`,
    })

    expect(() => ConfigLoader.load(SampleSchema, {source: 'yaml', directory})).toThrow(ConfigValidationError)
  })

  it('throws when directory is missing', () => {
    expect(() =>
      ConfigLoader.load(SampleSchema, {source: 'yaml', directory: join(tmpdir(), 'missing-config-dir-xyz')}),
    ).toThrow(/Cannot read config directory/)
  })

  it('throws when no YAML files are present', () => {
    const directory = mkdtempSync(join(tmpdir(), 'config-empty-'))

    mkdirSync(directory, {recursive: true})

    expect(() => ConfigLoader.load(SampleSchema, {source: 'yaml', directory})).toThrow(/No YAML config files/)
  })

  it('throws when YAML root is not a mapping', () => {
    const directory = createConfigDir({
      'config.yml': `- just\n- a\n- list\n`,
    })

    expect(() => ConfigLoader.load(SampleSchema, {source: 'yaml', directory})).toThrow(/YAML mapping/)
  })

  it('overlays selected env vars onto YAML paths', () => {
    const OverlaySchema = z.object({
      nodeEnv: z.string(),
      postgres: z.object({url: z.url(), poolMax: z.number().int()}),
    })
    const directory = createConfigDir({
      'default.yml': `
postgres:
  poolMax: 10
`,
    })

    const config = ConfigLoader.load(OverlaySchema, {
      source: 'yaml',
      directory,
      files: ['default.yml'],
      envOverlay: {nodeEnv: 'NODE_ENV', 'postgres.url': 'DATABASE_URL'},
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://app@postgres:5432/app',
      },
    })

    expect(config).toEqual({
      nodeEnv: 'production',
      postgres: {url: 'postgres://app@postgres:5432/app', poolMax: 10},
    })
  })

  it('skips undefined overlay env vars so Zod can fail required secrets', () => {
    const SecretSchema = z.object({
      postgres: z.object({url: z.url()}),
    })
    const directory = createConfigDir({
      'default.yml': `postgres: {}\n`,
    })

    expect(() =>
      ConfigLoader.load(SecretSchema, {
        source: 'yaml',
        directory,
        files: ['default.yml'],
        envOverlay: {'postgres.url': 'DATABASE_URL'},
        env: {},
      }),
    ).toThrow(ConfigValidationError)
  })
})

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int(),
})

describe('ConfigLoader (env source)', () => {
  it('reads and validates variables from an explicit env, coercing strings', () => {
    const config = ConfigLoader.load(EnvSchema, {
      source: 'env',
      env: {DATABASE_URL: 'postgres://app@postgres:5432/app', PORT: '3000', UNUSED: 'x'},
    })

    expect(config).toEqual({DATABASE_URL: 'postgres://app@postgres:5432/app', PORT: 3000})
  })

  it('filters by prefix and strips it from result keys', () => {
    const config = ConfigLoader.load(EnvSchema, {
      source: 'env',
      prefix: 'APP_',
      env: {APP_DATABASE_URL: 'postgres://app@postgres:5432/app', APP_PORT: '4000', OTHER: 'ignored'},
    })

    expect(config).toEqual({DATABASE_URL: 'postgres://app@postgres:5432/app', PORT: 4000})
  })

  it('restricts to an explicit key list', () => {
    const raw = ConfigLoader.load(z.object({PORT: z.coerce.number()}), {
      source: 'env',
      keys: ['PORT'],
      env: {PORT: '5000', DATABASE_URL: 'postgres://app@postgres:5432/app'},
    })

    expect(raw).toEqual({PORT: 5000})
  })

  it('drops undefined variables (missing required key fails validation)', () => {
    expect(() =>
      ConfigLoader.load(EnvSchema, {
        source: 'env',
        env: {PORT: '3000'},
      }),
    ).toThrow(ConfigValidationError)
  })
})

function createConfigDir(files: Record<string, string>): string {
  const directory = mkdtempSync(join(tmpdir(), 'config-fixtures-'))

  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(join(directory, name), contents, 'utf8')
  }

  return directory
}
