export type AppEnv = 'development' | 'staging' | 'production'

export type NodeEnv = 'development' | 'production'

export type EnvironmentConfig = {
  appEnv: AppEnv
  nodeEnv: NodeEnv
  apiBaseUrl: string
}

export type ViteRuntimeFlags = Pick<ImportMetaEnv, 'MODE' | 'DEV' | 'PROD'>
