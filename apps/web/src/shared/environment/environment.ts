import type {AppEnv, EnvironmentConfig, ViteRuntimeFlags} from './environment.types'

export class Environment {
  constructor(
    private readonly config: EnvironmentConfig,
    private readonly vite: ViteRuntimeFlags,
  ) {}

  get apiBaseUrl(): string {
    return this.config.apiBaseUrl
  }

  get appEnv(): AppEnv {
    return this.config.env
  }

  get mode(): string {
    return this.vite.MODE
  }

  get isDev(): boolean {
    return this.vite.DEV
  }

  get isProd(): boolean {
    return this.vite.PROD
  }

  get isStaging(): boolean {
    return this.config.env === 'staging'
  }

  get isProduction(): boolean {
    return this.config.env === 'production'
  }
}
