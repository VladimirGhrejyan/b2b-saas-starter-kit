export type BakedAdminConfig = {
  appEnv: 'development' | 'staging' | 'production'
  nodeEnv: 'development' | 'production'
  apiBaseUrl: string
}

export type ConfigLoaderPackage = {
  AppConfigFiles: {
    resolve: (directory: string) => string[]
  }
  ConfigLoader: {
    load: (
      schema: unknown,
      options: {
        source: 'yaml'
        directory: string
        files?: string[]
        envOverlay?: Record<string, string>
      },
    ) => BakedAdminConfig
  }
}

export type AdminConfigSchemaPackage = {
  adminConfigSchema: unknown
}
