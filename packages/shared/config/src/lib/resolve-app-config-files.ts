import {existsSync} from 'node:fs'
import {join} from 'node:path'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

/**
 * Default YAML load order for apps: `default.yml`, optional gitignored `local.yml`,
 * then `CONFIG_OVERLAY` when set.
 */
export class AppConfigFiles {
  static resolve(directory: string, env: NodeJS.ProcessEnv = process.env): string[] {
    const files = ['default.yml']

    if (existsSync(join(directory, 'local.yml'))) {
      files.push('local.yml')
    }

    const overlay = env.CONFIG_OVERLAY

    if (TypeScriptUtils.isNil(overlay) || overlay.length === 0) {
      return files
    }

    if (!existsSync(join(directory, overlay))) {
      throw new Error(`CONFIG_OVERLAY "${overlay}" was not found in "${directory}"`)
    }

    files.push(overlay)

    return files
  }

  /** `CONFIG_DIR` when set, otherwise the app's compiled or source config directory. */
  static resolveDirectory(fallbackDirectory: string, env: NodeJS.ProcessEnv = process.env): string {
    const configured = env.CONFIG_DIR

    if (TypeScriptUtils.isNil(configured) || configured.length === 0) {
      return fallbackDirectory
    }

    return configured
  }
}
