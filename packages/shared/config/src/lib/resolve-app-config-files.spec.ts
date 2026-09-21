import {mkdirSync, mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {describe, expect, it} from 'vitest'

import {AppConfigFiles} from './resolve-app-config-files'

describe('AppConfigFiles', () => {
  it('returns default.yml and optional local.yml plus CONFIG_OVERLAY', () => {
    const directory = mkdtempSync(join(tmpdir(), 'config-files-'))

    mkdirSync(directory, {recursive: true})
    writeFileSync(join(directory, 'default.yml'), 'appEnv: development\n')
    writeFileSync(join(directory, 'local.yml'), 'log:\n  pretty: true\n')
    writeFileSync(join(directory, 'staging.yml'), 'appEnv: staging\n')

    expect(AppConfigFiles.resolve(directory, {})).toEqual(['default.yml', 'local.yml'])
    expect(AppConfigFiles.resolve(directory, {CONFIG_OVERLAY: 'staging.yml'})).toEqual([
      'default.yml',
      'local.yml',
      'staging.yml',
    ])
  })

  it('throws when CONFIG_OVERLAY is missing', () => {
    const directory = mkdtempSync(join(tmpdir(), 'config-files-missing-'))

    mkdirSync(directory, {recursive: true})
    writeFileSync(join(directory, 'default.yml'), 'appEnv: development\n')

    expect(() => AppConfigFiles.resolve(directory, {CONFIG_OVERLAY: 'staging.yml'})).toThrow(/CONFIG_OVERLAY/)
  })

  it('prefers CONFIG_DIR when set', () => {
    expect(AppConfigFiles.resolveDirectory('/app/config', {CONFIG_DIR: '/etc/api'})).toBe('/etc/api')
    expect(AppConfigFiles.resolveDirectory('/app/config', {})).toBe('/app/config')
  })
})
