import {createJiti} from 'jiti'
import {fileURLToPath} from 'node:url'
import type {Plugin} from 'vite'

import type {ConfigLoaderPackage, WebConfigSchemaPackage} from './web-config.plugin.types'

export class WebConfigPlugin {
  private static readonly virtualId = 'virtual:web-config'

  private static readonly resolvedId = `\0${WebConfigPlugin.virtualId}`

  static create(): Plugin {
    return {
      name: 'web-config',
      resolveId(id) {
        if (id === WebConfigPlugin.virtualId) {
          return WebConfigPlugin.resolvedId
        }

        return undefined
      },
      async load(id) {
        if (id !== WebConfigPlugin.resolvedId) {
          return undefined
        }

        const jiti = createJiti(import.meta.url)
        const {AppConfigFiles, ConfigLoader} = await jiti.import<ConfigLoaderPackage>('@b2b-saas-starter-kit/config')
        const {webConfigSchema} = await jiti.import<WebConfigSchemaPackage>(
          fileURLToPath(new URL('../../../app/web-config.schema.ts', import.meta.url)),
        )
        const directory = fileURLToPath(new URL('../../..', import.meta.url))
        const config = ConfigLoader.load(webConfigSchema, {
          source: 'yaml',
          directory,
          files: AppConfigFiles.resolve(directory),
          envOverlay: {nodeEnv: 'NODE_ENV'},
        })

        return `export const webConfig = ${JSON.stringify(config)}`
      },
    }
  }
}
