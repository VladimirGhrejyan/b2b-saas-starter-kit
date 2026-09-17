export type BakedAdminConfig = {
  env: 'development' | 'staging' | 'production'
  apiBaseUrl: string
}

export type ConfigLoaderPackage = {
  ConfigLoader: {
    load: (schema: unknown, options: {source: 'yaml'; directory: string; files?: string[]}) => BakedAdminConfig
  }
}

export type AdminConfigSchemaPackage = {
  adminConfigSchema: unknown
}
