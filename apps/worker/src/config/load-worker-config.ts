import {AppConfigFiles, ConfigLoader} from '@b2b-saas-starter-kit/config'

import {type WorkerConfig, workerConfigSchema} from './worker-config.schema'
import {WORKER_ENV_OVERLAY} from './worker-env'

export function loadWorkerConfig(directory: string, env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  return ConfigLoader.load(workerConfigSchema, {
    source: 'yaml',
    directory,
    files: AppConfigFiles.resolve(directory, env),
    envOverlay: WORKER_ENV_OVERLAY,
    env,
  })
}
