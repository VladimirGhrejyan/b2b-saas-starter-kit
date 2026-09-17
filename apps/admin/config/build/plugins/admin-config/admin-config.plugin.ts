import {createJiti} from 'jiti'
import {fileURLToPath} from 'node:url'
import type {Plugin} from 'vite'

import type {AdminConfigSchemaPackage, ConfigLoaderPackage} from './admin-config.plugin.types'

export class AdminConfigPlugin {
  private static readonly virtualId = 'virtual:admin-config'

  private static readonly resolvedId = `\0${AdminConfigPlugin.virtualId}`

  static create(): Plugin {
    return {
      name: 'admin-config',
      resolveId(id) {
        if (id === AdminConfigPlugin.virtualId) {
          return AdminConfigPlugin.resolvedId
        }

        return undefined
      },
      async load(id) {
        if (id !== AdminConfigPlugin.resolvedId) {
          return undefined
        }

        const jiti = createJiti(import.meta.url)
        const {ConfigLoader} = await jiti.import<ConfigLoaderPackage>('@b2b-saas-starter-kit/config')
        const {adminConfigSchema} = await jiti.import<AdminConfigSchemaPackage>(
          fileURLToPath(new URL('../../../app/admin-config.schema.ts', import.meta.url)),
        )
        const config = ConfigLoader.load(adminConfigSchema, {
          source: 'yaml',
          directory: fileURLToPath(new URL('../../../../.env', import.meta.url)),
          files: ['config.yml'],
        })

        return `export const adminConfig = ${JSON.stringify(config)}`
      },
    }
  }
}
