import {AppConfigFiles, ConfigLoader} from '@b2b-saas-starter-kit/config'

import {type ApiConfig, apiConfigSchema} from './api-config.schema'
import {API_ENV_OVERLAY} from './api-env'

export function loadApiConfig(directory: string, env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return ConfigLoader.load(apiConfigSchema, {
    source: 'yaml',
    directory,
    files: AppConfigFiles.resolve(directory, env),
    envOverlay: API_ENV_OVERLAY,
    env,
  })
}
