export type AppEnv = 'development' | 'staging' | 'production'

export type EnvironmentConfig = {
  env: AppEnv
  apiBaseUrl: string
}

export type ViteRuntimeFlags = Pick<ImportMetaEnv, 'MODE' | 'DEV' | 'PROD'>
